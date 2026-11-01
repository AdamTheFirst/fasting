import type { Preset } from '../fast';
import { countdownLabel, newPlan, nextRoundStart, planName, upcomingPlans, weekAhead } from '../plan';
import { DAY, HOUR } from '../time';

// Local dates, so weekdays are right in any time zone. 26 Oct 2026 is a Monday.
const MONDAY_9 = new Date(2026, 9, 26, 9).getTime();
const presets: Preset[] = [{ id: 'p72', name: '72 h monthly', goal: { kind: 'duration', ms: 72 * HOUR } }];

describe('planned fasts', () => {
  it('keeps plans until 12 hours after their start, soonest first', () => {
    const late = newPlan(MONDAY_9 + 2 * DAY, null);
    const soon = newPlan(MONDAY_9 + HOUR, null);
    const stale = newPlan(MONDAY_9 - 13 * HOUR, null);
    const due = newPlan(MONDAY_9 - HOUR, null);
    expect(upcomingPlans([late, stale, soon, due], MONDAY_9).map((p) => p.id)).toEqual([
      due.id,
      soon.id,
      late.id,
    ]);
  });

  it('counts down, then says now', () => {
    const p = newPlan(MONDAY_9 + 2 * DAY + 4 * HOUR, null);
    expect(countdownLabel(p, MONDAY_9)).toBe('in 2d 4h');
    expect(countdownLabel(p, p.at + 1)).toBe('now');
  });

  it('is named after its preset, or its goal once the preset is gone', () => {
    const p = newPlan(MONDAY_9, presets[0]!.goal, 'p72');
    expect(planName(p, presets)).toBe('72 h monthly');
    expect(planName(p, [])).toBe('3 days');
  });

  it('starts new plans at the next 20:00 at least an hour away', () => {
    expect(new Date(nextRoundStart(MONDAY_9)).getDate()).toBe(26);
    const at = nextRoundStart(new Date(2026, 9, 26, 19, 30).getTime());
    expect(new Date(at).getDate()).toBe(27);
    expect(new Date(at).getHours()).toBe(20);
  });

  it('lays out seven days with the rhythm preset and plans of each', () => {
    const fri = newPlan(new Date(2026, 9, 30, 20).getTime(), null, 'p72');
    const week = weekAhead({ 2: 'p72' }, presets, [fri], MONDAY_9);
    expect(week).toHaveLength(7);
    expect(week[0]!.isToday).toBe(true);
    expect(week.map((d) => d.weekday)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(week[2]!.preset?.id).toBe('p72');
    expect(week[4]!.plans).toEqual([fri]);
    expect(week[3]!.plans).toEqual([]);
  });
});
