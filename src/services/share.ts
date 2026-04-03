/**
 * Share service — generates pre-filled WhatsApp messages and uses
 * the native Share API for other platforms.
 *
 * UTM parameters are appended to the URL so referral traffic can be
 * traced back to specific shares in analytics.
 */

import { Share, Linking, Alert, Platform } from 'react-native';
import { Activity } from '../types';
import { trackWhatsAppShare, trackOtherShare } from './analytics';

const APP_BASE_URL = 'https://zubhub.app';

// ─── URL Helpers ──────────────────────────────────────────────────────────────

function buildActivityUrl(
  activity: Activity,
  source: string,
  userId?: string
): string {
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

function buildWhatsAppMessage(activity: Activity, activityUrl: string): string {
  const ageRange = activity.max_age
    ? `${activity.min_age}–${activity.max_age}`
    : `${activity.min_age}+`;

  let msg =
    `*${activity.title}*\n\n` +
    `${activity.description}\n\n` +
    `⏱ ${activity.duration_minutes} minutes  |  👥 Ages ${ageRange}\n\n`;

  if (activity.video_url) {
    msg += `🎬 Watch: ${activity.video_url}\n\n`;
  }

  msg +=
    `Found this on ZubHub - a free platform for educator activities.\n` +
    `${activityUrl}`;

  return msg;
}

export async function shareOnWhatsApp(
  activity: Activity,
  userId?: string
): Promise<boolean> {
  const url = buildActivityUrl(activity, 'whatsapp', userId);
  const message = buildWhatsAppMessage(activity, url);
  const encoded = encodeURIComponent(message);
  const whatsappUrl = `whatsapp://send?text=${encoded}`;

  const canOpen = await Linking.canOpenURL(whatsappUrl);
  if (!canOpen) {
    // Fallback to WhatsApp web
    const webUrl = `https://api.whatsapp.com/send?text=${encoded}`;
    await Linking.openURL(webUrl);
    await trackWhatsAppShare(activity.id);
    return true;
  }

  await Linking.openURL(whatsappUrl);
  await trackWhatsAppShare(activity.id);
  return true;
}

// ─── Native Share Sheet ───────────────────────────────────────────────────────

export async function shareActivity(
  activity: Activity,
  userId?: string
): Promise<void> {
  const url = buildActivityUrl(activity, 'app', userId);
  const ageRange = activity.max_age
    ? `${activity.min_age}–${activity.max_age}`
    : `${activity.min_age}+`;

  const videoLine = activity.video_url ? `\n🎬 Watch: ${activity.video_url}` : '';
  try {
    const result = await Share.share({
      title: activity.title,
      message:
        Platform.OS === 'android'
          ? `${activity.title} — ${activity.description}\n\n⏱ ${activity.duration_minutes} min | Ages ${ageRange}${videoLine}\n\n${url}`
          : `${activity.description}${videoLine}`,
      url, // iOS only
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

export function buildShareableUrl(activity: Activity, userId?: string): string {
  return buildActivityUrl(activity, 'link', userId);
}

// ─── WhatsApp Pre-filled Message Preview ─────────────────────────────────────

export function buildShareMessagePreview(activity: Activity): string {
  const ageRange = activity.max_age
    ? `${activity.min_age}–${activity.max_age}`
    : `${activity.min_age}+`;

  return (
    `Check out this activity!\n\n` +
    `${activity.title} — perfect for ages ${ageRange}, ` +
    `takes about ${activity.duration_minutes} minutes.\n\n` +
    `Downloaded from ZubHub – free activities for educators.`
  );
}
