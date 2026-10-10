/**
 * Translation service, backed by Google Translate's public web endpoint.
 *
 * That endpoint is undocumented and unversioned: it needs no key, but it can
 * change without notice and rate-limits by IP. Everything here is built around
 * that. A failed phrase falls back to English rather than throwing, so one
 * rate-limited request cannot drop a whole screen back to English; requests are
 * throttled so a single activity does not open forty connections at once; and
 * results are cached on disk so a returning educator on a slow connection pays
 * the cost once rather than on every launch.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Google Translate lang code overrides (where ISO 639-1 differs)
const LANG_MAP: Record<string, string> = {
  zh: 'zh-CN',
};

/** Parallel requests allowed against the endpoint. */
const MAX_CONCURRENT = 4;

/** Cap on persisted phrases, so the cache cannot grow without bound. */
const MAX_CACHED = 800;

const CACHE_KEY = 'translation_cache_v1';

const cache = new Map<string, string>();
let cacheLoaded = false;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function toLang(code: string): string {
  return LANG_MAP[code] ?? code;
}

/** Restore the on-disk cache once per app launch. */
async function loadCache(): Promise<void> {
  if (cacheLoaded) return;
  cacheLoaded = true;
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return;
    const entries: [string, string][] = JSON.parse(raw);
    entries.forEach(([k, v]) => cache.set(k, v));
  } catch {
    // A corrupt cache is not worth failing a translation over.
  }
}

/** Debounced so a burst of phrases results in one write, not forty. */
function scheduleSave(): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const entries = Array.from(cache.entries()).slice(-MAX_CACHED);
    AsyncStorage.setItem(CACHE_KEY, JSON.stringify(entries)).catch(() => {});
  }, 1500);
}

let inFlight = 0;
const waiting: (() => void)[] = [];

/** Simple semaphore: resolves once a request slot is free. */
function acquire(): Promise<void> {
  if (inFlight < MAX_CONCURRENT) {
    inFlight += 1;
    return Promise.resolve();
  }
  return new Promise((resolve) => waiting.push(resolve));
}

function release(): void {
  const next = waiting.shift();
  if (next) {
    next();
    return;
  }
  inFlight -= 1;
}

/**
 * Translate one phrase, returning the original English on any failure.
 *
 * Never rejects. Callers translate many fields at once, and a partly
 * translated screen is far more useful than an all-or-nothing one.
 */
export async function translateText(text: string, targetLang: string): Promise<string> {
  if (targetLang === 'en' || !text?.trim()) return text;

  await loadCache();
  const key = `${targetLang}|${text}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;

  await acquire();
  try {
    // `client=gtx` now answers 429 with an HTML block page ("your computer or
    // network may be sending automated queries") for every request, regardless
    // of volume or user agent. `client=at` still serves the same JSON shape.
    // Both are undocumented, so treat this as a stopgap: if translations start
    // coming back in English everywhere, check this parameter first.
    const url =
      `https://translate.googleapis.com/translate_a/single` +
      `?client=at&sl=en&tl=${toLang(targetLang)}&dt=t&q=${encodeURIComponent(text)}`;

    const res = await fetch(url);
    if (!res.ok) return text;
    const json = await res.json();

    // Response shape: [ [ ["translated", "original", ...], ... ], ... ]
    // Full translation may be split across multiple segments, so join them.
    const segments: string[] = (json?.[0] ?? []).map((seg: any[]) => seg?.[0] ?? '');
    const result = segments.join('') || text;

    cache.set(key, result);
    scheduleSave();
    return result;
  } catch {
    return text;
  } finally {
    release();
  }
}

export async function translateActivity(activity: any, targetLang: string): Promise<any> {
  if (targetLang === 'en') return activity;

  const [title, description, steps, tips, objectives, materials] = await Promise.all([
    translateText(activity.title, targetLang),
    translateText(activity.description, targetLang),
    Promise.all(
      (activity.steps ?? []).map(async (s: any) => ({
        ...s,
        title: await translateText(s.title, targetLang),
        description: await translateText(s.description, targetLang),
        tip: s.tip ? await translateText(s.tip, targetLang) : s.tip,
      }))
    ),
    Promise.all((activity.tips ?? []).map((t: string) => translateText(t, targetLang))),
    Promise.all((activity.objectives ?? []).map((o: string) => translateText(o, targetLang))),
    Promise.all(
      (activity.materials ?? []).map(async (m: any) => ({
        ...m,
        name: await translateText(m.name, targetLang),
        buy_hint: m.buy_hint ? await translateText(m.buy_hint, targetLang) : m.buy_hint,
      }))
    ),
  ]);

  return { ...activity, title, description, steps, tips, objectives, materials };
}
