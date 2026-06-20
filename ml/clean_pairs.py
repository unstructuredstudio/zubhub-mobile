"""
Step 6 (cleanup): normalize the generated training pairs.

The local model invented its own category labels ("Crafts & Making", "Ceramics",
"Circuits (metaphorical)", ...) instead of sticking to ZubHub's fixed set. This
script maps every category to one of the 10 canonical ZubHub categories and
clamps age ranges into the K12 band.

Reads  data/training_pairs.jsonl
Writes data/training_pairs_clean.jsonl

Usage:
    python clean_pairs.py
"""

import json
from collections import Counter
from pathlib import Path

from safety import screen_text

INPUT_PATH = Path("data/training_pairs.jsonl")
OUTPUT_PATH = Path("data/training_pairs_clean.jsonl")

CANONICAL = {"Art", "Science", "Coding", "Circuits", "Engineering",
             "Storytelling", "Drama", "Film", "Music", "Nature"}

# Keyword -> canonical category, checked in order (first match wins).
CATEGORY_RULES = [
    ("circuit", "Circuits"),
    ("coding", "Coding"),
    ("engineer", "Engineering"),
    ("drama", "Drama"),
    ("story", "Storytelling"),
    ("film", "Film"),
    ("music", "Music"),
    ("nature", "Nature"),
    ("garden", "Nature"),
    ("botan", "Nature"),
    ("craft", "Art"),
    ("art", "Art"),
    ("ceramic", "Art"),
    ("pottery", "Art"),
    ("sew", "Art"),
    ("needle", "Art"),
    ("weav", "Art"),
    ("textile", "Art"),
    ("paint", "Art"),
    ("scien", "Science"),
    ("math", "Science"),
]

AGE_MIN, AGE_MAX = 5, 16


def normalize_category(raw):
    """Map any category string to one of the 10 canonical ZubHub categories."""
    if raw in CANONICAL:
        return raw
    low = (raw or "").lower()
    for keyword, canonical in CATEGORY_RULES:
        if keyword in low:
            return canonical
    return "Art"  # fallback — most of this corpus is craft/art


def clamp_age(age_range):
    """Clamp an [min, max] age range into the K12 band, keeping it valid."""
    try:
        lo, hi = int(age_range[0]), int(age_range[1])
    except (TypeError, ValueError, IndexError):
        return [7, 12]  # safe default
    lo = max(AGE_MIN, min(lo, AGE_MAX))
    hi = max(AGE_MIN, min(hi, AGE_MAX))
    if lo >= hi:
        hi = min(AGE_MAX, lo + 2)
    return [lo, hi]


def main():
    rows = [json.loads(l) for l in INPUT_PATH.open(encoding="utf-8")]

    # Safety backstop: the source corpus is already screened (filter_corpus.py
    # Stage 0), but generate_pairs.py runs a local LLM that could drift, so we
    # re-screen each pair's input + output and drop anything unsafe.
    safety_dropped = Counter()
    safe_rows = []
    for pair in rows:
        blob = json.dumps(pair.get("input", {})) + json.dumps(pair.get("output", {}))
        cat = screen_text(blob)
        if cat:
            safety_dropped[cat] += 1
        else:
            safe_rows.append(pair)
    if sum(safety_dropped.values()):
        print(f"Safety backstop dropped {sum(safety_dropped.values())} pairs:")
        for cat, n in safety_dropped.most_common():
            print(f"  {cat:26} {n}")
    rows = safe_rows

    before, after = Counter(), Counter()
    age_fixed = 0

    for pair in rows:
        new_age = clamp_age(pair["input"].get("age_range"))
        if new_age != pair["input"].get("age_range"):
            age_fixed += 1
        pair["input"]["age_range"] = new_age
        for idea in pair["output"]["ideas"]:
            raw = idea.get("category", "")
            before[raw] += 1
            idea["category"] = normalize_category(raw)
            after[idea["category"]] += 1

    with OUTPUT_PATH.open("w", encoding="utf-8") as f:
        for pair in rows:
            f.write(json.dumps(pair, ensure_ascii=False) + "\n")

    print(f"Cleaned {len(rows)} pairs -> {OUTPUT_PATH}")
    print(f"Distinct categories: {len(before)} (before) -> {len(after)} (after)")
    print(f"Age ranges clamped to {AGE_MIN}-{AGE_MAX}: {age_fixed} fixed\n")
    print("Final category distribution:")
    for cat, n in after.most_common():
        print(f"  {cat:14} {n}")


if __name__ == "__main__":
    main()
