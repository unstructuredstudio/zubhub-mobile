/**
 * Translation service — uses Google Translate's public endpoint.
 * No API key required. Results cached in-memory per session.
 */

// Google Translate lang code overrides (where ISO 639-1 differs)
const LANG_MAP: Record<string, string> = {
  zh: 'zh-CN',
  bn: 'bn',   // Bengali — explicit for clarity
};

const cache = new Map<string, string>();

function toLang(code: string): string {
  return LANG_MAP[code] ?? code;
}

export async function translateText(text: string, targetLang: string): Promise<string> {
  if (targetLang === 'en' || !text?.trim()) return text;
  const key = `${targetLang}|${text}`;
  if (cache.has(key)) return cache.get(key)!;

  const url =
    `https://translate.googleapis.com/translate_a/single` +
    `?client=gtx&sl=en&tl=${toLang(targetLang)}&dt=t&q=${encodeURIComponent(text)}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Translate HTTP ${res.status}`);
  const json = await res.json();

  // Response shape: [ [ ["translated", "original", ...], ... ], ... ]
  // Full translation may be split across multiple segments — join them
  const segments: string[] = (json?.[0] ?? []).map((seg: any[]) => seg?.[0] ?? '');
  const result = segments.join('') || text;

  cache.set(key, result);
  return result;
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
