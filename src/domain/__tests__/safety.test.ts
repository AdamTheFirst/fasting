import type { Fast } from '../fast';
import { shouldShowSafetyCard } from '../safety';
import { HOUR } from '../time';

const NOW = Date.UTC(2026, 9, 30, 12);
const f = (over: Partial<Fast>): Fast => ({
  id: 'f',
  start: NOW - 10 * HOUR,
  end: null,
  goal: null,
  presetId: null,
  note: null,
  log: [],
  ...over,
});
const on = { disabled: false, dismissedFastIds: [] };

describe('shouldShowSafetyCard', () => {
  it('shows past 72 h, or when the goal is 72 h or more', () => {
    expect(shouldShowSafetyCard(f({}), NOW, on)).toBe(false);
    expect(shouldShowSafetyCard(f({ start: NOW - 72 * HOUR }), NOW, on)).toBe(true);
    expect(shouldShowSafetyCard(f({ goal: { kind: 'duration', ms: 96 * HOUR } }), NOW, on)).toBe(true);
  });

  it('shows once per fast and can be turned off', () => {
    const long = f({ start: NOW - 80 * HOUR });
    expect(shouldShowSafetyCard(long, NOW, { disabled: false, dismissedFastIds: ['f'] })).toBe(false);
    expect(shouldShowSafetyCard(long, NOW, { disabled: true, dismissedFastIds: [] })).toBe(false);
    expect(shouldShowSafetyCard({ ...long, end: NOW }, NOW, on)).toBe(false);
  });
});
