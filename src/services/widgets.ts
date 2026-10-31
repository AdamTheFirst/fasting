import { createLiveActivity, createWidget } from 'expo-widgets';
import { Platform } from 'react-native';

import { type Fast, goalReachedAt } from '../domain/fast';
import FastActivity, { type FastActivityProps } from '../widgets/FastActivity';
import FastWidget, { type FastWidgetProps } from '../widgets/FastWidget';

/**
 * Keeps the home screen widget and the lock screen Live Activity in step with the running fast.
 * iOS only for now. Nothing here sends data anywhere: the widget reads it from the phone.
 */
const enabled = Platform.OS === 'ios';

const widget = enabled ? createWidget<FastWidgetProps>('FastWidget', FastWidget, { discreet: false }) : null;
const activities = enabled ? createLiveActivity<FastActivityProps>('FastActivity', FastActivity) : null;

let currentKey = '';

/** "06:34" today, "Mon 06:34" on another day: a multi-day goal must not read as this morning. */
function goalWhen(at: number): string {
  const d = new Date(at);
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  if (d.toDateString() === new Date().toDateString()) return time;
  return `${d.toLocaleDateString(undefined, { weekday: 'short' })} ${time}`;
}

export function syncWidgets(running: Fast | null, discreet: boolean): void {
  if (!widget || !activities) return;
  // Leave keys out instead of setting them to null: the widget's props go into UserDefaults,
  // which rejects null and makes the native call throw.
  const goalAt = running ? goalReachedAt(running) : null;
  const props: FastWidgetProps = {
    discreet,
    ...(running ? { start: running.start } : {}),
    ...(goalAt !== null ? { goalAt, goalText: goalWhen(goalAt) } : {}),
  };
  try {
    widget.updateSnapshot(props);
    const key = running ? `${running.id}:${running.start}:${props.goalAt}:${discreet}` : '';
    if (key === currentKey) return;
    currentKey = key;
    // One activity at a time: end whatever is showing, then start one for the running fast.
    for (const a of activities.getInstances()) void a.end('immediate');
    if (running) {
      activities.start(
        { start: running.start, goalAt: props.goalAt, goalText: props.goalText, discreet },
        'fastaway://',
      );
    }
  } catch {
    // Live Activities can be switched off in Settings; the app works the same without them.
  }
}
