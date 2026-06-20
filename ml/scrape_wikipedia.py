"""
Step 1 of the ZubHub idea-model project: scrape culturally-grounded STEAM
articles from Wikipedia into a JSONL corpus.

This is a standalone Python project. It is NOT part of the React Native app —
its only output (later, a trained model) is what the app will eventually call.

Each output record is section-structured and trimmed for the activity-suggestion
use case: lead summary, content sections (boilerplate dropped), clean topical
categories, and the STEAM domain(s) the article was discovered under.

Usage:
    python scrape_wikipedia.py
"""

import json
import time
from pathlib import Path

import wikipediaapi

# ─── Config (tweak these — this is the part you experiment with) ──────────────

LANGUAGE = "en"

# A descriptive User-Agent is REQUIRED by Wikimedia's API policy.
USER_AGENT = "ZubHub-Research/0.1 (educational ML project; contact: srishakatux@gmail.com)"

# Seed categories grouped by STEAM domain. Every name here was verified with
# check_categories.py. The domain label is stored on each scraped article.
SEED_CATEGORIES = {
    "Crafts & making": [
        "Category:Crafts",
        "Category:Handicrafts",
        "Category:Decorative arts",
        "Category:Origami",
        "Category:Paper art",
        "Category:Pottery",
        "Category:Woodworking",
        "Category:Woodcarving",
        "Category:Kites",
        "Category:Recycling",
    ],
    "Arts": [
        "Category:Folk art",
        "Category:Textile arts",
        "Category:Indigenous art",
        "Category:Kinetic art",
        "Category:Masks",
    ],
    "Media arts": [
        "Category:New media art",
        "Category:Puppetry",
        "Category:Animation techniques",
    ],
    "Science": [
        "Category:Ethnobotany",
        "Category:Traditional medicine",
        "Category:Traditional knowledge",
        "Category:Food preservation",
        "Category:Gardening",
    ],
    "Invention & technology": [
        "Category:Inventions",
        "Category:History of science",
        "Category:History of technology",
        "Category:DIY culture",
    ],
    "Engineering": [
        "Category:Vernacular architecture",
        "Category:Simple machines",
        "Category:Mechanical toys",
    ],
    "Mathematics": [
        "Category:Mathematics and art",
        "Category:Mathematics and culture",
        "Category:Traditional board games",
        "Category:String figures",
    ],
    "Music & sky": [
        "Category:Archaeoastronomy",
        "Category:Folk music instruments",
    ],
    "Play & learning": [
        "Category:Educational toys",
        "Category:Traditional games",
    ],
}

MAX_DEPTH = 1             # how many sub-category levels to descend
MIN_CONTENT_CHARS = 800   # skip stubs (measured on summary + sections)
OUTPUT_PATH = Path("data/wikipedia_culture.jsonl")
REQUEST_PAUSE = 0.1       # polite pause between page fetches (seconds)

# Section headings that carry no activity-relevant content — dropped.
BOILERPLATE_SECTIONS = {
    "references", "bibliography", "external links", "see also", "notes",
    "further reading", "citations", "sources", "footnotes", "gallery",
    "notes and references", "explanatory notes",
}

# A category is "maintenance" noise if its name starts with one of these.
MAINTENANCE_PREFIXES = (
    "articles ", "all articles", "all stub", "all pages", "cs1", "pages ",
    "pages with", "pages using", "wikipedia ", "use ", "use dmy", "use mdy",
    "webarchive", "commons category", "short description", "coordinates ",
    "engvar", "good articles", "featured articles", "redirects ",
)

# ─── Helpers ──────────────────────────────────────────────────────────────────

wiki = wikipediaapi.Wikipedia(user_agent=USER_AGENT, language=LANGUAGE)


def collect_article_titles(category_name, max_depth):
    """Breadth-first walk over a category tree; return the set of article titles."""
    articles = set()
    seen_categories = set()
    queue = [(category_name, 0)]  # (category title, depth)

    while queue:
        name, depth = queue.pop(0)
        if name in seen_categories:
            continue
        seen_categories.add(name)

        cat = wiki.page(name)
        if not cat.exists():
            print(f"  ! category not found: {name}")
            continue

        for member in cat.categorymembers.values():
            if member.ns == wikipediaapi.Namespace.MAIN:
                articles.add(member.title)
            elif member.ns == wikipediaapi.Namespace.CATEGORY and depth < max_depth:
                queue.append((member.title, depth + 1))

    return articles


def collect_titles_by_domain():
    """BFS every seed category; return {article_title: set(domain_labels)}."""
    article_domains = {}
    for domain, categories in SEED_CATEGORIES.items():
        for category_name in categories:
            print(f"[{domain}] scanning {category_name} (depth {MAX_DEPTH})...")
            titles = collect_article_titles(category_name, MAX_DEPTH)
            print(f"  found {len(titles)} articles")
            for title in titles:
                article_domains.setdefault(title, set()).add(domain)
    return article_domains


def clean_categories(raw_categories):
    """Drop Wikipedia maintenance/tracking categories, keep topical ones."""
    kept = []
    for name in raw_categories:
        short = name.replace("Category:", "")
        low = short.lower()
        if low.startswith(MAINTENANCE_PREFIXES) or "maint" in low:
            continue
        kept.append(short)
    return kept


def gather_section_text(section):
    """Recursively collect a section's own text plus its sub-sections' text."""
    parts = [section.text] if section.text else []
    for sub in section.sections:
        parts.append(gather_section_text(sub))
    return "\n".join(p for p in parts if p)


def extract_sections(page):
    """Return {section_title: text} for substantive top-level sections only."""
    sections = {}
    for sec in page.sections:
        if sec.title.strip().lower() in BOILERPLATE_SECTIONS:
            continue
        text = gather_section_text(sec)
        if text.strip():
            sections[sec.title.strip()] = text
    return sections


def fetch_article(title, domains):
    """Fetch one article as a section-structured record. Returns a dict or None."""
    page = wiki.page(title)
    if not page.exists():
        return None
    summary = page.summary or ""
    sections = extract_sections(page)
    content_chars = len(summary) + sum(len(v) for v in sections.values())
    if content_chars < MIN_CONTENT_CHARS:
        return None
    return {
        "id": page.pageid,
        "title": page.title,
        "url": page.fullurl,
        "domains": sorted(domains),
        "summary": summary,
        "categories": clean_categories(page.categories.keys()),
        "sections": sections,
    }


def main():
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    # 1. Gather candidate article titles, tagged with the domain(s) they came from.
    article_domains = collect_titles_by_domain()
    print(f"\nTotal unique articles: {len(article_domains)}\n")

    # 2. Fetch each article as a section-structured record → JSONL.
    written, skipped = 0, 0
    with OUTPUT_PATH.open("w", encoding="utf-8") as f:
        for i, (title, domains) in enumerate(sorted(article_domains.items()), 1):
            try:
                article = fetch_article(title, domains)
            except Exception as e:
                print(f"  ! error on '{title}': {e}")
                skipped += 1
                continue

            if article is None:
                skipped += 1
            else:
                f.write(json.dumps(article, ensure_ascii=False) + "\n")
                written += 1

            if i % 100 == 0:
                print(f"  {i}/{len(article_domains)} processed "
                      f"({written} written, {skipped} skipped)")
            time.sleep(REQUEST_PAUSE)

    print(f"\nDone. {written} articles written to {OUTPUT_PATH} "
          f"({skipped} skipped as stubs/missing).")


if __name__ == "__main__":
    main()
