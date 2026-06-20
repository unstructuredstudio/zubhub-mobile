"""
Phase 7, step 1: prepare the fine-tuning dataset.

Converts the cleaned (input -> output) pairs into the chat format that MLX-LM
expects, then splits them into train / valid / test sets:
  - train: the model learns from these
  - valid: watched during training to catch overfitting
  - test:  held back, never seen during training — used to judge the model later

Reads  data/training_pairs_clean.jsonl
Writes data/mlx/train.jsonl, valid.jsonl, test.jsonl

Usage:
    python prepare_data.py
"""

import json
import random
from pathlib import Path

INPUT_PATH = Path("data/training_pairs_clean.jsonl")
OUT_DIR = Path("data/mlx")

SYSTEM_PROMPT = (
    "You are a STEAM activity assistant for ZubHub, a hands-on education "
    "platform for children. Given the materials an educator has and the "
    "children's age range, suggest creative STEAM activity ideas grounded "
    "in cultural context. Respond with JSON only."
)

N_TEST = 50      # held back, never seen during training
N_VALID = 48     # watched during training
SEED = 42


def format_user(inp):
    """Turn the structured input into a natural educator request."""
    materials = ", ".join(inp.get("materials", []))
    lo, hi = inp.get("age_range", [7, 12])
    msg = (f"I have these materials: {materials}. "
           f"The children are aged {lo}-{hi}.")
    theme = inp.get("theme")
    if theme:
        msg += f" Theme: {theme}."
    msg += " Suggest STEAM activity ideas."
    return msg


def to_chat(pair):
    """Convert one pair into a chat-format record for MLX-LM."""
    return {
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": format_user(pair["input"])},
            {"role": "assistant",
             "content": json.dumps(pair["output"], ensure_ascii=False)},
        ]
    }


def main():
    rows = [json.loads(l) for l in INPUT_PATH.open(encoding="utf-8")]
    chats = [to_chat(p) for p in rows]

    random.seed(SEED)
    random.shuffle(chats)

    test = chats[:N_TEST]
    valid = chats[N_TEST:N_TEST + N_VALID]
    train = chats[N_TEST + N_VALID:]

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for name, data in [("train", train), ("valid", valid), ("test", test)]:
        path = OUT_DIR / f"{name}.jsonl"
        with path.open("w", encoding="utf-8") as f:
            for rec in data:
                f.write(json.dumps(rec, ensure_ascii=False) + "\n")
        print(f"  {name}.jsonl: {len(data)} examples")

    print(f"\nTotal {len(chats)} -> train {len(train)} / valid {len(valid)} / test {len(test)}")
    print(f"Written to {OUT_DIR}/")


if __name__ == "__main__":
    main()
