"""
Serves the ZubHub app's "find cultural inspiration" feature.

Two-step flow:
  1. POST /suggest — retrieval-only. Educator's materials → grid of
     culturally-specific Wikipedia articles. The model is NOT called here.
  2. POST /activity — given ONE article + materials + age range, the
     fine-tuned model generates a full STEAM activity grounded in that
     single culture. Focusing on one culture (vs. K=3 mixed) lets the
     model produce specific steps instead of generic ones.

Run:
    source venv/bin/activate
    uvicorn server:app --host 0.0.0.0 --port 8000 --reload
"""

import json
from contextlib import asynccontextmanager
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from mlx_lm import load, generate
from sentence_transformers import SentenceTransformer

from evaluate import try_parse_json, culture_words
from rag_evaluate import (
    EMBEDDER_NAME, INDEX_DIR, load_index, retrieve, query_for_retrieval,
)
from safety import BLOCK_MESSAGE, screen_inputs, screen_text

MODEL_NAME = "mlx-community/Qwen2.5-1.5B-Instruct-4bit"
ADAPTER_PATH = "adapters"
# Serve the iter-400 checkpoint, not the final/600 weights. Validation loss
# bottomed out around iter 300 and rose afterward (mild overfitting); of the
# saved checkpoints (200/400/600), 400 has the lowest val loss and ties the
# best test scores. The default adapters.safetensors is the 600 copy, so we
# override the weights with the 400 file explicitly after load. See evaluate.py.
ADAPTER_CHECKPOINT = "0000400_adapters.safetensors"
MAX_TOKENS = 800

DEFAULT_K = 12
# Over-retrieve before culture-filtering so we still hit `k` results after
# dropping articles that aren't tied to a specific tradition.
RETRIEVE_OVER_FACTOR = 3
ARTICLE_CTX_CHARS = 1500   # how much of the chosen article to feed the model

SYSTEM_PROMPT = (
    "You are a STEAM activity assistant for ZubHub, a hands-on education "
    "platform for children. Given the materials an educator has and the "
    "children's age range, suggest creative STEAM activity ideas grounded "
    "in cultural context. Respond with JSON only. "
    "Everything you produce is for children. Never suggest or describe how to "
    "make alcohol, drugs, tobacco, weapons, explosives, or poisons, and never "
    "give activities that are unsafe for the stated age range. (This is a "
    "soft reminder only — the server screens inputs and outputs separately.)"
)


# ─── Cultural-specificity filter ──────────────────────────────────────────

# Generic craft / material words that aren't cultural markers. An article
# whose title contains ONLY these (e.g. "Art pottery", "Paper craft") isn't
# tied to a specific culture, so it shouldn't appear as cultural inspiration.
CRAFT_STOPWORDS = {
    "pottery", "ceramic", "ceramics", "craft", "crafts", "art", "arts",
    "artwork", "workshop", "design", "designs", "making", "needlework",
    "weaving", "sculpture", "painting", "drawing", "carving", "fibre",
    "fiber", "textile", "textiles", "paper", "wood", "clay", "thread",
    "fabric", "studio", "study", "studies", "history", "century",
    "form", "style", "object", "objects", "vessel", "vessels",
}


def cultural_markers(text):
    """Words from `text` that look like cultural/geographic markers
    (peoples, places, traditions) — excluding generic craft vocabulary."""
    return culture_words(text) - CRAFT_STOPWORDS


def is_culturally_specific(meta):
    """True if the article's title contains a non-craft word — i.e. names
    a country, region, or people. Excludes "Art pottery", "Paper craft", etc."""
    return bool(cultural_markers(meta.get("title", "")))


# ─── Lifespan: load index + model once at startup ─────────────────────────
state = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"[startup] loading index from {INDEX_DIR}")
    state["embeddings"], state["meta"] = load_index()
    state["meta_by_id"] = {m["id"]: m for m in state["meta"]}
    print(f"[startup] loading embedder {EMBEDDER_NAME}")
    state["embedder"] = SentenceTransformer(EMBEDDER_NAME)
    print(f"[startup] loading {MODEL_NAME} + adapter {ADAPTER_PATH}")
    state["model"], state["tokenizer"] = load(MODEL_NAME, adapter_path=ADAPTER_PATH)
    if ADAPTER_CHECKPOINT:
        ckpt = Path(ADAPTER_PATH) / ADAPTER_CHECKPOINT
        if not ckpt.exists():
            raise FileNotFoundError(f"adapter checkpoint not found: {ckpt}")
        print(f"[startup] overriding adapter weights with checkpoint {ckpt}")
        state["model"].load_weights(str(ckpt), strict=False)
    print("[startup] ready")
    yield
    state.clear()


app = FastAPI(title="ZubHub cultural-inspiration server", lifespan=lifespan)

# Lets the React Native app (Metro on a different origin) call this.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


# ─── Schemas ──────────────────────────────────────────────────────────────
class SuggestRequest(BaseModel):
    materials: List[str] = Field(..., min_length=1)
    theme: Optional[str] = None
    k: int = DEFAULT_K


class InspirationResult(BaseModel):
    id: int
    title: str
    sim: float
    url: Optional[str] = None
    image_url: Optional[str] = None
    summary: Optional[str] = None


