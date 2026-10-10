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
 * because profiles are world-readable and a push token should not be.
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

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
 * Ask for permission and record this device's push token.
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
      await Notifications.setNotificationChannelAsync('default', {
        name: 'ZubHub',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    if (!token) return;

    await setDoc(
      doc(db, 'push_tokens', userId),
      { token, platform: Platform.OS, updated_at: serverTimestamp() },
      { merge: true },
    );
  } catch (err: any) {
    // Never block sign-in on push setup.
    console.warn('[Push] registration failed:', err?.message ?? err);
  }
}

/** Drop this user's token, so a signed-out device stops receiving their alerts. */
export async function unregisterPushNotifications(userId: string): Promise<void> {
  try {
    if (userId) await deleteDoc(doc(db, 'push_tokens', userId));
  } catch {
    // Best effort.
  }
}

/**
 * Send a push to one user. Silently does nothing when the recipient has no
 * token, has never granted permission, or is the sender.
 */
export async function sendPushToUser(
  recipientId: string | undefined,
  senderId: string | undefined,
  content: { title: string; body: string; data?: Record<string, unknown> },
): Promise<void> {
  try {
    if (!recipientId || recipientId === senderId) return;

    const snap = await getDoc(doc(db, 'push_tokens', recipientId));
    const token = snap.exists() ? (snap.data().token as string | undefined) : undefined;
    if (!token) return;

    await fetch(EXPO_PUSH_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        to: token,
        title: content.title,
        body: content.body,
        data: content.data ?? {},
        sound: null,
      }),
    });
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
