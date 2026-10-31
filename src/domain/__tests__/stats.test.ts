import type { Fast } from '../fast';
import {
  bmi,
  dayKey,
  fastLengths,
  hoursByDay,
  hoursInRange,
  hoursPerWeek,
  longestFast,
  startHours,
  averageHours,
  streaks,
} from '../stats';
import { DAY, HOUR } from '../time';

// Tests run in Europe/Istanbul (jest.global-setup.js), which is UTC+3 all year.
const local = (y: number, m: number, d: number, h = 0) => new Date(y, m - 1, d, h).getTime();
let n = 0;
const fast = (start: number, end: number | null): Fast => ({
  id: `f${n++}`,
  start,
  end,
  goal: null,
  presetId: null,
  note: null,
});

describe('stats', () => {
  it('splits a multi-day fast across local days', () => {
    const f = fast(local(2026, 10, 1, 20), local(2026, 10, 4, 8));
    const byDay = hoursByDay([f], local(2026, 10, 5));
    expect(byDay.get('2026-10-01')).toBeCloseTo(4);
    expect(byDay.get('2026-10-02')).toBeCloseTo(24);
    expect(byDay.get('2026-10-03')).toBeCloseTo(24);
    expect(byDay.get('2026-10-04')).toBeCloseTo(8);
  });

  it('finds the longest fast, counting a running one up to now', () => {
    const now = local(2026, 10, 10);
    const a = fast(now - 30 * HOUR, now - 10 * HOUR);
    const b = fast(now - 5 * DAY, null);
    expect(longestFast([a, b], now)?.id).toBe(b.id);
  });

  it('clips hours to a range', () => {
    const f = fast(local(2026, 9, 30, 12), local(2026, 10, 1, 12));
    expect(hoursInRange([f], local(2026, 10, 1), local(2026, 11, 1), local(2026, 10, 2))).toBeCloseTo(12);
  });

  it('buckets hours per Monday-start week', () => {
    const now = local(2026, 10, 30, 12); // a Friday
    const weeks = hoursPerWeek([fast(local(2026, 10, 27, 0), local(2026, 10, 28, 0))], 2, now);
    expect(weeks).toHaveLength(2);
    expect(dayKey(weeks[1]!.weekStart)).toBe('2026-10-26');
    expect(weeks[1]!.hours).toBeCloseTo(24);
    expect(weeks[0]!.hours).toBe(0);
  });

  it('counts streaks of days the person defines, without penalties', () => {
    const now = local(2026, 10, 10, 12);
    const fs = [
      fast(local(2026, 10, 7, 0), local(2026, 10, 7, 18)),
      fast(local(2026, 10, 8, 0), local(2026, 10, 8, 18)),
      fast(local(2026, 10, 9, 0), local(2026, 10, 9, 18)),
      fast(local(2026, 10, 3, 0), local(2026, 10, 3, 10)),
    ];
    expect(streaks(fs, 16, now)).toEqual({ current: 3, longest: 3 });
  });

  it('lists fast lengths with goals', () => {
    const now = local(2026, 10, 30);
    const f = { ...fast(now - 3 * DAY, now - 2 * DAY), goal: { kind: 'duration' as const, ms: 20 * HOUR } };
    expect(fastLengths([f], 30, now)).toEqual([{ id: f.id, start: f.start, hours: 24, goalHours: 20 }]);
  });

  it('computes BMI', () => {
    expect(bmi(70, 1.75)).toBeCloseTo(22.86, 2);
    expect(bmi(70, 0)).toBeNull();
  });
});

describe('startHours and averageHours', () => {
  const a = fast(local(2026, 10, 1, 20), local(2026, 10, 2, 12));
  const b = fast(local(2026, 10, 3, 20), local(2026, 10, 5, 20));
  const running = fast(local(2026, 10, 6, 8), null);
  it('counts starts per local hour', () => {
    const hours = startHours([a, b, running], 0);
    expect(hours[20]).toBe(2);
    expect(hours[8]).toBe(1);
    expect(hours.reduce((x, y) => x + y, 0)).toBe(3);
  });
  it('averages finished fasts only', () => {
    expect(averageHours([a, b, running], 0)).toBeCloseTo((16 + 48) / 2);
    expect(averageHours([running], 0)).toBe(0);
  });
});
