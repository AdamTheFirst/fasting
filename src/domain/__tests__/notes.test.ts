import type { Fast } from '../fast';
import { addNote, noteFromPastYou, noteOffsetLabel, removeNote } from '../notes';
import { DAY, HOUR } from '../time';

const NOW = Date.UTC(2026, 9, 31, 12);
const fast = (over: Partial<Fast>): Fast => ({
  id: 'f',
  start: NOW - 10 * HOUR,
  end: null,
  goal: null,
  presetId: null,
  note: null,
  log: [],
  ...over,
});

describe('notes', () => {
  it('adds trimmed notes in time order and ignores empty ones', () => {
    let f = fast({});
    f = addNote(f, '  later ', NOW);
    f = addNote(f, 'earlier', NOW - HOUR);
    f = addNote(f, '   ', NOW);
    expect(f.log.map((n) => n.text)).toEqual(['earlier', 'later']);
    expect(removeNote(f, f.log[0]!.id).log.map((n) => n.text)).toEqual(['later']);
  });

  it('labels hours, then days past two days', () => {
    expect(noteOffsetLabel(40 * HOUR)).toBe('Hour 40');
    expect(noteOffsetLabel(50 * HOUR + 10)).toBe('Day 3, hour 2');
  });

  it('finds what you wrote at about this hour, preferring the same preset', () => {
    const running = fast({ id: 'r', start: NOW - 40 * HOUR, presetId: 'p72' });
    const old = fast({
      id: 'old',
      start: NOW - 30 * DAY,
      end: NOW - 27 * DAY,
      presetId: 'p72',
      log: [
        { id: 'a', at: NOW - 30 * DAY + 10 * HOUR, text: 'easy' },
        { id: 'b', at: NOW - 30 * DAY + 41 * HOUR, text: 'headache, salt fixed it' },
      ],
    });
    const recentOther = fast({
      id: 'other',
      start: NOW - 10 * DAY,
      end: NOW - 8 * DAY,
      log: [{ id: 'c', at: NOW - 10 * DAY + 39 * HOUR, text: 'other fast' }],
    });
    const past = noteFromPastYou(running, [running, old, recentOther], NOW);
    expect(past?.note.text).toBe('headache, salt fixed it');
    expect(past?.offsetMs).toBe(41 * HOUR);
  });

  it('falls back to any fast, and shows nothing outside the window', () => {
    const running = fast({ id: 'r', start: NOW - 6 * HOUR });
    const old = fast({
      id: 'old',
      start: NOW - 5 * DAY,
      end: NOW - 2 * DAY,
      log: [{ id: 'a', at: NOW - 5 * DAY + 48 * HOUR, text: 'day 3' }],
    });
    expect(noteFromPastYou(running, [old], NOW)).toBeNull();
    expect(noteFromPastYou(running, [old], NOW + 42 * HOUR)?.note.text).toBe('day 3');
  });
});
