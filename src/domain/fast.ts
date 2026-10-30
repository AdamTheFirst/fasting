import { DAY, HOUR } from './time';

/** All timestamps are UTC epoch milliseconds. Elapsed time is always derived from start, never counted. */
export type Goal = { kind: 'duration'; ms: number } | { kind: 'until'; at: number };

export interface Fast {
  id: string;
  start: number;
  /** null while the fast is running. */
  end: number | null;
  goal: Goal | null;
  presetId: string | null;
  note: string | null;
}

export interface Preset {
  id: string;
  name: string;
  goal: Goal | null;
}

export const isRunning = (fast: Fast) => fast.end === null;

export function elapsedMs(fast: Fast, now: number): number {
  return Math.max(0, (fast.end ?? now) - fast.start);
}

/** When the goal is reached, or null for an open-ended fast. */
export function goalReachedAt(fast: Pick<Fast, 'start' | 'goal'>): number | null {
  if (!fast.goal) return null;
  return fast.goal.kind === 'duration' ? fast.start + fast.goal.ms : fast.goal.at;
}

export type FastError = 'end_before_start' | 'start_in_future' | 'end_in_future' | 'overlaps';

/** Checks one fast against the clock and the rest of history. Length is never an error. */
export function validateFast(
  fast: Pick<Fast, 'id' | 'start' | 'end'>,
  others: readonly Pick<Fast, 'id' | 'start' | 'end'>[],
  now: number,
): FastError | null {
  if (fast.start > now) return 'start_in_future';
  if (fast.end !== null && fast.end > now) return 'end_in_future';
  if (fast.end !== null && fast.end <= fast.start) return 'end_before_start';
  const end = fast.end ?? now;
  const overlaps = others.some((o) => o.id !== fast.id && o.start < end && (o.end ?? now) > fast.start);
  return overlaps ? 'overlaps' : null;
}

export const FAST_ERROR_TEXT: Record<FastError, string> = {
  end_before_start: 'End is before start.',
  start_in_future: 'Start is in the future.',
  end_in_future: 'End is in the future.',
  overlaps: 'This overlaps another fast.',
};

/** Goal choices offered on the Start screen. Open-ended is first and the default. */
export const GOAL_CHOICES: { label: string; goal: Goal | null }[] = [
  { label: 'Open-ended', goal: null },
  { label: '16h', goal: { kind: 'duration', ms: 16 * HOUR } },
  { label: '24h', goal: { kind: 'duration', ms: 24 * HOUR } },
  { label: '3 days', goal: { kind: 'duration', ms: 3 * DAY } },
  { label: '5 days', goal: { kind: 'duration', ms: 5 * DAY } },
];

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
