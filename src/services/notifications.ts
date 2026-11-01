import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import type { ScheduledAlert } from '../domain/milestones';
import type { PlannedFast } from '../domain/plan';

const CHANNEL_ID = 'milestones';
const KIND = 'milestone';
const PLAN_CHANNEL_ID = 'plans';
const PLAN_KIND = 'plan';

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
    await Notifications.setNotificationChannelAsync(PLAN_CHANNEL_ID, {
      name: 'Planned fasts you asked to be reminded of',
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

/**
 * Replaces every planned-fast reminder. Only plans with "Remind me" on and a start still ahead get
 * one, and the reminder only says the time has come; it never starts the fast.
 */
export async function syncPlanReminders(
  plans: readonly PlannedFast[],
  nameOf: (p: PlannedFast) => string,
  now: number,
): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.content.data?.kind === PLAN_KIND)
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
  const due = plans.filter((p) => p.remind && p.at > now);
  if (due.length === 0) return;
  const { granted } = await Notifications.getPermissionsAsync();
  if (!granted) return;
  for (const p of due) {
    await Notifications.scheduleNotificationAsync({
      identifier: `plan-${p.id}`,
      content: {
        title: 'Planned fast',
        body: `${nameOf(p)} was planned for now. Start it when you are ready.`,
        data: { kind: PLAN_KIND },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: p.at,
        channelId: PLAN_CHANNEL_ID,
      },
    });
  }
}
