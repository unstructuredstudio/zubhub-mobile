"""
Step 1 (cleaning): filter the raw Wikipedia scrape down to articles genuinely
useful for STEAM activity suggestions.

Stage 0 — safety drop (fast, rule-based): remove any article whose title or
          summary trips the shared content-safety screen (safety.py) —
          intoxicants, drugs, weapons, explosives, poisons. Done FIRST and at
          the source so unsafe content can't propagate to either branch
          downstream: the retrieval index OR the training pairs (which are
          generated from this corpus). See safety.py for the rationale.
Stage 1 — structural drop (fast, rule-based): remove obvious non-activity
          content — games, films, albums, biographies, sport, and plant/animal
          species — using section headings, categories and title patterns.
Stage 2 — semantic relevance (embeddings): embed each survivor with a small
          sentence-transformer and keep those whose *meaning* is close to
          "a hands-on STEAM activity" and far from junk like "a plant species".

Reads  data/wikipedia_culture.jsonl
Writes data/corpus_filtered.jsonl

Usage:
    python filter_corpus.py
"""

import json
import random
from collections import Counter
from pathlib import Path

from sentence_transformers import SentenceTransformer, util

from safety import screen_text

INPUT_PATH = Path("data/wikipedia_culture.jsonl")
OUTPUT_PATH = Path("data/corpus_filtered.jsonl")

# ── Stage 1: structural noise signatures ──────────────────────────────────────

# Section headings that mark games / films / TV / music / sport / species.
NOISE_SECTIONS = {
    "gameplay", "plot", "track listing", "episodes", "cast", "synopsis",
    "championships and accomplishments", "professional wrestling career",
    "discography", "filmography", "taxonomy",
}

# Substrings that mark a non-activity category.
NOISE_CATEGORY_SUBSTRINGS = (
    "video game", "films", "film series", "albums", "songs", "singles",
    "musical groups", "discographies", "record labels", "musicians",
    "television series", "television episodes", "television programs",
    " births", " deaths", "living people", "wrestlers", "sportspeople",
    "footballers", "companies", "brands", "podcasts", "comics", "novels",
    # plant / animal species
    "flora of", "fauna of", " species", "genera", "plants of", "trees of",
    "fungi", "lichens", "molluscs", "edible plants", "medicinal plants",
    "ornamental plants", "endemic flora", "garden plants",
)

# Title patterns that mark non-articles or media.
NOISE_TITLE_SUBSTRINGS = (
    "(video game)", "(film)", "(album)", "(song)", "(tv series)",
    "(disambiguation)", "(comics)", "(band)", "(plant)",
)
NOISE_TITLE_PREFIXES = ("list of", "timeline of", "index of")

# ── Stage 2: semantic relevance anchors ───────────────────────────────────────

POSITIVE_ANCHORS = [
    "a hands-on craft that children can make using simple materials and a technique",
    "a traditional cultural art or making technique such as weaving, carving, pottery or paper folding",
    "a STEAM project or experiment that teaches science, engineering or math by building something",
    "a do-it-yourself object or model that can be built as a learning activity",
]
NEGATIVE_ANCHORS = [
    "a species of plant, animal or fungus",
    "a biography of a person",
    "a city, region, building or geographic place",
    "a company, brand, organization or commercial product",
    "a film, video game, album, book or work of fiction",
    "an abstract academic concept or a historical event",
]

# Keep an article if (closest positive similarity) - (closest negative
# similarity) >= this. Raise it to keep fewer/cleaner; lower to keep more.
RELEVANCE_THRESHOLD = 0.0

EMBED_MODEL = "all-MiniLM-L6-v2"

# ──────────────────────────────────────────────────────────────────────────────


def structural_noise_reason(rec):
    """Stage 1: return a reason string if the record is obvious noise, else None."""
    title = rec["title"].lower()
    if title.startswith(NOISE_TITLE_PREFIXES):
        return "title-prefix"
    if any(s in title for s in NOISE_TITLE_SUBSTRINGS):
        return "title-pattern"
    headings = {h.lower() for h in rec["sections"]}
    if headings & NOISE_SECTIONS:
        return "section"
    cats = " | ".join(rec["categories"]).lower()
    if any(s in cats for s in NOISE_CATEGORY_SUBSTRINGS):
        return "category"
    return None


