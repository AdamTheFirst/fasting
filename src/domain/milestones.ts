import { type Fast, goalReachedAt } from './fast';
import { formatDuration, HOUR } from './time';

export interface MilestoneSource {
  label: string;
  url: string;
}

export interface Milestone {
  id: string;
  hours: number;
  title: string;
  /** A few words for the running-fast timeline, e.g. "Ketones rising". */
  short?: string;
  /** "Likely", never "you are now in": these vary by person and by what you ate before. */
  body: string;
  source: MilestoneSource | null;
}

const STATPEARLS = {
  label: 'StatPearls: fasting physiology',
  url: 'https://www.ncbi.nlm.nih.gov/sites/books/NBK534877/',
};
const REVIEW_2025 = {
  label: 'Fasting physiology review, 2025',
  url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12455479/',
};

/**
 * The sourced milestones from the spec. Every one is off until the person turns it on.
 * Autophagy is deliberately not here: there is no human data on when it starts,
 * so it is an info card (AUTOPHAGY_NOTE), not a countdown.
 */
export const BUILT_IN_MILESTONES: readonly Milestone[] = [
  {
    id: 'h12',
    short: 'Insulin falling',
    hours: 12,
    title: '12 hours',
    body: 'Insulin is likely low and your liver is running on stored glycogen.',
    source: STATPEARLS,
  },
  {
    id: 'h24',
    short: 'Glycogen running low',
    hours: 24,
    title: '24 hours',
    body: 'Liver glycogen is likely mostly used up. Your body is shifting to fat.',
    source: STATPEARLS,
  },
  {
    id: 'h48',
    short: 'Ketones rising',
    hours: 48,
    title: '48 hours',
    body: 'Ketones are likely climbing. Small studies of multi-day fasts show growth hormone rising.',
    source: { label: 'Ho et al., J Clin Invest 1988', url: 'https://www.jci.org/articles/view/113450' },
  },
  {
    id: 'h72',
    short: 'Ketones near peak',
    hours: 72,
    title: '72 hours',
    body: 'Ketone production is likely near its peak and blood sugar near its low point.',
    source: REVIEW_2025,
  },
];

export const AUTOPHAGY_NOTE =
  "Animal studies show autophagy rises with fasting. When it starts in humans hasn't been measured yet.";

export interface MilestoneSettings {
  /** Ids of built-in milestones the person turned on. Empty on a fresh install. */
  enabledIds: readonly string[];
  /** The person's own milestones, e.g. { hours: 36, title: '36 h: walk' }. */
  custom: readonly Milestone[];
  notifyGoal: boolean;
  notifyPersonalBest: boolean;
}

export const DEFAULT_MILESTONE_SETTINGS: MilestoneSettings = {
  enabledIds: [],
  custom: [],
  notifyGoal: false,
  notifyPersonalBest: false,
};

export interface ScheduledAlert {
  key: string;
  fireAt: number;
  title: string;
  body: string;
}

/**
 * Every alert still due for a running fast, computed from its stored start.
 * Re-run after any edit to the fast, so a moved start moves every alert with it.
 */
export function planAlerts(
  fast: Fast,
  settings: MilestoneSettings,
  longestPreviousMs: number,
  now: number,
): ScheduledAlert[] {
  if (fast.end !== null) return [];
  const alerts: ScheduledAlert[] = [];
  const chosen = [
    ...BUILT_IN_MILESTONES.filter((m) => settings.enabledIds.includes(m.id)),
    ...settings.custom,
  ];
  for (const m of chosen) {
    alerts.push({
      key: `${fast.id}:${m.id}`,
      fireAt: fast.start + m.hours * HOUR,
      title: m.title,
      body: m.source ? `${m.body} Source: ${m.source.label}.` : m.body,
    });
  }
  const goalAt = goalReachedAt(fast);
  if (settings.notifyGoal && goalAt !== null) {
    alerts.push({
      key: `${fast.id}:goal`,
      fireAt: goalAt,
      title: 'Goal reached',
      body: `${formatDuration(goalAt - fast.start)}. Keep going or end it, your call.`,
    });
  }
  if (settings.notifyPersonalBest && longestPreviousMs > 0) {
    alerts.push({
      key: `${fast.id}:best`,
      fireAt: fast.start + longestPreviousMs,
      title: 'New longest fast',
      body: `You passed ${formatDuration(longestPreviousMs)}.`,
    });
  }
  return alerts.filter((a) => a.fireAt > now).sort((a, b) => a.fireAt - b.fireAt);
}

/** The person's own milestone, e.g. 36 h "walk and electrolytes". Any hour count, no upper limit. */
export function customMilestone(hours: number, note: string, id: string): Milestone | null {
  if (!Number.isFinite(hours) || hours <= 0) return null;
  const title = formatDuration(hours * HOUR)
    .replace(/ 00m$/, '')
    .replace(/ 0h$/, '')
    .replace(/^0h /, '');
  return { id, hours, title, body: note.trim() || `You reached ${title}.`, source: null };
}

export type TimelineKind = 'milestone' | 'custom' | 'goal' | 'best';

export interface TimelineMark {
  key: string;
  kind: TimelineKind;
  /** Hours from the start of the fast. */
  hours: number;
  title: string;
  body: string;
  source: MilestoneSource | null;
  passed: boolean;
}

/**
 * What the running-fast screen shows along the fast: every built-in milestone (shown
 * as information, whether or not its alert is on), the person's own milestones,
 * the goal and their previous longest fast. Sorted by hour.
 */
export function timeline(
  fast: Fast,
  custom: readonly Milestone[],
  longestPreviousMs: number,
  now: number,
): TimelineMark[] {
  const elapsedH = ((fast.end ?? now) - fast.start) / HOUR;
  const marks: Omit<TimelineMark, 'passed'>[] = [
    ...BUILT_IN_MILESTONES.map((m) => ({
      ...m,
      title: m.short ?? m.title,
      key: m.id,
      kind: 'milestone' as const,
    })),
    // A custom milestone's title is just its hour, so its note becomes the title on the timeline.
    ...custom.map((m) => ({
      ...m,
      title: m.body,
      body: 'Your own milestone.',
      key: `c:${m.id}`,
      kind: 'custom' as const,
    })),
  ];
  const goalAt = goalReachedAt(fast);
  if (goalAt !== null) {
    const hours = (goalAt - fast.start) / HOUR;
    marks.push({
      key: 'goal',
      kind: 'goal',
      hours,
      title: 'Your goal',
      body: 'Past it, the fast keeps counting until you end it.',
      source: null,
    });
  }
  if (longestPreviousMs > 0) {
    marks.push({
      key: 'best',
      kind: 'best',
      hours: longestPreviousMs / HOUR,
      title: 'Your longest fast',
      body: 'Pass it and this one is your new record.',
      source: null,
    });
  }
  return marks
    .map((m) => ({ ...m, passed: elapsedH >= m.hours }))
    .sort((a, b) => a.hours - b.hours || a.key.localeCompare(b.key));
}
