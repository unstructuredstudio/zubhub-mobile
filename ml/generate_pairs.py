"""
Step 6 of the ZubHub idea-model project: turn the cleaned Wikipedia corpus
into (input -> output) training pairs by distilling them through a local
open-source LLM (Qwen 2.5 7B via Ollama). No paid API, no Claude.

Reads  data/corpus_with_media.jsonl
Writes data/training_pairs.jsonl

For each article we send: title, domains, top categories, summary, and the
first few substantive sections. The model returns one (input -> ideas) pair
in the exact schema below, which is what the fine-tuned model will eventually
learn to produce.

Usage:
    # make sure Ollama is running and the model is pulled
    ollama serve   &      # if not already running as a service
    ollama pull qwen2.5:7b

    python generate_pairs.py
"""

import json
import time
from pathlib import Path

import requests

# ─── Config ──────────────────────────────────────────────────────────────────

OLLAMA_URL = "http://localhost:11434/api/chat"
MODEL = "qwen2.5:7b"

INPUT_PATH = Path("data/corpus_with_media.jsonl")
OUTPUT_PATH = Path("data/training_pairs.jsonl")

# Start small. Set to None to run the full corpus.
LIMIT = 500

TEMPERATURE = 0.7
NUM_PREDICT = 1500           # max output tokens per pair
REQUEST_TIMEOUT = 300        # per-article timeout (seconds)

# ─── Prompts ─────────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are a curriculum design assistant for ZubHub, a platform for hands-on STEAM education activities for children.

Your task: read a Wikipedia article about a craft, traditional technique or making-related topic. Produce ONE training example showing how an educator might ask for activity ideas, and what a good ZubHub-style response would look like — grounded in the article's cultural context.

OUTPUT FORMAT: valid JSON only, matching this schema exactly:
{
  "input": {
    "materials": ["3-6 realistic classroom materials"],
    "age_range": [min_int, max_int],
    "theme": "optional string or null"
  },
  "output": {
    "ideas": [{
      "title": "catchy, max 60 chars",
      "description": "2-3 sentences",
      "category": "one of: Art, Science, Coding, Circuits, Engineering, Storytelling, Drama, Film, Music, Nature",
      "cultural_origin": "specific region or culture",
      "materials_used": ["subset of input materials"],
      "materials_missing": ["anything else needed"],
      "estimated_minutes": integer,
      "steps": ["3-6 short steps, one sentence each"],
      "learning_objectives": ["2-4 objectives"],
      "safety_note": "string or null"
    }]
  }
}

Rules:
- The input materials must be cheap and commonly available in a classroom (cardboard, paper, scissors, glue, string, fabric scraps, bottle caps, paint, etc).
- The idea must clearly relate to the article AND fit the input materials.
- Age range must be realistic K12 (between 5 and 16).
- Cultural origin must be specific and accurate to the article.
- Steps must be doable by the stated age group.
- Add safety_note only when genuinely needed (cutting, heat, sharp tools).
- Output JSON only. No markdown, no commentary.
"""

FEW_SHOT_USER = """Article title: Origami
Cultural domain(s): Crafts & making
Categories: Japanese inventions, Paper folding, Paper art
Summary: Origami is the Japanese art of paper folding. It transforms a flat sheet of paper into a sculpted form through folding techniques without cutting or gluing.

