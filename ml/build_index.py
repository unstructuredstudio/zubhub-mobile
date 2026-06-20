"""
Phase 8, step 1: build a retrieval index over the Wikipedia corpus.

For each article in data/corpus_filtered.jsonl we compute an embedding
(a numeric fingerprint of its meaning). At query time we find the articles
whose embeddings are closest to the query — that's "retrieval".

Writes:
  data/index/embeddings.npy   — (N, 384) float32 array, one row per article
  data/index/meta.jsonl       — title, url, summary, id — same order as embeddings

Usage:
    python build_index.py
"""

import json
import time
from pathlib import Path

import numpy as np
from sentence_transformers import SentenceTransformer

CORPUS_PATH = Path("data/corpus_with_media.jsonl")
OUT_DIR = Path("data/index")
MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
# What we actually embed per article — keep short, the summary is enough.
MAX_CHARS = 512
BATCH_SIZE = 64


def article_text(rec):
    title = rec.get("title", "")
    summary = rec.get("summary", "")
    return f"{title}. {summary}"[:MAX_CHARS]


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Reading {CORPUS_PATH}")
    records = [json.loads(l) for l in CORPUS_PATH.open(encoding="utf-8")]
    texts = [article_text(r) for r in records]
    print(f"  {len(records)} articles")

    print(f"Loading embedder: {MODEL_NAME}")
    model = SentenceTransformer(MODEL_NAME)

    print(f"Embedding (batch {BATCH_SIZE})...")
    t0 = time.time()
    embeddings = model.encode(
        texts,
        batch_size=BATCH_SIZE,
        show_progress_bar=True,
        normalize_embeddings=True,   # so cosine sim = dot product
        convert_to_numpy=True,
    ).astype(np.float32)
    dt = time.time() - t0
    print(f"  done in {dt:.1f}s — shape {embeddings.shape}")

    np.save(OUT_DIR / "embeddings.npy", embeddings)

    with (OUT_DIR / "meta.jsonl").open("w", encoding="utf-8") as f:
        for r in records:
            images = r.get("image_urls") or []
            f.write(json.dumps({
                "id": r.get("id"),
                "title": r.get("title"),
                "url": r.get("url"),
                "summary": r.get("summary", ""),
                "image_url": images[0] if images else None,
            }, ensure_ascii=False) + "\n")

    print(f"\nWrote {OUT_DIR}/embeddings.npy  ({embeddings.nbytes/1e6:.1f} MB)")
    print(f"Wrote {OUT_DIR}/meta.jsonl")


if __name__ == "__main__":
    main()
