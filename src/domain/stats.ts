import { elapsedMs, type Fast } from './fast';
import { DAY, HOUR } from './time';

/** Local calendar day key, "2026-10-30". Fasts are stored in UTC and shown in local time. */
export function dayKey(t: number): string {
  const d = new Date(t);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function startOfLocalDay(t: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Next local midnight. Uses the calendar, not +24 h, so DST days come out right. */
function nextLocalMidnight(t: number): number {
  const d = new Date(startOfLocalDay(t));
  d.setDate(d.getDate() + 1);
  return d.getTime();
}

/** Monday 00:00 local of the week containing t. */
export function startOfLocalWeek(t: number): number {
  const d = new Date(startOfLocalDay(t));
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  return d.getTime();
}

const fastEnd = (f: Fast, now: number) => f.end ?? now;

export function longestFast(fasts: readonly Fast[], now: number): Fast | null {
  let best: Fast | null = null;
  for (const f of fasts) {
    if (!best || elapsedMs(f, now) > elapsedMs(best, now)) best = f;
  }
  return best;
}

/** Hours fasted inside [from, to), clipping fasts that cross the edges. */
export function hoursInRange(fasts: readonly Fast[], from: number, to: number, now: number): number {
  let ms = 0;
  for (const f of fasts) {
    const s = Math.max(f.start, from);
    const e = Math.min(fastEnd(f, now), to);
    if (e > s) ms += e - s;
  }
  return ms / HOUR;
}

/** Hours fasted per local day. A multi-day fast fills every day it touches. */
export function hoursByDay(fasts: readonly Fast[], now: number): Map<string, number> {
  const out = new Map<string, number>();
  for (const f of fasts) {
    let cursor = f.start;
    const end = fastEnd(f, now);
    while (cursor < end) {
      const boundary = Math.min(nextLocalMidnight(cursor), end);
      const key = dayKey(cursor);
      out.set(key, (out.get(key) ?? 0) + (boundary - cursor) / HOUR);
      cursor = boundary;
    }
  }
  return out;
}

export interface WeekBucket {
  weekStart: number;
  hours: number;
}

/** The last `weeks` weeks, oldest first, including the current one. */
export function hoursPerWeek(fasts: readonly Fast[], weeks: number, now: number): WeekBucket[] {
  const out: WeekBucket[] = [];
  const thisWeek = startOfLocalWeek(now);
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(thisWeek);
    d.setDate(d.getDate() - 7 * i);
    const start = d.getTime();
    const endDate = new Date(start);
    endDate.setDate(endDate.getDate() + 7);
    out.push({ weekStart: start, hours: hoursInRange(fasts, start, endDate.getTime(), now) });
  }
  return out;
}

export interface FastLength {
  id: string;
  start: number;
  hours: number;
  goalHours: number | null;
}

/** One entry per fast started in the last `days` days, oldest first. */
export function fastLengths(fasts: readonly Fast[], days: number, now: number): FastLength[] {
  const since = now - days * DAY;
  return fasts
    .filter((f) => f.start >= since)
    .sort((a, b) => a.start - b.start)
    .map((f) => ({
      id: f.id,
      start: f.start,
      hours: elapsedMs(f, now) / HOUR,
      goalHours:
        f.goal === null ? null : (f.goal.kind === 'duration' ? f.goal.ms : f.goal.at - f.start) / HOUR,
    }));
}

/**
 * Streaks the person defines: consecutive local days with at least `minHours` fasted.
 * There is no penalty and no "broken streak" message; a gap is just data.
 */
export function streaks(
  fasts: readonly Fast[],
  minHours: number,
  now: number,
): { current: number; longest: number } {
  const byDay = hoursByDay(fasts, now);
  const qualifying = new Set([...byDay].filter(([, h]) => h >= minHours).map(([k]) => k));
  const keys = [...qualifying].sort();
  let longest = 0;
  let run = 0;
  let prev: number | null = null;
  for (const k of keys) {
    const t = new Date(`${k}T12:00:00`).getTime();
    run = prev !== null && Math.round((t - prev) / DAY) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = t;
  }
  let current = 0;
  const d = new Date(startOfLocalDay(now));
  // Today still counts as "in progress", so start from today if it qualifies, else yesterday.
  if (!qualifying.has(dayKey(d.getTime()))) d.setDate(d.getDate() - 1);
  while (qualifying.has(dayKey(d.getTime()))) {
    current++;
    d.setDate(d.getDate() - 1);
  }
  return { current, longest };
}

export function bmi(weightKg: number, heightM: number): number | null {
  if (weightKg <= 0 || heightM <= 0) return null;
  return weightKg / (heightM * heightM);
}

export const HEALTHY_BMI = { min: 18.5, max: 25 } as const;

export interface Records {
  longest: Fast | null;
  longestStreakDays: number;
  hoursThisYear: number;
  hoursThisMonth: number;
}

export function records(fasts: readonly Fast[], streakMinHours: number, now: number): Records {
  const d = new Date(now);
  const yearStart = new Date(d.getFullYear(), 0, 1).getTime();
  const monthStart = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
  return {
    longest: longestFast(fasts, now),
    longestStreakDays: streaks(fasts, streakMinHours, now).longest,
    hoursThisYear: hoursInRange(fasts, yearStart, now, now),
    hoursThisMonth: hoursInRange(fasts, monthStart, now, now),
  };
}
