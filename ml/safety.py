"""
Content safety for the ZubHub inspiration feature — single source of truth.

ZubHub is a hands-on STEAM platform for children. Even though the direct
users are educators, anything this feature produces can end up in front of
kids, so we never surface — let alone generate step-by-step instructions for
— intoxicants, drugs, weapons, explosives, or poisons.

The fine-tuned 1.5B model has no refusal behavior (it was trained only on
cultural-craft pairs), so we do NOT rely on it to police itself. The same
term lists below are reused in three places:

  * server.py     — runtime screen on inputs (before retrieval/generation)
                    and on generated output (backstop). This is the guarantee
                    for the live app.
  * filter_unsafe.py — data-filtering pass that scrubs the corpus and the
                    training pairs before (re)training, so a model we might
                    publish to Hugging Face is never *taught* unsafe content.

NOTE on publishing: data filtering REDUCES risk but cannot GUARANTEE a safe
model. The adapter sits on top of Qwen2.5-1.5B; general knowledge of alcohol,
weapons, etc. lives in the base weights, not in our data. Filtering stops us
from reinforcing harm; it can't erase what the base model already knows. Any
downstream app must still add its own moderation — say so in the model card.

Matching is whole-word (regex \\b…\\b) so legitimate craft vocabulary that
merely *contains* a flagged substring is safe: "twine" ≠ "wine",
"gunny sack" ≠ "gun". Dual-use craft tools (knife, scissors, glue, paint,
wire, supervised candles/matches) are deliberately NOT flagged.
"""

import re
from typing import Iterable, Optional

# ─── Disallowed categories ────────────────────────────────────────────────
UNSAFE_TERMS = {
    "alcohol & intoxicants": [
        "alcohol", "alcoholic", "ethanol", "liquor", "liquors", "booze",
        "wine", "beer", "vodka", "whiskey", "whisky", "rum", "brandy",
        "gin", "tequila", "moonshine", "absinthe", "mead", "cocktail",
        "ferment alcohol", "distill", "distillation", "distillery",
        "brewing beer",
    ],
    "drugs": [
        "drug", "drugs", "cannabis", "marijuana", "hashish", "cocaine",
        "heroin", "methamphetamine", "meth", "lsd", "mdma", "ecstasy",
        "opioid", "opioids", "opium", "narcotic", "narcotics", "psychedelic",
    ],
    "tobacco & vaping": [
        "tobacco", "cigarette", "cigarettes", "cigar", "cigars", "nicotine",
        "vape", "vaping", "e-cigarette", "hookah", "shisha",
    ],
    "weapons": [
        "gun", "guns", "firearm", "firearms", "rifle", "pistol", "handgun",
        "ammunition", "ammo", "bullet", "bullets", "weapon", "weapons",
    ],
    "explosives & pyrotechnics": [
        "explosive", "explosives", "bomb", "bombs", "gunpowder", "dynamite",
        "tnt", "grenade", "firework", "fireworks", "molotov", "detonator",
    ],
    "poisons & toxic agents": [
        "poison", "poisons", "cyanide", "arsenic", "ricin", "strychnine",
        "chlorine gas", "mustard gas", "nerve agent", "toxic gas",
    ],
}

# One compiled regex per category. \b…\b = whole-word; multi-word phrases
# allow flexible whitespace between tokens.
_CATEGORY_PATTERNS = {
    category: re.compile(
        r"\b(?:%s)\b"
        % "|".join(re.escape(t).replace(r"\ ", r"\s+") for t in terms),
        re.IGNORECASE,
    )
    for category, terms in UNSAFE_TERMS.items()
}

# Shown to the educator when something is blocked. Friendly, not accusatory —
# explains scope rather than scolding.
BLOCK_MESSAGE = (
    "ZubHub focuses on safe, hands-on STEAM crafts for children, so it can't "
    "build activities around that. Try everyday materials like clay, paper, "
    "string, fabric, or recycled items."
)


def screen_text(text: str) -> Optional[str]:
    """Return the name of the first unsafe category found in `text`,
    or None if the text is clear."""
    if not text:
        return None
    for category, pattern in _CATEGORY_PATTERNS.items():
        if pattern.search(text):
            return category
    return None


def screen_inputs(
    materials: Iterable[str], theme: Optional[str] = None
) -> Optional[str]:
    """Screen the educator's materials + optional theme. Returns the matched
    unsafe category, or None if everything is safe."""
    blob = " ".join([*(materials or []), theme or ""])
    return screen_text(blob)
