import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { EngagementEventType } from '../types';
import { incrementDownloadCount, incrementShareCount, incrementViewCount } from './api';

interface TrackEventOptions {
  activityId?: string;
  eventType: EngagementEventType;
  platform?: string;
  metadata?: Record<string, unknown>;
}

async function trackEvent(options: TrackEventOptions): Promise<void> {
  const { activityId, eventType, platform, metadata } = options;
  try {
    await addDoc(collection(db, 'engagement_events'), {
      activity_id: activityId ?? null,
      user_id: auth.currentUser?.uid ?? null,
      event_type: eventType,
      platform: platform ?? null,
      metadata: metadata ?? null,
      created_at: serverTimestamp(),
    });
  } catch (err) {
    console.warn('[Analytics] Failed to track event:', err);
  }
}

// ─── Public Tracking Functions ────────────────────────────────────────────────

export async function trackActivityView(activityId: string): Promise<void> {
  await Promise.allSettled([
    trackEvent({ activityId, eventType: 'view' }),
    incrementViewCount(activityId),
  ]);
}

export async function trackDownload(activityId: string): Promise<void> {
  await Promise.allSettled([
    trackEvent({ activityId, eventType: 'download' }),
    incrementDownloadCount(activityId),
  ]);
}

export async function trackWhatsAppShare(activityId: string): Promise<void> {
  await Promise.allSettled([
    trackEvent({ activityId, eventType: 'share_whatsapp', platform: 'whatsapp' }),
    incrementShareCount(activityId),
  ]);
}

export async function trackOtherShare(activityId: string, platform: string): Promise<void> {
  await Promise.allSettled([
    trackEvent({ activityId, eventType: 'share_other', platform }),
    incrementShareCount(activityId),
  ]);
}

export async function trackActivityCreation(activityId: string): Promise<void> {
  await trackEvent({ activityId, eventType: 'create_activity' });
}

/**
 * `photoCount` is the number that decides whether the projects gallery is worth
 * its UI: if sessions rarely come with photos, nothing downstream of the upload
 * matters. Recorded per experience so attach rate is measurable, not guessed.
 */
export async function trackNoteAdded(
  activityId: string,
  hasRating: boolean,
  photoCount = 0,
): Promise<void> {
  await trackEvent({
    activityId,
    eventType: 'add_note',
    metadata: { has_rating: hasRating, photo_count: photoCount },
  });
}

/** One completed session. Pairs with `add_note` to give the attach rate. */
export async function trackFacilitation(
  activityId: string,
  studentCount: number,
): Promise<void> {
  await trackEvent({
    activityId,
    eventType: 'facilitate',
    metadata: { student_count: studentCount },
  });
}

export async function trackRemix(activityId: string, sourceId: string): Promise<void> {
  await trackEvent({ activityId, eventType: 'remix', metadata: { source_id: sourceId } });
}

// ─── Engagement Summary ───────────────────────────────────────────────────────

export interface EngagementSummary {
  total_downloads: number;
  total_shares: number;
  total_views: number;
  total_notes: number;
  downloads_last_30_days: number;
}

export async function getEngagementSummary(activityId: string): Promise<EngagementSummary> {
  const snapshot = await getDocs(
    query(collection(db, 'engagement_events'), where('activity_id', '==', activityId)),
  );

  const events = snapshot.docs.map(d => d.data());
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return {
    total_downloads: events.filter(e => e.event_type === 'download').length,
    total_shares: events.filter(
      e => e.event_type === 'share_whatsapp' || e.event_type === 'share_other',
    ).length,
    total_views: events.filter(e => e.event_type === 'view').length,
    total_notes: events.filter(e => e.event_type === 'add_note').length,
    downloads_last_30_days: events.filter(
      e =>
        e.event_type === 'download' &&
        e.created_at?.toDate?.() >= thirtyDaysAgo,
    ).length,
  };
}