Section — Techniques and materials: The principal technique uses square sheets of paper, with valley folds and mountain folds combined into base forms (the bird base, water-bomb base, etc.).
"""

FEW_SHOT_ASSISTANT = json.dumps({
    "input": {
        "materials": ["square paper sheets", "ruler", "pencil"],
        "age_range": [7, 12],
        "theme": "Japanese culture"
    },
    "output": {
        "ideas": [{
            "title": "Origami Crane Workshop",
            "description": "Students learn the classic Japanese paper crane through valley and mountain folds. The activity connects geometry, symmetry and the cultural story of the thousand cranes.",
            "category": "Art",
            "cultural_origin": "Japan",
            "materials_used": ["square paper sheets"],
            "materials_missing": [],
            "estimated_minutes": 30,
            "steps": [
                "Fold the square diagonally in both directions and unfold to mark the creases.",
                "Bring the corners together to form a smaller square base.",
                "Fold the top flaps inward to make a kite shape.",
                "Shape the head, tail and wings with reverse folds.",
                "Compare students' cranes and discuss symmetry."
            ],
            "learning_objectives": [
                "Recognize geometric symmetry through folding",
                "Practice precise step-following",
                "Connect a craft to its cultural origin"
            ],
            "safety_note": None
        }]
    }
}, ensure_ascii=False)

# ─── Ollama I/O ──────────────────────────────────────────────────────────────


def check_ollama():
    """Confirm Ollama is reachable and the model is available."""
    try:
        r = requests.get("http://localhost:11434/api/tags", timeout=5)
        r.raise_for_status()
        names = [m.get("name", "") for m in r.json().get("models", [])]
        if not any(n == MODEL or n.startswith(MODEL + "@") for n in names):
            print(f"! Model '{MODEL}' not found in Ollama.")
            print(f"  Available: {names}")
            print(f"  Run: ollama pull {MODEL}")
            return False
        print(f"Ollama OK. Models: {names}")
        return True
    except Exception as e:
        print(f"! Cannot reach Ollama at localhost:11434 — is `ollama serve` running? ({e})")
        return False


def build_user_message(rec):
    """Compose the article context block sent to the model."""
    sections_text = "\n\n".join(
        f"Section — {h}: {t[:600]}"
        for h, t in list(rec["sections"].items())[:4]
    )
    return (
        f"Article title: {rec['title']}\n"
        f"Cultural domain(s): {', '.join(rec['domains'])}\n"
        f"Categories: {', '.join(rec['categories'][:8])}\n"
        f"Summary: {rec['summary'][:700]}\n\n"
        f"{sections_text}"
    )


def call_ollama(user_msg, max_retries=2):
    """Call Ollama chat; return parsed dict or None on failure."""
    payload = {
        "model": MODEL,
        "format": "json",          # forces valid-JSON output
        "stream": False,
        "options": {
            "temperature": TEMPERATURE,
            "num_predict": NUM_PREDICT,
        },
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": FEW_SHOT_USER},
            {"role": "assistant", "content": FEW_SHOT_ASSISTANT},
            {"role": "user", "content": user_msg},
        ],
    }
    for attempt in range(max_retries + 1):
        try:
            r = requests.post(OLLAMA_URL, json=payload, timeout=REQUEST_TIMEOUT)
            r.raise_for_status()
            text = r.json().get("message", {}).get("content", "")
            return json.loads(text)
        except (requests.RequestException, json.JSONDecodeError, ValueError):
            if attempt == max_retries:
                return None
            time.sleep(1)
    return None


def validate(pair):
    """Lightweight schema check; True if usable."""
    try:
        inp, out = pair["input"], pair["output"]
        assert isinstance(inp["materials"], list) and inp["materials"]
        assert isinstance(inp["age_range"], list) and len(inp["age_range"]) == 2
        assert isinstance(out["ideas"], list) and out["ideas"]
        for idea in out["ideas"]:
            assert idea.get("title") and idea.get("category")
            assert isinstance(idea.get("steps", []), list) and idea["steps"]
        return True
    except (KeyError, AssertionError, TypeError):
        return False


# ─── Main ────────────────────────────────────────────────────────────────────


def main():
    if not check_ollama():
        return

    rows = [json.loads(l) for l in INPUT_PATH.open(encoding="utf-8")]
    rows.sort(key=lambda r: r.get("relevance", 0), reverse=True)
    if LIMIT:
        rows = rows[:LIMIT]
    print(f"\nProcessing {len(rows)} articles (highest-relevance first)\n")

    written = invalid = errors = 0
    started = time.time()
    with OUTPUT_PATH.open("w", encoding="utf-8") as f:
        for i, rec in enumerate(rows, 1):
            pair = call_ollama(build_user_message(rec))
            if pair is None:
                errors += 1
            elif not validate(pair):
                invalid += 1
            else:
                pair["source"] = {"article": rec["title"], "article_id": rec["id"]}
                f.write(json.dumps(pair, ensure_ascii=False) + "\n")
                written += 1

            if i % 25 == 0:
                elapsed = time.time() - started
                rate = i / elapsed
                eta_min = (len(rows) - i) / rate / 60
                print(f"  {i}/{len(rows)} "
                      f"({written} ok, {invalid} invalid, {errors} errors) "
                      f"| {rate:.2f}/s | ETA {eta_min:.0f}m")

    elapsed = time.time() - started
    print(f"\nDone in {elapsed/60:.1f} min. {written} pairs -> {OUTPUT_PATH}")
    print(f"  invalid JSON / schema: {invalid}")
    print(f"  network/model errors:  {errors}")


if __name__ == "__main__":
    main()
