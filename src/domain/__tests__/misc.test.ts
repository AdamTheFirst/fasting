import { parseAction } from '../actions';
import type { Fast } from '../fast';
import { compareSignals, dailyAverage, mergeSignals } from '../signals';
import { DAY, HOUR } from '../time';

const local = (y: number, m: number, d: number, h = 0) => new Date(y, m - 1, d, h).getTime();
const NOW = local(2026, 10, 31, 12);
const fast = (id: string, start: number, end: number | null): Fast => ({
  id,
  start,
  end,
  goal: null,
  presetId: null,
  note: null,
  log: [],
});

describe('link actions', () => {
  it('parses start and end links', () => {
    expect(parseAction('start', {})).toEqual({ kind: 'start', goal: null, presetId: null });
    expect(parseAction('start', { hours: '36' })).toEqual({
      kind: 'start',
      goal: { kind: 'duration', ms: 36 * HOUR },
      presetId: null,
    });
    expect(parseAction('start', { days: '3' })).toMatchObject({ goal: { ms: 72 * HOUR } });
    expect(parseAction('start', { preset: 'p1' })).toMatchObject({ presetId: 'p1' });
    expect(parseAction('end', {})).toEqual({ kind: 'end' });
    expect(parseAction('dance', {})).toEqual({ kind: 'unknown' });
  });
});

describe('body signals', () => {
  it('compares fasting days with other days', () => {
    const fasts = [fast('a', local(2026, 10, 1), local(2026, 10, 2, 23))];
    const signals = mergeSignals({
      restingHr: [
        { day: '2026-10-01', value: 60 },
        { day: '2026-10-02', value: 62 },
        { day: '2026-10-05', value: 55 },
      ],
      sleepHours: dailyAverage([
        { at: local(2026, 10, 1, 7), value: 6 },
        { at: local(2026, 10, 1, 8), value: 8 },
      ]),
    });
    expect(signals[0]).toEqual({ day: '2026-10-01', restingHr: 60, sleepHours: 7 });
    const [hr, , sleep] = compareSignals(signals, fasts, NOW + DAY);
    expect(hr).toMatchObject({ fasting: 61, other: 55, fastingDays: 2, otherDays: 1 });
    expect(sleep).toMatchObject({ fasting: 7, other: null });
  });
});
