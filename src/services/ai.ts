import { aiConfig } from '../config/ai';
import { Category } from '../types';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AIGeneratedActivity {
  title: string;
  description: string;
  duration_minutes: number;
  min_age: number;
  max_age?: number;
  category: Category;
  materials: { name: string; buy_hint: string; amazon_url: string | null }[];
  objectives: string[];
  steps: {
    number: number;
    title: string;
    description: string;
    duration_minutes: number;
    tip: string;
    assignedPhotoIndex?: number | null;
  }[];
  featured_image_index?: number | null;
  tips: string[];
}

// ─── System Prompt ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a curriculum design assistant for ZubHub, a platform for hands-on education activities for children and young people.

Given a description and optional context about photos of an activity, generate a complete, structured activity plan.

Return ONLY valid JSON (no markdown, no backticks) matching this exact schema:
{
  "title": "string (catchy, max 60 chars)",
  "description": "string (2-3 short sentences, educator-facing)",
  "duration_minutes": number,
  "min_age": number,
  "max_age": number or null,
  "category": one of "Art" | "Science" | "Coding" | "Circuits" | "Engineering" | "Storytelling" | "Drama" | "Film" | "Music" | "Nature",
  "materials": [{ "name": "string (short, e.g. 'Paper cups')", "buy_hint": "string (2-4 words, e.g. 'Craft store' or 'Recycled')" }],
  "objectives": ["string (one short sentence)"],
  "steps": [{
    "number": 1,
    "title": "string (2-5 words)",
    "description": "string (2-3 short sentences telling the educator what to do)",
    "duration_minutes": number,
    "tip": "string (1-2 short sentences: a practical tip for running this step the first time)",
    "assignedPhotoIndex": number or null
  }],
  "featured_image_index": number or null,
  "tips": ["string (1-2 short sentences)"]
}

Writing style. The app is read on a phone, often in the middle of a session, by educators whose first language may not be English:
- Use plain, everyday words. Write the way you would explain it to a friend.
- Keep sentences short, around 15 words or fewer. One idea per sentence.
- Avoid jargon such as "scaffold", "pedagogy", "learning outcomes", "facilitate", "leverage" or "engagement".
- Never use em dashes or en dashes. Use a comma, a full stop, or a new sentence instead.
- The description and each step description: at most 3 sentences.
- Each step tip and each general tip: at most 2 sentences.

Guidelines:
- Generate 3-6 steps depending on activity complexity
- Every step MUST have a unique, practical facilitation tip (not generic advice)
- Generate 2-4 general facilitation tips in the "tips" array
- If the user provided N photos, assign them to the most relevant steps using assignedPhotoIndex (0-based, 0 to N-1). Not every photo needs to be assigned.
- Choose the most visually representative photo as featured_image_index
- If no photos, set all assignedPhotoIndex and featured_image_index to null
- Duration should be realistic (total of all step durations)
- Materials should be specific
- Generate 3-5 learning objectives
- Category should best match the activity content`;

// ─── API Call ────────────────────────────────────────────────────────────────

export async function generateActivity(
  description: string,
  photoCount: number,
  videoUrl?: string,
): Promise<AIGeneratedActivity> {
  if (!aiConfig.apiKey) {
    console.warn('[AI] EXPO_PUBLIC_CLAUDE_API_KEY is not set.');
    throw new Error(
      "Activity suggestions aren't available right now. You can still write your activity out yourself.",
    );
  }

  const photoContext = photoCount > 0
    ? `\n\nPhotos provided: ${photoCount} photos uploaded (indexed 0 to ${photoCount - 1}). Assign the most relevant photos to steps and pick the best one as the featured image.`
    : '\n\nNo photos provided.';

  const videoContext = videoUrl
    ? `\n\nVideo link provided: ${videoUrl}`
    : '';

  const userMessage = `Activity description: ${description}${photoContext}${videoContext}`;

  const response = await fetch(aiConfig.baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': aiConfig.apiKey,
      'anthropic-version': aiConfig.anthropicVersion,
    },
    body: JSON.stringify({
      model: aiConfig.model,
      max_tokens: aiConfig.maxTokens,
      // Haiku 5.5 thinks by default; for a short structured write-up that only
      // adds wait time.
      thinking: { type: 'disabled' },
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    if (response.status === 429) {
      throw new Error('Rate limited. Please wait a moment and try again.');
    }
    if (response.status === 401 || response.status === 403) {
      console.warn('[AI] auth rejected:', response.status, errorBody.slice(0, 200));
      throw new Error(
        "Activity suggestions aren't available right now. You can still write your activity out yourself.",
      );
    }
    // Status and body go to the console; the educator gets something actionable.
    console.warn('[AI] generation failed:', response.status, errorBody.slice(0, 200));
    throw new Error('Could not generate the activity. Please try again.');
  }

  const data = await response.json();
  const text = data?.content?.[0]?.text;

  if (!text) {
    throw new Error('Empty response from AI. Please try again.');
  }

  // Parse JSON — handle possible markdown wrapping
  let parsed: AIGeneratedActivity;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Try extracting JSON from markdown code block
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('Could not parse AI response. Please try again.');
    }
  }

  // Validate required fields
  if (!parsed.title || !parsed.steps?.length || !parsed.materials) {
    throw new Error('AI returned incomplete activity data. Please try again with more detail.');
  }

  return withoutDashes(parsed);
}

/**
 * The prompt asks for no em or en dashes, but the model still slips one in now
 * and then. Between words a dash reads as a pause, so it becomes a comma; in a
 * range like "5–10" it becomes a hyphen.
 */
function stripDashes(text: string): string {
  return text
    .replace(/(\d)\s*[\u2013\u2014]\s*(\d)/g, '$1-$2')
    .replace(/\s*[\u2013\u2014]\s*/g, ', ')
    .replace(/,\s*([.,;:!?])/g, '$1');
}

function withoutDashes<T>(value: T): T {
  if (typeof value === 'string') return stripDashes(value) as T;
  if (Array.isArray(value)) return value.map(withoutDashes) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, withoutDashes(v)]),
    ) as T;
  }
  return value;
}

// ─── Photo Assignment ────────────────────────────────────────────────────────

export function resolvePhotoAssignments(
  aiResult: AIGeneratedActivity,
  uploadedUrls: string[],
): {
  steps: { number: number; title: string; description: string; duration_minutes: number; tip?: string; images: string[] }[];
  featuredImageUrl: string | null;
} {
  const steps = aiResult.steps.map((step) => ({
    number: step.number,
    title: step.title,
    description: step.description,
    duration_minutes: step.duration_minutes,
    tip: step.tip || undefined,
    images: (step.assignedPhotoIndex != null && uploadedUrls[step.assignedPhotoIndex])
      ? [uploadedUrls[step.assignedPhotoIndex]]
      : [],
  }));

  const featuredImageUrl = (aiResult.featured_image_index != null && uploadedUrls[aiResult.featured_image_index])
    ? uploadedUrls[aiResult.featured_image_index]
    : (uploadedUrls.length > 0 ? uploadedUrls[0] : null);

  return { steps, featuredImageUrl };
}
