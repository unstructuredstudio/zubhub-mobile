// Two-step flow with the local ML server (ml/server.py):
//   1. fetchInspiration(materials) → grid of culturally-specific Wikipedia
//      articles whose crafts use those materials. Pure retrieval, fast.
//   2. fetchActivity(article, materials, ageRange) → fine-tuned model
//      generates a full STEAM activity grounded in that single article.
//
// Set EXPO_PUBLIC_SUGGEST_API_URL to your Mac's LAN IP when running on a
// physical device (e.g. http://192.168.1.107:8000).

const BASE_URL =
  process.env.EXPO_PUBLIC_SUGGEST_API_URL ?? 'http://localhost:8000';

export interface InspirationResult {
  id: number;
  title: string;
  sim: number;
  url?: string | null;
  image_url?: string | null;
  summary?: string | null;
}

export interface SuggestResponse {
  results: InspirationResult[];
  // Set by the server's safety screen: when true, results is empty and
  // `notice` carries a friendly message to show instead of an error.
  blocked?: boolean;
  notice?: string;
}

export interface GeneratedActivity {
  title?: string;
  description?: string;
  category?: string;
  cultural_origin?: string | null;
  materials_used?: string[];
  materials_missing?: string[];
  estimated_minutes?: number;
  steps?: string[];
  learning_objectives?: string[];
  safety_note?: string | null;
}

export interface ActivityResponse {
  activity: GeneratedActivity;
  article: InspirationResult;
}

export async function fetchInspiration(
  materials: string[],
  theme?: string,
): Promise<SuggestResponse> {
  const res = await fetch(`${BASE_URL}/suggest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ materials, theme: theme ?? null }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Suggest API ${res.status}: ${body}`);
  }
  return res.json();
}

export async function fetchActivity(
  articleId: number,
  materials: string[],
  ageRange: [number, number],
): Promise<ActivityResponse> {
  const res = await fetch(`${BASE_URL}/activity`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      article_id: articleId,
      materials,
      age_range: ageRange,
    }),
  });
  if (!res.ok) {
    // The server returns 422 with {detail: {blocked, notice}} when the safety
    // screen rejects the request or the generated output. Surface the friendly
    // notice instead of a raw API error.
    if (res.status === 422) {
      const data = await res.json().catch(() => null);
      const notice = data?.detail?.notice;
      if (notice) throw new Error(notice);
    }
    const body = await res.text();
    throw new Error(`Activity API ${res.status}: ${body}`);
  }
  return res.json();
}
