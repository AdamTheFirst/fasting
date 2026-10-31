import { type Fast, type FastNote, goalLabel, newId } from './fast';
import { HOUR } from './time';

/** One-tap notes for the running fast. They only fill the text; you can write anything. */
export const QUICK_NOTES = ['Hungry', 'Clear-headed', 'Tired', 'Headache', 'Cold', 'Had electrolytes'];

export function addNote(fast: Fast, text: string, at: number): Fast {
  const trimmed = text.trim();
  if (!trimmed) return fast;
  const log = [...fast.log, { id: newId(), at, text: trimmed }].sort((a, b) => a.at - b.at);
  return { ...fast, log };
}

export function removeNote(fast: Fast, noteId: string): Fast {
  return { ...fast, log: fast.log.filter((n) => n.id !== noteId) };
}

/** "Hour 40", or "Day 3, hour 2" past two days, for where a note sits in its fast. */
export function noteOffsetLabel(offsetMs: number): string {
  const hours = Math.max(0, Math.floor(offsetMs / HOUR));
  if (hours < 48) return `Hour ${hours}`;
  return `Day ${Math.floor(hours / 24) + 1}, hour ${hours % 24}`;
}

export interface PastNote {
  fast: Fast;
  note: FastNote;
  /** How far into that fast the note was written. */
  offsetMs: number;
}

/**
 * What you wrote at about this point of an earlier, similar fast. Prefers a fast with the same
 * preset, then the same goal, then any; most recent first. Only notes within `windowMs` of the
 * running fast's elapsed time count, so hour 6 never shows a note from day 3.
 */
export function noteFromPastYou(
  running: Fast,
  fasts: readonly Fast[],
  now: number,
  windowMs = 4 * HOUR,
): PastNote | null {
  const elapsed = now - running.start;
  const similarity = (f: Fast) => {
    if (running.presetId && f.presetId === running.presetId) return 2;
    if (running.goal && goalLabel(f.goal) === goalLabel(running.goal)) return 1;
    return 0;
  };
  const candidates = fasts
    .filter((f) => f.id !== running.id && f.end !== null && f.start < running.start && f.log.length > 0)
    .sort((a, b) => similarity(b) - similarity(a) || b.start - a.start);
  for (const f of candidates) {
    let best: PastNote | null = null;
    for (const note of f.log) {
      if (note.at < f.start || note.at > f.end!) continue;
      const offsetMs = note.at - f.start;
      const distance = Math.abs(offsetMs - elapsed);
      if (distance > windowMs) continue;
      if (!best || distance < Math.abs(best.offsetMs - elapsed)) best = { fast: f, note, offsetMs };
    }
    if (best) return best;
  }
  return null;
}
