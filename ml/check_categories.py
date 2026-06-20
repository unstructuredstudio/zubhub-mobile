"""
Helper for step 1: verify Wikipedia category names before seeding the scraper.

For each candidate category, reports whether it exists and how many direct
article members vs. sub-categories it has. Use the results to lock in a clean
SEED_CATEGORIES list in scrape_wikipedia.py.

Note: "articles" counts DIRECT members only. A category with 0 articles but
several sub-categories is still useful at MAX_DEPTH >= 1 (a container category).

Usage:
    python check_categories.py
"""

import wikipediaapi

USER_AGENT = "ZubHub-Research/0.1 (educational ML project; contact: srishakatux@gmail.com)"

# Candidates: current seeds (re-verify) + alternatives for the broken three
# + proposed new additions.
CANDIDATE_CATEGORIES = [
    # ── already seeded — re-verify ──
    "Category:Crafts",
    "Category:Handicrafts",
    "Category:Decorative arts",
    "Category:Folk art",
    "Category:Textile arts",
    "Category:Indigenous art",
    "Category:New media art",
    "Category:Puppetry",
    "Category:Animation techniques",
    "Category:Ethnobotany",
    "Category:Traditional medicine",
    "Category:Traditional knowledge",
    "Category:Inventions",
    "Category:History of science",
    "Category:History of technology",
    "Category:Vernacular architecture",
    "Category:Mathematics and art",
    "Category:Traditional board games",
    "Category:Archaeoastronomy",
    # ── fixes for the three broken / empty seeds ──
    "Category:Traditional crafts",           # was: not found
    "Category:Folk crafts",                  # alternative
    "Category:Folk musical instruments",     # was: not found
    "Category:Folk music instruments",       # alternative
    "Category:Traditional musical instruments",  # alternative
    "Category:Ethnomathematics",             # was: empty
    "Category:Mathematics and culture",      # alternative
    # ── proposed additions ──
    "Category:Origami",
    "Category:Paper art",
    "Category:Kites",
    "Category:Automatons",
    "Category:Simple machines",
    "Category:Kinetic art",
    "Category:Pottery",
    "Category:Woodworking",
    "Category:Wood carving",
    "Category:Educational toys",
    "Category:String figures",
    "Category:Traditional games",
    "Category:Masks",
    "Category:Lanterns",
    "Category:Recycling",
    "Category:Food preservation",
    "Category:Gardening",
    "Category:DIY culture",
]

wiki = wikipediaapi.Wikipedia(user_agent=USER_AGENT, language="en")


def check(name):
    """Return (exists, n_articles, n_subcats)."""
    cat = wiki.page(name)
    if not cat.exists():
        return False, 0, 0
    articles = subcats = 0
    for m in cat.categorymembers.values():
        if m.ns == wikipediaapi.Namespace.MAIN:
            articles += 1
        elif m.ns == wikipediaapi.Namespace.CATEGORY:
            subcats += 1
    return True, articles, subcats


def main():
    print(f"{'category':42} {'status':11} {'articles':>9} {'subcats':>8}")
    print("-" * 73)
    for name in CANDIDATE_CATEGORIES:
        short = name.replace("Category:", "")
        try:
            exists, articles, subcats = check(name)
        except Exception as e:
            print(f"{short:42} {'ERROR':11} {str(e)[:30]}")
            continue
        status = "OK" if exists else "NOT FOUND"
        print(f"{short:42} {status:11} {articles:9} {subcats:8}")


if __name__ == "__main__":
    main()
