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

const widget = enabled
  ? createWidget<FastWidgetProps>('FastWidget', FastWidget, { start: null, goalAt: null, discreet: false })
  : null;
const activities = enabled ? createLiveActivity<FastActivityProps>('FastActivity', FastActivity) : null;

let currentKey = '';

export function syncWidgets(running: Fast | null, discreet: boolean): void {
  if (!widget || !activities) return;
  const props = running
    ? { start: running.start, goalAt: goalReachedAt(running), discreet }
    : { start: null, goalAt: null, discreet };
  try {
    widget.updateSnapshot(props);
    const key = running ? `${running.id}:${running.start}:${props.goalAt}:${discreet}` : '';
    if (key === currentKey) return;
    currentKey = key;
    // One activity at a time: end whatever is showing, then start one for the running fast.
    for (const a of activities.getInstances()) void a.end('immediate');
    if (running) {
      activities.start({ start: running.start, goalAt: props.goalAt, discreet }, 'fastaway://');
    }
  } catch {
    // Live Activities can be switched off in Settings; the app works the same without them.
  }
}
