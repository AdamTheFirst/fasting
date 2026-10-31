import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import type { ScheduledAlert } from '../domain/milestones';

const CHANNEL_ID = 'milestones';
const KIND = 'milestone';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** Asked only when the person turns on their first milestone. */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Milestones you turned on',
      importance: AndroidImportance.DEFAULT,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

/**
 * Replaces every scheduled milestone alert with `alerts`. Alerts are scheduled
 * for fixed dates computed from the fast's start, so they fire with the phone
 * locked or the app killed, and editing the start just reschedules them.
 */
export async function syncMilestoneAlerts(alerts: readonly ScheduledAlert[]): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.content.data?.kind === KIND)
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
  if (alerts.length === 0) return;
  const { granted } = await Notifications.getPermissionsAsync();
  if (!granted) return;
  for (const a of alerts) {
    await Notifications.scheduleNotificationAsync({
      identifier: a.key,
      content: { title: a.title, body: a.body, data: { kind: KIND } },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: a.fireAt,
        channelId: CHANNEL_ID,
      },
    });
  }
}
