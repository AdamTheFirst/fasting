import type { Fast } from '../fast';
import { filterEntries, groupByFast, journalEntries, themes } from '../journal';
import { HOUR } from '../time';

const T0 = Date.UTC(2026, 9, 1, 8);
const fast = (id: string, start: number, notes: [number, string][], note: string | null = null): Fast => ({
  id,
  start,
  end: start + 72 * HOUR,
  goal: null,
  presetId: null,
  note,
  log: notes.map(([h, text], i) => ({ id: `${id}${i}`, at: start + h * HOUR, text })),
});

const a = fast(
  'a',
  T0,
  [
    [18, 'Hungry'],
    [40, 'Clear-headed'],
  ],
  'Broke it with soup',
);
const b = fast('b', T0 + 10 * 24 * HOUR, [
  [20, 'hungry'],
  [44, 'Clear-headed'],
  [50, 'Cold'],
]);

describe('journal', () => {
  it('lists every note and whole-fast note, newest first', () => {
    const e = journalEntries([a, b]);
    expect(e).toHaveLength(6);
    expect(e[0]!.text).toBe('Cold');
    const whole = e.find((x) => x.offsetMs === null)!;
    expect(whole.text).toBe('Broke it with soup');
    expect(whole.at).toBe(a.end);
  });

  it('filters by word, ignoring case', () => {
    const e = journalEntries([a, b]);
    expect(filterEntries(e, 'HUNG').map((x) => x.fast.id)).toEqual(['b', 'a']);
    expect(filterEntries(e, '  ')).toHaveLength(6);
  });

  it('counts repeated notes with the middle hour, first spelling kept', () => {
    const t = themes(journalEntries([a, b]));
    expect(t).toEqual([
      { text: 'Clear-headed', count: 2, medianHour: 42 },
      { text: 'Hungry', count: 2, medianHour: 19 },
    ]);
  });

  it('groups by fast, newest fast first, notes in the order written', () => {
    const g = groupByFast(journalEntries([a, b]));
    expect(g.map((x) => x.fast.id)).toEqual(['b', 'a']);
    expect(g[1]!.entries.map((x) => x.text)).toEqual(['Hungry', 'Clear-headed', 'Broke it with soup']);
  });
});
