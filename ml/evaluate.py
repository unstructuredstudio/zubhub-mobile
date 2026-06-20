"""
Phase 7, step 2: evaluate the fine-tuned model on the held-out test set.

For each example in data/mlx/test.jsonl:
  1. Feed only the user message to the model
  2. Let the model generate its own JSON answer
  3. Compare to the gold answer that was already in the file

Reports:
  - JSON-validity rate         (does it parse?)
  - Schema-match rate          (does it have the expected keys?)
  - Materials-Jaccard          (overlap of predicted materials_used with gold)
  - Avg #ideas, avg #steps
  - Prints N side-by-side qualitative samples

Usage:
    # fine-tuned (default adapter)
    python evaluate.py --adapter adapters

    # specific checkpoint
    python evaluate.py --adapter adapters --resume 0000400_adapters.safetensors

    # base model, no fine-tuning, for comparison
    python evaluate.py --no-adapter
"""

import argparse
import json
from pathlib import Path

from mlx_lm import load, generate

MODEL_NAME = "mlx-community/Qwen2.5-1.5B-Instruct-4bit"
TEST_PATH = Path("data/mlx/test.jsonl")
OUT_DIR = Path("data")

REQUIRED_IDEA_KEYS = {"title", "description", "materials_used", "steps"}

# Words too generic to count as a specific cultural origin.
VAGUE_CULTURE_WORDS = {"various", "many", "multiple", "global",
                       "international", "ancient", "indigenous",
                       "traditional", "unknown"}
# Filler words to strip before checking word overlap on cultural_origin.
CULTURE_STOPWORDS = {"the", "a", "an", "of", "in", "and", "with", "by",
                     "from", "to", "for", "culture", "cultures", "origin",
                     "historical", "traditional", "various", "people",
                     "peoples", "region", "regions"}


def extract_user_and_gold(example):
    msgs = example["messages"]
    system = next(m["content"] for m in msgs if m["role"] == "system")
    user = next(m["content"] for m in msgs if m["role"] == "user")
    gold_text = next(m["content"] for m in msgs if m["role"] == "assistant")
    gold = json.loads(gold_text)
    return system, user, gold


def try_parse_json(text):
    """Find and parse the first {...} block. Returns dict or None."""
    start = text.find("{")
    if start == -1:
        return None
    depth = 0
    for i, ch in enumerate(text[start:], start):
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                try:
                    return json.loads(text[start:i + 1])
                except json.JSONDecodeError:
                    return None
    return None


def is_specific_culture(val):
    """True if val is non-empty and doesn't start with a vague word."""
    if not isinstance(val, str):
        return False
    s = val.strip().lower()
    if not s:
        return False
    first = s.split(",")[0].split()
    return bool(first) and first[0] not in VAGUE_CULTURE_WORDS


def culture_words(val):
    if not isinstance(val, str):
        return set()
    import re
    tokens = re.findall(r"[A-Za-z]+", val.lower())
    return {t for t in tokens if t not in CULTURE_STOPWORDS and len(t) > 2}


def culture_match(pred_val, gold_val):
    """Loose match: any shared meaningful word."""
    return bool(culture_words(pred_val) & culture_words(gold_val))


