import { mondayIndex, presetForToday, toggleWeekday } from '../settings';

// Local dates, so the weekday is right in any time zone.
const MONDAY = new Date(2026, 9, 26, 9).getTime();
const SUNDAY = new Date(2026, 10, 1, 9).getTime();

describe('weekly rhythm', () => {
  it('counts weekdays from Monday', () => {
    expect(mondayIndex(MONDAY)).toBe(0);
    expect(mondayIndex(SUNDAY)).toBe(6);
  });

  it("picks today's preset only if it still exists", () => {
    expect(presetForToday({ 0: 'omad' }, ['omad'], MONDAY)).toBe('omad');
    expect(presetForToday({ 0: 'gone' }, ['omad'], MONDAY)).toBeNull();
    expect(presetForToday({ 0: 'omad' }, ['omad'], SUNDAY)).toBeNull();
  });

  it('assigns, moves and clears a day', () => {
    const a = toggleWeekday({}, 2, 'p1');
    expect(a).toEqual({ 2: 'p1' });
    expect(toggleWeekday(a, 2, 'p2')).toEqual({ 2: 'p2' });
    expect(toggleWeekday(a, 2, 'p1')).toEqual({});
  });
});
