import type { Appearance, ThemeId } from '../theme/tokens';
import { DEFAULT_MILESTONE_SETTINGS, type MilestoneSettings } from './milestones';

/** Everything a fresh install starts with. Nothing is on that the person did not turn on. */
export interface AppSettings {
  milestones: MilestoneSettings;
  safetyCardDisabled: boolean;
  safetyCardDismissedFor: string[];
  healthSyncEnabled: boolean;
  streakMinHours: number;
  showBmi: boolean;
  /** Optional weekly rhythm: weekday (0 = Monday … 6 = Sunday) to the preset picked on the Start screen that day. */
  weekdayPresets: Partial<Record<number, string>>;
  theme: ThemeId;
  appearance: Appearance;
  /** "Notes from past you" on the running fast. */
  showPastNotes: boolean;
  /** The one-time "I'm 18 or older" tap. */
  adultConfirmed: boolean;
  /** Read sleep, resting heart rate and HRV (asked when turned on). */
  healthSignals: boolean;
  /** Widget and lock screen show only the time, never the word "fast". */
  discreetWidget: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  milestones: DEFAULT_MILESTONE_SETTINGS,
  safetyCardDisabled: false,
  safetyCardDismissedFor: [],
  healthSyncEnabled: false,
  streakMinHours: 16,
  showBmi: false,
  weekdayPresets: {},
  theme: 'butter',
  appearance: 'system',
  showPastNotes: true,
  adultConfirmed: false,
  healthSignals: false,
  discreetWidget: false,
};

/** Monday-first weekday index for a local time: 0 = Monday … 6 = Sunday. */
export const mondayIndex = (t: number) => (new Date(t).getDay() + 6) % 7;

/** The preset your weekly rhythm picks for today, if you set one and it still exists. */
export function presetForToday(
  weekdayPresets: AppSettings['weekdayPresets'],
  presetIds: readonly string[],
  now: number,
): string | null {
  const id = weekdayPresets[mondayIndex(now)];
  return id && presetIds.includes(id) ? id : null;
}

/** Assigns or clears one weekday. A day holds one preset, so assigning moves it. */
export function toggleWeekday(
  weekdayPresets: AppSettings['weekdayPresets'],
  day: number,
  presetId: string,
): AppSettings['weekdayPresets'] {
  const next = { ...weekdayPresets };
  if (next[day] === presetId) delete next[day];
  else next[day] = presetId;
  return next;
}
