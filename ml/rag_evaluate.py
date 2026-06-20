"""
Phase 8, step 2: evaluate the model WITH retrieval (RAG).

Same test set, same metrics as evaluate.py. The only difference: before
asking the model, we look up the top-K most relevant Wikipedia articles
from data/index/ and inject their summaries into the prompt as context.

Hypothesis: cultural-specificity (the metric where the plain fine-tune
scored 8%) should improve, because the model now has real article text
to ground its answer in.

Usage:
    python rag_evaluate.py                # fine-tuned + RAG, K=3
    python rag_evaluate.py --no-adapter   # base model + RAG
    python rag_evaluate.py --k 5          # retrieve 5 articles instead of 3
    python rag_evaluate.py --limit 5      # quick smoke test
"""

import argparse
import json
import re
from pathlib import Path

import numpy as np
from mlx_lm import load, generate
from sentence_transformers import SentenceTransformer

from evaluate import (
    MODEL_NAME, TEST_PATH, OUT_DIR,
    extract_user_and_gold, try_parse_json, score,
)

INDEX_DIR = Path("data/index")
EMBEDDER_NAME = "sentence-transformers/all-MiniLM-L6-v2"
# Cap retrieved-summary length so the prompt stays manageable.
CTX_CHARS_PER_DOC = 400


def load_index():
    embeddings = np.load(INDEX_DIR / "embeddings.npy")
    meta = [json.loads(l) for l in (INDEX_DIR / "meta.jsonl").open(encoding="utf-8")]
    return embeddings, meta


def query_for_retrieval(user_msg):
    """Extract materials from the user message and frame as a cultural-craft
    query, so retrieval pulls cultural/traditional articles rather than
    generic 'children's activities' magnets.

    User msg looks like:
      "I have these materials: clay, kiln, glazes. The children are aged ..."
    We pull out "clay, kiln, glazes" and search for cultural crafts that
    use those materials.
    """
    m = re.search(r"materials:\s*([^.]+)\.", user_msg, re.I)
    materials = m.group(1).strip() if m else user_msg
    return f"Traditional cultural craft or art activity using {materials}"


def retrieve(query, embedder, embeddings, meta, k):
    q = embedder.encode([query], normalize_embeddings=True,
                        convert_to_numpy=True)[0].astype(np.float32)
    sims = embeddings @ q
    top = np.argsort(-sims)[:k]
    return [(meta[i], float(sims[i])) for i in top]


