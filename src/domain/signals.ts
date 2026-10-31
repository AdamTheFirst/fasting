import type { Fast } from './fast';
import { dayKey, hoursByDay } from './stats';

/** One day of body signals read from Apple Health or Health Connect. Any of them may be missing. */
export interface DailySignal {
  /** Local day, "2026-10-30". */
  day: string;
  restingHr?: number;
  hrv?: number;
  sleepHours?: number;
}

export type SignalKey = 'restingHr' | 'hrv' | 'sleepHours';

export const SIGNALS: readonly { key: SignalKey; label: string; unit: string }[] = [
  { key: 'restingHr', label: 'Resting heart rate', unit: 'bpm' },
  { key: 'hrv', label: 'Heart rate variability', unit: 'ms' },
  { key: 'sleepHours', label: 'Sleep', unit: 'h' },
];

export interface SignalComparison {
  key: SignalKey;
  /** Average on days you fasted at least `minHours`. */
  fasting: number | null;
  /** Average on other days. */
  other: number | null;
  fastingDays: number;
  otherDays: number;
}

/**
 * Compares each signal on fasting days and other days. It only shows the two averages;
 * it doesn't say which is better, because that depends on the person.
 */
export function compareSignals(
  signals: readonly DailySignal[],
  fasts: readonly Fast[],
  now: number,
  minHours = 16,
): SignalComparison[] {
  const byDay = hoursByDay(fasts, now);
  return SIGNALS.map(({ key }) => {
    const fasting: number[] = [];
    const other: number[] = [];
    for (const s of signals) {
      const v = s[key];
      if (v === undefined) continue;
      ((byDay.get(s.day) ?? 0) >= minHours ? fasting : other).push(v);
    }
    const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
    return {
      key,
      fasting: avg(fasting),
      other: avg(other),
      fastingDays: fasting.length,
      otherDays: other.length,
    };
  });
}

/** Averages several samples per day into one value per local day, oldest first. */
export function dailyAverage(
  samples: readonly { at: number; value: number }[],
): { day: string; value: number }[] {
  const sums = new Map<string, { sum: number; n: number }>();
  for (const s of samples) {
    const k = dayKey(s.at);
    const cur = sums.get(k) ?? { sum: 0, n: 0 };
    sums.set(k, { sum: cur.sum + s.value, n: cur.n + 1 });
  }
  return [...sums]
    .map(([day, { sum, n }]) => ({ day, value: sum / n }))
    .sort((a, b) => a.day.localeCompare(b.day));
}

/** Merges per-signal daily series into one row per day. */
export function mergeSignals(
  series: Partial<Record<SignalKey, { day: string; value: number }[]>>,
): DailySignal[] {
  const out = new Map<string, DailySignal>();
  for (const [key, rows] of Object.entries(series) as [SignalKey, { day: string; value: number }[]][]) {
    for (const r of rows) out.set(r.day, { ...(out.get(r.day) ?? { day: r.day }), [key]: r.value });
  }
  return [...out.values()].sort((a, b) => a.day.localeCompare(b.day));
}
