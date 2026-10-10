/**
 * Share service — generates pre-filled WhatsApp messages and uses
 * the native Share API for other platforms.
 *
 * UTM parameters are appended to the URL so referral traffic can be
 * traced back to specific shares in analytics.
 */

import { Share, Alert } from 'react-native';
import { Activity } from '../types';
import { trackOtherShare } from './analytics';

/**
 * Where a shared link points.
 *
 * `zubhub.app` does not currently resolve, so every link shared today is dead
 * on arrival. This reads from the environment so it can be pointed at a real
 * landing page or store listing without touching code -- set
 * EXPO_PUBLIC_APP_BASE_URL and rebuild.
 */
/**
 * Where a shared link points, when there is somewhere to point.
 *
 * Unset until a landing page or store listing exists. Nothing falls back to a
 * default here on purpose: `zubhub.app` does not resolve, and a dead link in a
 * message an educator forwards makes the app look broken. Set
 * EXPO_PUBLIC_APP_BASE_URL and the link reappears everywhere it belongs.
 */
export const APP_BASE_URL: string | null =
  process.env.EXPO_PUBLIC_APP_BASE_URL?.replace(/\/+$/, '') || null;

/** Bare host, for print and other places a full URL would read badly. */
export const APP_DOMAIN = APP_BASE_URL
  ? APP_BASE_URL.replace(/^https?:\/\//, '')
  : 'ZubHub';

// ─── URL Helpers ──────────────────────────────────────────────────────────────

/** Null while no destination is configured, so callers can omit the link. */
function buildActivityUrl(
  activity: Activity,
  source: string,
  userId?: string
): string | null {
  if (!APP_BASE_URL) return null;

  const slug = activity.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const params = new URLSearchParams({
    utm_source: source,
    utm_medium: 'share',
    utm_campaign: 'organic',
  });
  if (userId) params.set('ref', userId);

  return `${APP_BASE_URL}/activity/${slug}?${params.toString()}`;
}

// ─── WhatsApp Share ───────────────────────────────────────────────────────────

/**
 * The text that travels with a shared activity.
 *
 * Channel-neutral on purpose: this goes through the system share sheet now, so
 * it may land in WhatsApp, email or SMS. WhatsApp's `*bold*` markup renders as
 * literal asterisks everywhere else, so it is left out.
 */
function buildShareMessage(activity: Activity, activityUrl: string | null): string {
  const ageRange = activity.max_age
    ? `${activity.min_age}–${activity.max_age}`
    : `${activity.min_age}+`;

  let msg =
    `${activity.title}\n\n` +
    `${activity.description}\n\n` +
    `⏱ ${activity.duration_minutes} minutes  |  👥 Ages ${ageRange}\n\n`;

  if (activity.video_url) {
    msg += `🎬 Watch: ${activity.video_url}\n\n`;
  }

  // The attribution stands on its own; the link is appended only when there is
  // somewhere for it to go.
  msg += 'Found this on ZubHub - a free platform for educator activities.';
  if (activityUrl) msg += `\n${activityUrl}`;

  return msg;
}

// ─── Native Share Sheet ───────────────────────────────────────────────────────

export async function shareActivity(
  activity: Activity,
  userId?: string
): Promise<void> {
  const url = buildActivityUrl(activity, 'app', userId);
  try {
    const result = await Share.share({
      title: activity.title,
      message: buildShareMessage(activity, url),
      // iOS shows this as a separate attachment; Android ignores it, which is
      // why the URL is also inside the message text. Omitted entirely when
      // there is no destination, rather than sharing a dead link.
      ...(url ? { url } : {}),
    });

    if (result.action === Share.sharedAction) {
      const platform = result.activityType ?? 'unknown';
      await trackOtherShare(activity.id, platform);
    }
  } catch (err) {
    console.error('[Share] Failed:', err);
    Alert.alert('Error', 'Could not open the share sheet. Please try again.');
  }
}

// ─── Copy Link ────────────────────────────────────────────────────────────────

export function buildShareableUrl(activity: Activity, userId?: string): string | null {
  return buildActivityUrl(activity, 'link', userId);
}


