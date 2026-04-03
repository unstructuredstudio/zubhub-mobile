import * as Notifications from 'expo-notifications';

/** Fire an immediate local notification when an activity is published. */
export async function notifyActivityPublished(title: string): Promise<void> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Activity Published! 🎉',
        body: `"${title}" is now live on ZubHub. Educators can discover and download it.`,
        data: { type: 'activity_published' },
      },
      trigger: null, // immediate
    });
  } catch {
    // notifications are best-effort
  }
}

/** Simulate an engagement notification (demo — fires 20 s after calling). */
export async function scheduleEngagementDemo(activityTitle: string): Promise<void> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'New Download! 📥',
        body: `An educator just downloaded "${activityTitle}".`,
        data: { type: 'download' },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 20 },
    });
  } catch {}
}
