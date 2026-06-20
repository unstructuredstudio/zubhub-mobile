"""
Step 5 of the ZubHub idea-model project: catalogue image URLs for the cleaned
corpus, so the app can embed reference images on activity pages later.

Stores image URLs only (no files downloaded, no license metadata for now).
NOTE: before actually embedding these in the app you must check each image's
licence — most Wikimedia images are reusable WITH attribution, but some are
not. That check belongs to the app-integration step, not here.

Reads  data/corpus_filtered.jsonl
Writes data/corpus_with_media.jsonl   (same records + an "image_urls" field)

Usage:
    python fetch_media.py
"""

import json
import time
from pathlib import Path

import requests

INPUT_PATH = Path("data/corpus_filtered.jsonl")
OUTPUT_PATH = Path("data/corpus_with_media.jsonl")

API_URL = "https://en.wikipedia.org/w/api.php"
USER_AGENT = "ZubHub-Research/0.1 (educational ML project; contact: srishakatux@gmail.com)"

REQUEST_PAUSE = 0.1     # polite pause between calls (seconds)
MAX_IMAGES = 12         # cap stored images per article
MIN_DIMENSION = 150     # skip images smaller than this (icons, logos)

# Filename substrings that mark UI / boilerplate images, not content photos.
JUNK_FILENAME_PARTS = (
    "commons-logo", "wikidata", "wiktionary", "wikimedia", "edit-icon",
    "oojs", "ambox", "question_book", "padlock", "symbol_", "folder",
    "magnify", "red_pog", "green_pog", "increase", "decrease", "wiki-logo",
    "disambig", "flag of", "loudspeaker", "nuvola",
)

session = requests.Session()
session.headers.update({"User-Agent": USER_AGENT})


def is_junk(title):
    low = title.lower()
    return any(part in low for part in JUNK_FILENAME_PARTS)


def fetch_image_urls(pageid):
    """Return content-image URLs for one article (filtered, capped)."""
    params = {
        "action": "query",
        "format": "json",
        "pageids": pageid,
        "generator": "images",
        "gimlimit": "max",
        "prop": "imageinfo",
        "iiprop": "url|mime|size",
    }
    resp = session.get(API_URL, params=params, timeout=30)
    resp.raise_for_status()
    pages = resp.json().get("query", {}).get("pages", {})

    urls = []
    for page in pages.values():
        info = page.get("imageinfo")
        if not info:
            continue
        ii = info[0]
        if ii.get("mime") not in ("image/jpeg", "image/png"):
            continue
        if is_junk(page.get("title", "")):
            continue
        width, height = ii.get("width", 0), ii.get("height", 0)
        if width and height and (width < MIN_DIMENSION or height < MIN_DIMENSION):
            continue
        url = ii.get("url")
        if url:
            urls.append(url)
    return urls[:MAX_IMAGES]


def main():
    rows = [json.loads(l) for l in INPUT_PATH.open(encoding="utf-8")]
    print(f"Input: {len(rows)} articles\n")

    total_images = 0
    no_image = 0
    with OUTPUT_PATH.open("w", encoding="utf-8") as f:
        for i, rec in enumerate(rows, 1):
            try:
                urls = fetch_image_urls(rec["id"])
            except Exception as e:
                print(f"  ! error on '{rec['title']}': {e}")
                urls = []
            rec["image_urls"] = urls
            total_images += len(urls)
            if not urls:
                no_image += 1
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")

            if i % 100 == 0:
                print(f"  {i}/{len(rows)} processed ({total_images} image URLs so far)")
            time.sleep(REQUEST_PAUSE)

    print(f"\nDone. {len(rows)} articles written to {OUTPUT_PATH}")
    print(f"  total image URLs: {total_images}")
    print(f"  articles with no image: {no_image}")
    print(f"  average images/article: {total_images / len(rows):.1f}")


if __name__ == "__main__":
    main()
