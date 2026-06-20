# ZubHub idea-model (ML project)

A standalone learning project: train a small model that suggests K12 STEAM
project-based activity ideas with cultural context, grounded in data from
Wikipedia. **Not part of the React Native app** — the app will only call the
finished model over HTTP.

## Pipeline

1. **Scrape** culturally-grounded STEAM articles from Wikipedia → `scrape_wikipedia.py`
2. Choose a small base model
3. Fine-tune
4. Evaluate

## Setup

```bash
cd ml
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Step 1 — scrape

```bash
python scrape_wikipedia.py
```

Writes `data/wikipedia_culture.jsonl` — one JSON object per article with
`pageid`, `title`, `url`, `summary`, `text`, `categories`.

Tune the seed categories and depth at the top of `scrape_wikipedia.py`.