def jaccard(a, b):
    a = {x.lower().strip() for x in a or []}
    b = {x.lower().strip() for x in b or []}
    if not a and not b:
        return 1.0
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def score(pred, gold):
    """Per-example metrics. Returns dict."""
    out = {"json_valid": False, "schema_ok": False,
           "n_ideas": 0, "n_steps": 0, "materials_jaccard": 0.0,
           "pred_culture_specific": False,
           "gold_culture_specific": False,
           "culture_loose_match": False}
    if pred is None:
        return out
    out["json_valid"] = True
    ideas = pred.get("ideas") if isinstance(pred, dict) else None
    if not isinstance(ideas, list) or not ideas:
        return out
    first = ideas[0]
    if not isinstance(first, dict):
        return out
    out["schema_ok"] = REQUIRED_IDEA_KEYS.issubset(first.keys())
    out["n_ideas"] = len(ideas)
    steps = first.get("steps", [])
    out["n_steps"] = len(steps) if isinstance(steps, list) else 0
    gold_first = gold["ideas"][0] if gold.get("ideas") else {}
    out["materials_jaccard"] = jaccard(
        first.get("materials_used"), gold_first.get("materials_used"))

    pred_culture = first.get("cultural_origin")
    gold_culture = gold_first.get("cultural_origin")
    out["pred_culture_specific"] = is_specific_culture(pred_culture)
    out["gold_culture_specific"] = is_specific_culture(gold_culture)
    # Only meaningful when gold has a specific culture to match against.
    if out["gold_culture_specific"]:
        out["culture_loose_match"] = culture_match(pred_culture, gold_culture)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--adapter", default="adapters",
                    help="adapter directory (default: adapters/)")
    ap.add_argument("--resume", default=None,
                    help="evaluate a specific checkpoint file inside the "
                         "adapter dir, e.g. 0000400_adapters.safetensors "
                         "(default: adapters.safetensors = final/600 iters)")
    ap.add_argument("--no-adapter", action="store_true",
                    help="evaluate base model with no fine-tuning")
    ap.add_argument("--samples", type=int, default=5,
                    help="how many side-by-side examples to print")
    ap.add_argument("--max-tokens", type=int, default=600)
    ap.add_argument("--limit", type=int, default=None,
                    help="evaluate only first N (for a quick smoke test)")
    args = ap.parse_args()

    print(f"Loading {MODEL_NAME}"
          + ("" if args.no_adapter else f" + adapter {args.adapter}"))
    adapter_path = None if args.no_adapter else args.adapter
    model, tokenizer = load(MODEL_NAME, adapter_path=adapter_path)

    # mlx_lm's load() always reads adapters.safetensors from the adapter dir.
    # To score an earlier checkpoint, build the LoRA layers via that load,
    # then overwrite their weights with the requested checkpoint file.
    if args.resume and not args.no_adapter:
        ckpt = Path(args.adapter) / args.resume
        if not ckpt.exists():
            ap.error(f"checkpoint not found: {ckpt}")
        print(f"Overriding adapter weights with checkpoint {ckpt}")
        model.load_weights(str(ckpt), strict=False)

    examples = [json.loads(l) for l in TEST_PATH.open(encoding="utf-8")]
    if args.limit:
        examples = examples[:args.limit]
    print(f"Evaluating on {len(examples)} test examples\n")

    results = []
    for i, ex in enumerate(examples, 1):
        system, user, gold = extract_user_and_gold(ex)
        prompt = tokenizer.apply_chat_template(
            [{"role": "system", "content": system},
             {"role": "user", "content": user}],
            tokenize=False, add_generation_prompt=True,
        )
        raw = generate(model, tokenizer, prompt=prompt,
                       max_tokens=args.max_tokens, verbose=False)
        pred = try_parse_json(raw)
        s = score(pred, gold)
        s["_user"] = user
        s["_gold"] = gold
        s["_pred"] = pred
        s["_raw"] = raw
        results.append(s)
        flags = ("J" if s["json_valid"] else "-") + ("S" if s["schema_ok"] else "-")
        print(f"  [{i:3d}/{len(examples)}] {flags} "
              f"ideas={s['n_ideas']} steps={s['n_steps']} "
              f"mat_jaccard={s['materials_jaccard']:.2f}")

    n = len(results)
    n_gold_culture = sum(r["gold_culture_specific"] for r in results) or 1
    summary = {
        "n": n,
        "json_valid_rate": sum(r["json_valid"] for r in results) / n,
        "schema_match_rate": sum(r["schema_ok"] for r in results) / n,
        "avg_n_ideas": sum(r["n_ideas"] for r in results) / n,
        "avg_n_steps": sum(r["n_steps"] for r in results) / n,
        "avg_materials_jaccard": sum(r["materials_jaccard"] for r in results) / n,
        "pred_culture_specific_rate": sum(
            r["pred_culture_specific"] for r in results) / n,
        "gold_culture_specific_rate": sum(
            r["gold_culture_specific"] for r in results) / n,
        # Of the cases where gold has a specific culture, how often did
        # the model's culture share any meaningful word with gold's?
        "culture_loose_match_rate_when_gold_specific": sum(
            r["culture_loose_match"] for r in results) / n_gold_culture,
    }
    print("\n=== Summary ===")
    for k, v in summary.items():
        print(f"  {k}: {v:.3f}" if isinstance(v, float) else f"  {k}: {v}")

    if args.no_adapter:
        tag = "base"
    elif args.resume:
        tag = Path(args.resume).stem  # e.g. 0000400_adapters
    else:
        tag = Path(args.adapter).name
    out_path = OUT_DIR / f"eval_{tag}.json"
    with out_path.open("w", encoding="utf-8") as f:
        json.dump({"summary": summary, "results": results},
                  f, ensure_ascii=False, indent=2)
    print(f"\nFull predictions saved to {out_path}")

    print(f"\n=== {args.samples} qualitative samples ===")
    for r in results[:args.samples]:
        print("\n---")
        print(f"USER: {r['_user']}")
        gold_titles = [i.get("title") for i in r["_gold"].get("ideas", [])]
        pred_titles = ([i.get("title") for i in r["_pred"]["ideas"]]
                       if r["_pred"] and r["_pred"].get("ideas") else ["<no parse>"])
        print(f"GOLD ideas: {gold_titles}")
        print(f"PRED ideas: {pred_titles}")
        gold_culture = r["_gold"]["ideas"][0].get("cultural_origin") if r["_gold"].get("ideas") else None
        pred_culture = (r["_pred"]["ideas"][0].get("cultural_origin")
                        if r["_pred"] and r["_pred"].get("ideas") else None)
        print(f"GOLD culture: {gold_culture!r}")
        print(f"PRED culture: {pred_culture!r}")


if __name__ == "__main__":
    main()