def histogram(scores, lo=-0.4, hi=0.6, bins=10):
    """Print a rough ASCII histogram of relevance scores."""
    width = (hi - lo) / bins
    counts = [0] * bins
    for s in scores:
        idx = min(bins - 1, max(0, int((s - lo) / width)))
        counts[idx] += 1
    peak = max(counts) or 1
    for i, c in enumerate(counts):
        bar = "#" * (c * 48 // peak)
        print(f"  {lo + i * width:+.2f}  {bar} {c}")


def main():
    rows = [json.loads(l) for l in INPUT_PATH.open(encoding="utf-8")]
    print(f"Input: {len(rows)} articles\n")

    # ── Stage 0: safety ──
    # Drop unsafe articles at the source, before anything else, so they never
    # reach the index or the training-pair generator.
    safety_reasons = Counter()
    safe_rows = []
    for rec in rows:
        cat = screen_text(f"{rec.get('title', '')} {rec.get('summary', '')}")
        if cat:
            safety_reasons[f"stage0:{cat}"] += 1
        else:
            safe_rows.append(rec)
    print("Stage 0 — safety drop:")
    for reason, n in safety_reasons.most_common():
        print(f"  {reason:30} {n}")
    print(f"  -> {len(safe_rows)} survivors\n")
    rows = safe_rows

    # ── Stage 1 ──
    drop_reasons = Counter()
    survivors = []
    for rec in rows:
        reason = structural_noise_reason(rec)
        if reason:
            drop_reasons[f"stage1:{reason}"] += 1
        else:
            survivors.append(rec)
    print("Stage 1 — structural drop:")
    for reason, n in drop_reasons.most_common():
        print(f"  {reason:22} {n}")
    print(f"  -> {len(survivors)} survivors\n")

    # ── Stage 2 ──
    print(f"Stage 2 — semantic relevance ({EMBED_MODEL})...")
    model = SentenceTransformer(EMBED_MODEL)
    pos = model.encode(POSITIVE_ANCHORS, convert_to_tensor=True, normalize_embeddings=True)
    neg = model.encode(NEGATIVE_ANCHORS, convert_to_tensor=True, normalize_embeddings=True)

    texts = [f"{r['title']}. {r['summary'][:500]}" for r in survivors]
    emb = model.encode(texts, convert_to_tensor=True, normalize_embeddings=True,
                        batch_size=64, show_progress_bar=True)

    pos_sim = util.cos_sim(emb, pos).max(dim=1).values
    neg_sim = util.cos_sim(emb, neg).max(dim=1).values
    scores = (pos_sim - neg_sim).tolist()

    print("\nRelevance score distribution (positive - negative similarity):")
    histogram(scores)

    kept = []
    for rec, score in zip(survivors, scores):
        if score >= RELEVANCE_THRESHOLD:
            rec["relevance"] = round(score, 3)
            kept.append(rec)
    kept.sort(key=lambda r: r["relevance"], reverse=True)

    with OUTPUT_PATH.open("w", encoding="utf-8") as f:
        for rec in kept:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")

    print(f"\nKept (score >= {RELEVANCE_THRESHOLD}): {len(kept)} / {len(rows)} "
          f"-> {OUTPUT_PATH}")

    dc = Counter(d for r in kept for d in r["domains"])
    print("\nKept by domain:")
    for d, n in dc.most_common():
        print(f"  {d:26} {n}")

    print("\n--- 12 highest-scoring kept ---")
    for r in kept[:12]:
        print(f"  {r['relevance']:+.2f}  {r['title']}")
    print("\n--- 12 near the cutoff (lowest kept) ---")
    for r in kept[-12:]:
        print(f"  {r['relevance']:+.2f}  {r['title']}")

    dropped = [(r, s) for r, s in zip(survivors, scores) if s < RELEVANCE_THRESHOLD]
    random.seed(4)
    print("\n--- 12 random stage-2 dropped (sanity check) ---")
    for r, s in random.sample(dropped, min(12, len(dropped))):
        print(f"  {s:+.2f}  {r['title']}")


if __name__ == "__main__":
    main()