class SuggestResponse(BaseModel):
    results: List[InspirationResult]
    # When the request is screened out by safety, results is empty, blocked is
    # True, and notice carries a friendly message for the educator.
    blocked: bool = False
    notice: Optional[str] = None


class ActivityRequest(BaseModel):
    article_id: int
    materials: List[str] = Field(..., min_length=1)
    age_range: List[int] = Field(..., min_length=2, max_length=2)


class ActivityResponse(BaseModel):
    activity: dict
    article: InspirationResult


# ─── Routes ───────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {
        "ok": True,
        "articles": len(state.get("meta", [])),
        "model": MODEL_NAME,
        "adapter": ADAPTER_PATH,
        "checkpoint": ADAPTER_CHECKPOINT or "adapters.safetensors",
    }


@app.post("/suggest", response_model=SuggestResponse)
def suggest(req: SuggestRequest):
    """Retrieval only — returns a grid of culturally-specific crafts that
    use the educator's materials. Model is not called."""
    # Safety gate (primary): screen before retrieval so unsafe materials never
    # surface a grid — and therefore can never lead to an /activity request.
    if screen_inputs(req.materials, req.theme):
        return SuggestResponse(results=[], blocked=True, notice=BLOCK_MESSAGE)

    materials_str = ", ".join(req.materials)
    user_msg = f"I have these materials: {materials_str}."
    if req.theme:
        user_msg += f" Theme: {req.theme}."

    rquery = query_for_retrieval(user_msg)
    raw_hits = retrieve(rquery, state["embedder"],
                        state["embeddings"], state["meta"],
                        req.k * RETRIEVE_OVER_FACTOR)
    cultural = [(m, s) for m, s in raw_hits if is_culturally_specific(m)]
    final = (cultural or raw_hits)[: req.k]

    return SuggestResponse(
        results=[InspirationResult(
            id=m["id"],
            title=m["title"],
            sim=round(sim, 3),
            url=m.get("url"),
            image_url=m.get("image_url"),
            summary=m.get("summary"),
        ) for m, sim in final],
    )


@app.post("/activity", response_model=ActivityResponse)
def activity(req: ActivityRequest):
    """Given ONE chosen article (the user's pick from the /suggest grid)
    plus materials + ages, generate a culturally-grounded STEAM activity.
    The single-culture context is what lets the model produce specific
    steps instead of hedging across traditions."""
    article = state["meta_by_id"].get(req.article_id)
    if not article:
        raise HTTPException(status_code=404, detail="article not found in index")

    # Safety gate (primary): screen the materials/theme and the chosen article
    # before spending a generation. /suggest already screens, but an article
    # could itself be off-topic, so we re-check here too.
    if screen_inputs(req.materials) or screen_text(
        f"{article.get('title', '')} {article.get('summary', '')}"
    ):
        raise HTTPException(status_code=422, detail={"blocked": True,
                                                     "notice": BLOCK_MESSAGE})

    materials_str = ", ".join(req.materials)
    lo, hi = req.age_range
    article_text = (article.get("summary") or "")[:ARTICLE_CTX_CHARS].strip()

    augmented_user = (
        f"Cultural tradition you must build the activity around:\n"
        f"Title: {article['title']}\n"
        f"Article: {article_text}\n\n"
        f"I have these materials: {materials_str}. "
        f"The children are aged {lo}-{hi}. Suggest a STEAM activity "
        f"rooted specifically in the tradition above. In the steps, "
        f"reference at least one technique, tool, motif, or local term "
        f"that appears in the article — not generic craft instructions. "
        f"Set cultural_origin to \"{article['title']}\". "
        f"Respond with JSON in this exact shape: "
        f"{{\"ideas\": [ {{...}} ]}} — keep the ideas array wrapper."
    )
    prompt = state["tokenizer"].apply_chat_template(
        [{"role": "system", "content": SYSTEM_PROMPT},
         {"role": "user", "content": augmented_user}],
        tokenize=False, add_generation_prompt=True,
    )
    raw = generate(state["model"], state["tokenizer"],
                   prompt=prompt, max_tokens=MAX_TOKENS, verbose=False)

    parsed = try_parse_json(raw)
    if not parsed:
        raise HTTPException(status_code=502,
                            detail={"error": "model produced unparseable output",
                                    "raw": raw[:500]})
    if "ideas" not in parsed and isinstance(parsed, dict) and "title" in parsed:
        parsed = {"ideas": [parsed]}
    if "ideas" not in parsed or not parsed["ideas"]:
        raise HTTPException(status_code=502,
                            detail={"error": "model output missing ideas",
                                    "raw": raw[:500]})

    # Safety gate (backstop): scan the generated activity itself, in case the
    # model produced something unsafe that the input screen didn't anticipate.
    if screen_text(json.dumps(parsed["ideas"][0])):
        raise HTTPException(status_code=422, detail={"blocked": True,
                                                     "notice": BLOCK_MESSAGE})

    return ActivityResponse(
        activity=parsed["ideas"][0],
        article=InspirationResult(
            id=article["id"],
            title=article["title"],
            sim=1.0,
            url=article.get("url"),
            image_url=article.get("image_url"),
            summary=article.get("summary"),
        ),
    )
