import { CsvImportError, csvToFasts, fastsToCsv } from '../csv';
import type { Fast } from '../fast';

const fasts: Fast[] = [
  {
    id: 'a',
    start: Date.UTC(2026, 9, 1, 18),
    end: Date.UTC(2026, 9, 4, 18),
    goal: { kind: 'duration', ms: 259_200_000 },
    presetId: 'p1',
    note: 'felt "great", tired day 2\nslept well',
    log: [{ id: 'n1', at: Date.UTC(2026, 9, 2, 10), text: 'headache, salt helped' }],
  },
  {
    id: 'b',
    start: Date.UTC(2026, 9, 10, 20),
    end: null,
    goal: { kind: 'until', at: Date.UTC(2026, 9, 15, 8) },
    presetId: null,
    note: null,
    log: [],
  },
];

describe('csv', () => {
  it('round-trips export then import losslessly', () => {
    expect(csvToFasts(fastsToCsv(fasts))).toEqual(fasts);
  });

  it('rejects a file with the wrong header', () => {
    expect(() => csvToFasts('foo,bar\n1,2\n')).toThrow(CsvImportError);
  });

  it('reports the line of a bad row', () => {
    const bad = fastsToCsv(fasts).replace('2026-10-10T20:00:00.000Z', 'nope');
    try {
      csvToFasts(bad);
      throw new Error('expected an error');
    } catch (e) {
      expect((e as CsvImportError).line).toBe(3);
    }
  });
});