def build_rag_prompt(tokenizer, system, user, retrieved):
    ctx_lines = []
    for m, sim in retrieved:
        snippet = m["summary"][:CTX_CHARS_PER_DOC].strip()
        ctx_lines.append(f"- {m['title']}: {snippet}")
    context_block = "\n".join(ctx_lines)
    augmented_user = (
        "Relevant background from Wikipedia:\n"
        f"{context_block}\n\n"
        f"{user}\n"
        "Use the background above to ground your answer in a specific "
        "culture or tradition when appropriate."
    )
    return tokenizer.apply_chat_template(
        [{"role": "system", "content": system},
         {"role": "user", "content": augmented_user}],
        tokenize=False, add_generation_prompt=True,
    )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--adapter", default="adapters")
    ap.add_argument("--no-adapter", action="store_true")
    ap.add_argument("--k", type=int, default=3,
                    help="how many articles to retrieve per query")
    ap.add_argument("--samples", type=int, default=5)
    ap.add_argument("--max-tokens", type=int, default=600)
    ap.add_argument("--limit", type=int, default=None)
    args = ap.parse_args()

    print(f"Loading index from {INDEX_DIR}")
    embeddings, meta = load_index()
    print(f"  {embeddings.shape[0]} articles, dim {embeddings.shape[1]}")

    print(f"Loading embedder: {EMBEDDER_NAME}")
    embedder = SentenceTransformer(EMBEDDER_NAME)

    print(f"Loading {MODEL_NAME}"
          + ("" if args.no_adapter else f" + adapter {args.adapter}"))
    adapter_path = None if args.no_adapter else args.adapter
    model, tokenizer = load(MODEL_NAME, adapter_path=adapter_path)

    examples = [json.loads(l) for l in TEST_PATH.open(encoding="utf-8")]
    if args.limit:
        examples = examples[:args.limit]
    print(f"Evaluating on {len(examples)} test examples, K={args.k}\n")

    results = []
    for i, ex in enumerate(examples, 1):
        system, user, gold = extract_user_and_gold(ex)
        rquery = query_for_retrieval(user)
        retrieved = retrieve(rquery, embedder, embeddings, meta, args.k)
        prompt = build_rag_prompt(tokenizer, system, user, retrieved)
        raw = generate(model, tokenizer, prompt=prompt,
                       max_tokens=args.max_tokens, verbose=False)
        pred = try_parse_json(raw)
        s = score(pred, gold)
        s["_user"] = user
        s["_gold"] = gold
        s["_pred"] = pred
        s["_raw"] = raw
        s["_retrieved"] = [{"title": m["title"], "sim": round(sim, 3)}
                           for m, sim in retrieved]
        results.append(s)
        flags = (("J" if s["json_valid"] else "-")
                 + ("S" if s["schema_ok"] else "-")
                 + ("C" if s["pred_culture_specific"] else "-")
                 + ("M" if s["culture_loose_match"] else "-"))
        top_title = retrieved[0][0]["title"]
        print(f"  [{i:3d}/{len(examples)}] {flags} "
              f"mat={s['materials_jaccard']:.2f} top='{top_title[:40]}'")

    n = len(results)
    n_gold_culture = sum(r["gold_culture_specific"] for r in results) or 1
    summary = {
        "n": n,
        "k": args.k,
        "rag": True,
        "json_valid_rate": sum(r["json_valid"] for r in results) / n,
        "schema_match_rate": sum(r["schema_ok"] for r in results) / n,
        "avg_n_ideas": sum(r["n_ideas"] for r in results) / n,
        "avg_n_steps": sum(r["n_steps"] for r in results) / n,
        "avg_materials_jaccard": sum(r["materials_jaccard"] for r in results) / n,
        "pred_culture_specific_rate": sum(
            r["pred_culture_specific"] for r in results) / n,
        "gold_culture_specific_rate": sum(
            r["gold_culture_specific"] for r in results) / n,
        "culture_loose_match_rate_when_gold_specific": sum(
            r["culture_loose_match"] for r in results) / n_gold_culture,
    }
    print("\n=== Summary (with RAG) ===")
    for k, v in summary.items():
        print(f"  {k}: {v:.3f}" if isinstance(v, float) else f"  {k}: {v}")

    tag = "base" if args.no_adapter else Path(args.adapter).name
    out_path = OUT_DIR / f"eval_rag_{tag}_k{args.k}.json"
    with out_path.open("w", encoding="utf-8") as f:
        json.dump({"summary": summary, "results": results},
                  f, ensure_ascii=False, indent=2)
    print(f"\nFull predictions saved to {out_path}")

    print(f"\n=== {args.samples} qualitative samples ===")
    for r in results[:args.samples]:
        print("\n---")
        print(f"USER: {r['_user']}")
        print(f"RETRIEVED: {[d['title'] for d in r['_retrieved']]}")
        gold_titles = [i.get("title") for i in r["_gold"].get("ideas", [])]
        pred_titles = ([i.get("title") for i in r["_pred"]["ideas"]]
                       if r["_pred"] and r["_pred"].get("ideas") else ["<no parse>"])
        gold_culture = r["_gold"]["ideas"][0].get("cultural_origin") if r["_gold"].get("ideas") else None
        pred_culture = (r["_pred"]["ideas"][0].get("cultural_origin")
                        if r["_pred"] and r["_pred"].get("ideas") else None)
        print(f"GOLD ideas: {gold_titles}")
        print(f"PRED ideas: {pred_titles}")
        print(f"GOLD culture: {gold_culture!r}")
        print(f"PRED culture: {pred_culture!r}")


if __name__ == "__main__":
    main()
