import type { Fast } from './fast';
import { HOUR } from './time';

/** One line in the Journal: a note written during a fast, or the note kept on a whole fast. */
export interface JournalEntry {
  key: string;
  fast: Fast;
  text: string;
  at: number;
  /** How far into the fast it was written; null for the note on the whole fast. */
  offsetMs: number | null;
}

/** Every note from every fast, newest first. */
export function journalEntries(fasts: readonly Fast[]): JournalEntry[] {
  const out: JournalEntry[] = [];
  for (const f of fasts) {
    for (const n of f.log) {
      out.push({
        key: `${f.id}:${n.id}`,
        fast: f,
        text: n.text,
        at: n.at,
        offsetMs: Math.max(0, n.at - f.start),
      });
    }
    const note = f.note?.trim();
    if (note) out.push({ key: `${f.id}:note`, fast: f, text: note, at: f.end ?? f.start, offsetMs: null });
  }
  return out.sort((a, b) => b.at - a.at);
}

const norm = (s: string) => s.trim().toLowerCase();

/** Entries whose text contains `word`, ignoring case. An empty word keeps everything. */
export function filterEntries(entries: readonly JournalEntry[], word: string): JournalEntry[] {
  const w = norm(word);
  return w ? entries.filter((e) => norm(e.text).includes(w)) : [...entries];
}

export interface Theme {
  /** As you first wrote it. */
  text: string;
  count: number;
  /** The middle hour at which you wrote it, across fasts. Null if it was only ever a whole-fast note. */
  medianHour: number | null;
}

/**
 * Notes you wrote more than once, most often first. Same words in any case count together, so
 * tapping "Hungry" twice in two fasts gives one theme with a count of 2. Numbers only, no verdicts.
 */
export function themes(entries: readonly JournalEntry[], min = 2, limit = 8): Theme[] {
  const groups = new Map<string, { text: string; hours: number[]; count: number }>();
  // Oldest first, so the label is the spelling you used first.
  for (const e of [...entries].reverse()) {
    const k = norm(e.text);
    const g = groups.get(k) ?? { text: e.text.trim(), hours: [], count: 0 };
    g.count += 1;
    if (e.offsetMs !== null) g.hours.push(e.offsetMs / HOUR);
    groups.set(k, g);
  }
  return [...groups.values()]
    .filter((g) => g.count >= min)
    .map((g) => ({ text: g.text, count: g.count, medianHour: median(g.hours) }))
    .sort((a, b) => b.count - a.count || a.text.localeCompare(b.text))
    .slice(0, limit);
}

function median(xs: number[]): number | null {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return Math.round(s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2);
}

/** Entries grouped by fast, keeping newest-first order: one card per fast in the Journal. */
export function groupByFast(entries: readonly JournalEntry[]): { fast: Fast; entries: JournalEntry[] }[] {
  const order: string[] = [];
  const map = new Map<string, { fast: Fast; entries: JournalEntry[] }>();
  for (const e of entries) {
    let g = map.get(e.fast.id);
    if (!g) {
      g = { fast: e.fast, entries: [] };
      map.set(e.fast.id, g);
      order.push(e.fast.id);
    }
    g.entries.push(e);
  }
  // Within a fast, read it in the order it happened.
  return order.map((id) => {
    const g = map.get(id)!;
    return { fast: g.fast, entries: [...g.entries].sort((a, b) => a.at - b.at) };
  });
}
