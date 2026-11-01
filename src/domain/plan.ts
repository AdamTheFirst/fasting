import { type Goal, goalLabel, newId, type Preset } from './fast';
import { mondayIndex } from './settings';
import { startOfLocalDay } from './stats';
import { formatShort, HOUR } from './time';

/** A fast you mean to start later, such as "72 h from Friday 20:00". Nothing starts it for you. */
export interface PlannedFast {
  id: string;
  /** When you mean to start, UTC epoch ms. */
  at: number;
  goal: Goal | null;
  presetId: string | null;
  /** A reminder at the start time. Off unless you turn it on. */
  remind: boolean;
}

/** A plan stays on the list this long after its start time, then it quietly drops off. */
export const PLAN_GRACE_MS = 12 * HOUR;

export function newPlan(at: number, goal: Goal | null, presetId: string | null = null): PlannedFast {
  return { id: newId(), at, goal, presetId, remind: false };
}

/** Plans still worth showing, soonest first. Ones more than 12 hours past their start are gone. */
export function upcomingPlans(plans: readonly PlannedFast[], now: number): PlannedFast[] {
  return plans.filter((p) => p.at > now - PLAN_GRACE_MS).sort((a, b) => a.at - b.at);
}

export const isDue = (plan: PlannedFast, now: number) => plan.at <= now;

/** "in 2d 4h", "in 35m", or "now" once the start time has come. */
export function countdownLabel(plan: PlannedFast, now: number): string {
  return isDue(plan, now) ? 'now' : `in ${formatShort(plan.at - now)}`;
}

/** What a plan is called: its preset's name if it came from one, otherwise its goal. */
export function planName(plan: PlannedFast, presets: readonly Preset[]): string {
  const preset = plan.presetId ? presets.find((p) => p.id === plan.presetId) : undefined;
  return preset?.name ?? goalLabel(plan.goal);
}

/** Next `hour`:00 that is at least an hour away: the default start time for a new plan. */
export function nextRoundStart(now: number, hour = 20): number {
  const d = new Date(now);
  d.setHours(hour, 0, 0, 0);
  if (d.getTime() < now + HOUR) d.setDate(d.getDate() + 1);
  return d.getTime();
}

export interface PlanDay {
  /** Local midnight. */
  start: number;
  weekday: number;
  isToday: boolean;
  /** The preset your weekly rhythm gives this weekday, if any. */
  preset: Preset | null;
  /** Plans that start on this day. */
  plans: PlannedFast[];
}

/** The next seven days from today, each with its rhythm preset and any plans that start then. */
export function weekAhead(
  weekdayPresets: Partial<Record<number, string>>,
  presets: readonly Preset[],
  plans: readonly PlannedFast[],
  now: number,
): PlanDay[] {
  const today = startOfLocalDay(now);
  return Array.from({ length: 7 }, (_, i) => {
    // Step by calendar day, not 24 h, so a DST change keeps days on midnight.
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const start = d.getTime();
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const weekday = mondayIndex(start + HOUR);
    const id = weekdayPresets[weekday];
    return {
      start,
      weekday,
      isToday: i === 0,
      preset: (id && presets.find((p) => p.id === id)) || null,
      plans: plans.filter((p) => p.at >= start && p.at < next.getTime()),
    };
  });
}
