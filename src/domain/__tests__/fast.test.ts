import { elapsedMs, type Fast, goalReachedAt, validateFast } from '../fast';
import { DAY, HOUR } from '../time';

const NOW = Date.UTC(2026, 9, 30, 12);
const fast = (over: Partial<Fast> = {}): Fast => ({
  id: 'a',
  start: NOW - 10 * HOUR,
  end: null,
  goal: null,
  presetId: null,
  note: null,
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
