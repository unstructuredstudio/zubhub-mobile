/**
 * Push notifications.
 *
 * There is no backend to send from, so the *acting* client sends the push: when
 * you facilitate or remix someone's activity, your device posts to Expo's push
 * service addressed to the author's token. That keeps this working with no
 * server, and is the piece to move behind the API proxy when one exists --
 * alongside the Claude key, for the same reason.
 *
 * Tokens live in `push_tokens/{userId}` rather than on the public user profile,
 * because profiles are world-readable and a push token should not be. Each of
 * the user's devices has its own entry there, under `devices`.
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import {
  doc, getDoc, setDoc, updateDoc, deleteField, FieldPath, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { UserProfile } from '../types';

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

/**
 * Show notifications that arrive while the app is open. Without this, a
 * delivered notification is silently swallowed in the foreground.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/**
 * Expo issues push tokens per EAS project, so an unlinked project cannot get
 * one. Returns null rather than throwing, so a project that has not run
 * `eas init` simply has no push rather than a crash on launch.
 */
function easProjectId(): string | null {
  const id =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as any).easConfig?.projectId;
  if (!id || id === 'YOUR_EAS_PROJECT_ID') return null;
  return id;
}

/**
 * Android channel for activity updates. High importance, so a notification pops
 * up on screen rather than only appearing in the shade. A channel's importance
 * cannot be raised once it exists on a phone, which is why this is a new id
 * rather than the older 'default' channel, created at normal importance.
 */
const UPDATES_CHANNEL = 'updates';

/** This device's token, once registered, so sign-out can remove just this one. */
let thisDeviceToken: string | null = null;

/**
 * Ask for permission and record this device's push token.
 *
 * One person may be signed in on several devices, so each token is kept as its
 * own entry under `devices` in `push_tokens/{userId}`, keyed by the token.
 * Storing a single `token` meant whichever device opened the app last took
 * every notification from the others.
 *
 * Call after sign-in, not on first launch: a permission prompt makes more sense
 * once someone has an account that things can happen to.
 */
export async function registerForPushNotifications(userId: string): Promise<void> {
  try {
    if (!userId) return;

    // Simulators cannot receive push, and asking there just fails.
    if (!Device.isDevice) return;

    const projectId = easProjectId();
    if (!projectId) {
      console.warn('[Push] No EAS project id. Run `eas init`; push is disabled until then.');
      return;
    }

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted') {
      // Only prompts the first time; afterwards this resolves immediately with
      // whatever the user already chose.
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== 'granted') return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(UPDATES_CHANNEL, {
        name: 'Activity updates',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    if (!token) return;
    thisDeviceToken = token;

    await setDoc(
      doc(db, 'push_tokens', userId),
      {
        devices: { [token]: { platform: Platform.OS, updated_at: serverTimestamp() } },
        // The single `token` from before per-device storage may belong to a
        // device that has since signed in as someone else; drop it.
        token: deleteField(),
        platform: deleteField(),
        updated_at: deleteField(),
      },
      { merge: true },
    );
    console.log(`[Push] registered this ${Platform.OS} device for user ${userId}`);
  } catch (err: any) {
    // Never block sign-in on push setup.
    console.warn('[Push] registration failed:', err?.message ?? err);
  }
}

/**
 * Stop sending this user's notifications to this device, after sign-out.
 * Only this device's entry is removed; their other devices keep receiving.
 */
export async function unregisterPushNotifications(userId: string): Promise<void> {
  try {
    if (!userId || !thisDeviceToken) return;
    const ref = doc(db, 'push_tokens', userId);
    await updateDoc(ref, new FieldPath('devices', thisDeviceToken), deleteField());
    // Tokens written before per-device storage sit in a single `token` field.
    const snap = await getDoc(ref);
    if (snap.exists() && snap.data().token === thisDeviceToken) {
      await updateDoc(ref, { token: deleteField() });
    }
    thisDeviceToken = null;
  } catch {
    // Best effort.
  }
}

/** How a person is named to the authors whose activities they use. */
export const ANONYMOUS_EDUCATOR = 'An educator';

/**
 * The name to show an author for the person who acted on their activity: the
 * person's full name, unless they turned off "Show my name to authors" or
 * have no name on their profile.
 */
export function nameForAuthors(
  person: Pick<UserProfile, 'full_name' | 'show_name_to_authors'> | null | undefined,
): string {
  const name = person?.full_name?.trim();
  if (!name || person?.show_name_to_authors === false) return ANONYMOUS_EDUCATOR;
  return name;
}

/** Every device token recorded for a user, including a pre-devices `token`. */
function tokensFrom(data: Record<string, any> | undefined): string[] {
  if (!data) return [];
  const tokens = new Set<string>(Object.keys(data.devices ?? {}));
  if (typeof data.token === 'string') tokens.add(data.token);
  return [...tokens];
}

/**
 * Send a push to every device of one user. Does nothing when the recipient has
 * no device registered, or is the sender. Each of those outcomes, and Expo's
 * reply, is logged under [Push]: Expo answers a rejected push with a normal 200
 * response, so without reading the reply a failure leaves no trace.
 */
export async function sendPushToUser(
  recipientId: string | undefined,
  senderId: string | undefined,
  content: { title: string; body: string; data?: Record<string, unknown> },
): Promise<void> {
  try {
    if (!recipientId) {
      console.warn('[Push] skipped: activity has no creator id');
      return;
    }
    if (recipientId === senderId) {
      console.log('[Push] skipped: recipient is the sender');
      return;
    }

    const snap = await getDoc(doc(db, 'push_tokens', recipientId));
    const tokens = tokensFrom(snap.exists() ? snap.data() : undefined);
    if (tokens.length === 0) {
      console.log(`[Push] skipped: no devices registered for user ${recipientId}`);
      return;
    }

    const res = await fetch(EXPO_PUSH_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(
        tokens.map((to) => ({
          to,
          title: content.title,
          body: content.body,
          data: content.data ?? {},
          channelId: UPDATES_CHANNEL,
          priority: 'high',
          sound: 'default',
        })),
      ),
    });
    const reply = await res.json().catch(() => null);
    const tickets: any[] = Array.isArray(reply?.data) ? reply.data : [];
    const failed = tickets.filter((t) => t?.status !== 'ok');
    if (!res.ok || tickets.length === 0 || failed.length > 0) {
      console.warn(`[Push] rejected by Expo (HTTP ${res.status}):`, JSON.stringify(reply));
    } else {
      console.log(`[Push] sent "${content.title}" to ${tokens.length} device(s) of user ${recipientId}`);
    }
  } catch (err: any) {
    // A failed notification must never fail the action that triggered it.
    console.warn('[Push] send failed:', err?.message ?? err);
  }
}

/** Local notification confirming the author's own activity went live. */
export async function notifyActivityPublished(title: string): Promise<void> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Activity published',
        body: `"${title}" is now live on ZubHub.`,
        data: { type: 'activity_published' },
      },
      trigger: null, // immediate
    });
  } catch {
    // Best effort.
  }
}
