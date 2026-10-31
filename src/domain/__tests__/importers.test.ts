import { fastsToCsv } from '../csv';
import type { Fast } from '../fast';
import { importFasts, mergeImported, parseHours, parseLooseDate } from '../importers';
import { HOUR } from '../time';

const NOW = new Date(2026, 9, 31, 12).getTime();

describe('importers', () => {
  it('reads loose dates and lengths', () => {
    expect(parseLooseDate('2026-03-01 18:30')).toBe(new Date(2026, 2, 1, 18, 30).getTime());
    expect(parseLooseDate('3/1/2026 6:30 PM')).toBe(new Date(2026, 2, 1, 18, 30).getTime());
    expect(parseLooseDate('18:30', '2026-03-01')).toBe(new Date(2026, 2, 1, 18, 30).getTime());
    expect(parseHours('36:30')).toBe(36.5);
    expect(parseHours('1d 12h')).toBe(36);
    expect(parseHours('16,5')).toBe(16.5);
  });

  it('finds start and end columns by name', () => {
    const csv =
      'Date,Start,End,Hours,Notes\n2026-03-01,20:00,12:00,16,felt fine\n2026-03-05,19:00,,72,\nbad,row,,,\n';
    const r = importFasts(csv, NOW);
    expect(r.source).toBe('other');
    expect(r.skipped).toEqual([4]);
    expect(r.fasts).toHaveLength(2);
    expect(r.fasts[0]!.end! - r.fasts[0]!.start).toBe(16 * HOUR);
    expect(r.fasts[0]!.note).toBe('felt fine');
    expect(r.fasts[1]!.end! - r.fasts[1]!.start).toBe(72 * HOUR);
  });

  it('reads its own export as-is', () => {
    const f: Fast = {
      id: 'x',
      start: NOW - 20 * HOUR,
      end: NOW - 2 * HOUR,
      goal: null,
      presetId: null,
      note: null,
      log: [],
    };
    expect(importFasts(fastsToCsv([f]), NOW)).toEqual({ source: 'fastaway', fasts: [f], skipped: [] });
  });

  it('rejects a file without the columns it needs', () => {
    expect(() => importFasts('a,b\n1,2\n', NOW)).toThrow(/start column/);
  });

  it('skips imported fasts that overlap ones you already have', () => {
    const mine: Fast = {
      id: 'm',
      start: NOW - 30 * HOUR,
      end: NOW - 10 * HOUR,
      goal: null,
      presetId: null,
      note: null,
      log: [],
    };
    const dup = { ...mine, id: 'd', start: mine.start + HOUR };
    const fresh = { ...mine, id: 'n', start: NOW - 60 * HOUR, end: NOW - 40 * HOUR };
    expect(mergeImported([mine], [dup, fresh], NOW)).toEqual({ added: [fresh], duplicates: 1 });
  });
});
