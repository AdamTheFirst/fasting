import {
  elapsedMs,
  type Fast,
  goalLabel,
  goalReachedAt,
  parseDurationGoal,
  presetFromFast,
  validateFast,
} from '../fast';
import { DAY, HOUR } from '../time';

const NOW = Date.UTC(2026, 9, 30, 12);
const fast = (over: Partial<Fast> = {}): Fast => ({
  id: 'a',
  start: NOW - 10 * HOUR,
  end: null,
  goal: null,
  presetId: null,
  note: null,
  log: [],
  ...over,
});

describe('fast', () => {
  it('derives elapsed from the stored start, with no cap', () => {
    expect(elapsedMs(fast({ start: NOW - 14 * DAY }), NOW)).toBe(14 * DAY);
  });

  it('computes goal time for duration and until goals', () => {
    expect(goalReachedAt(fast({ goal: { kind: 'duration', ms: 24 * HOUR } }))).toBe(NOW + 14 * HOUR);
    expect(goalReachedAt(fast({ goal: { kind: 'until', at: NOW + 5 } }))).toBe(NOW + 5);
    expect(goalReachedAt(fast())).toBeNull();
  });

  it('allows any length, including a 30-day fast', () => {
    expect(validateFast(fast({ start: NOW - 30 * DAY, end: NOW }), [], NOW)).toBeNull();
  });

  it('rejects impossible times and overlaps', () => {
    expect(validateFast(fast({ start: NOW + 1 }), [], NOW)).toBe('start_in_future');
    expect(validateFast(fast({ end: NOW - 11 * HOUR }), [], NOW)).toBe('end_before_start');
    const other = fast({ id: 'b', start: NOW - 20 * HOUR, end: NOW - 9 * HOUR });
    expect(validateFast(fast(), [other], NOW)).toBe('overlaps');
    expect(validateFast(other, [other], NOW)).toBeNull();
  });
});

describe('custom goals and presets', () => {
  it('parses any positive length in hours or days, with no upper limit', () => {
    expect(parseDurationGoal('36', 'hours')).toEqual({ kind: 'duration', ms: 36 * HOUR });
    expect(parseDurationGoal('4,5', 'days')).toEqual({ kind: 'duration', ms: 4.5 * DAY });
    expect(parseDurationGoal('40', 'days')).toEqual({ kind: 'duration', ms: 40 * DAY });
    expect(parseDurationGoal('0', 'hours')).toBeNull();
    expect(parseDurationGoal('abc', 'days')).toBeNull();
  });

  it('labels goals as hours below two days and as days above', () => {
    expect(goalLabel(null)).toBe('Open-ended');
    expect(goalLabel({ kind: 'duration', ms: 20 * HOUR })).toBe('20h');
    expect(goalLabel({ kind: 'duration', ms: 36 * HOUR })).toBe('36h');
    expect(goalLabel({ kind: 'duration', ms: 72 * HOUR })).toBe('3 days');
    expect(goalLabel({ kind: 'until', at: NOW })).toMatch(/^until /);
  });

  it('makes a preset from a finished fast, rounded to the hour', () => {
    const p = presetFromFast({ start: NOW - 71.6 * HOUR, end: NOW }, NOW);
    expect(p.goal).toEqual({ kind: 'duration', ms: 72 * HOUR });
    expect(p.name).toBe('3 days');
    expect(presetFromFast({ start: NOW - 20 * HOUR, end: NOW }, NOW, ' 20:4 ').name).toBe('20:4');
  });
});
