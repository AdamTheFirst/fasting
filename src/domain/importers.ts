import { csvToFasts, parseRows } from './csv';
import { type Fast, newId } from './fast';
import { HOUR } from './time';

/**
 * Reads fasts exported from other apps. Rather than trusting one app's exact format (they change),
 * it looks for a start column and an end or length column by name, which covers Zero's export
 * and most hand-made spreadsheets.
 */
export type ImportSource = 'fastaway' | 'other';

export interface ImportResult {
  source: ImportSource;
  fasts: Fast[];
  /** Rows that had no usable start time, by line number. */
  skipped: number[];
}

const norm = (h: string) => h.toLowerCase().replace(/[^a-z]/g, '');

const START = [
  'start',
  'starttime',
  'started',
  'startdate',
  'startdatetime',
  'fastingstart',
  'startutc',
  'from',
  'begin',
];
const END = ['end', 'endtime', 'ended', 'enddate', 'enddatetime', 'fastingend', 'endutc', 'to', 'finish'];
const HOURS = ['hours', 'duration', 'durationhours', 'length', 'fastinghours', 'totalhours', 'elapsedhours'];
const NOTE = ['note', 'notes', 'comment', 'comments', 'mood', 'journal'];
const DATE = ['date', 'day'];

const find = (header: string[], names: string[]) => header.findIndex((h) => names.includes(norm(h)));

/** Parses "2026-03-01 18:30", "2026-03-01T18:30:00Z", "3/1/2026 6:30 PM" and the like. */
export function parseLooseDate(value: string, dateOnly?: string): number | null {
  const v = value.trim();
  if (!v) return null;
  const direct = Date.parse(v.includes(' ') && /^\d{4}-\d{2}-\d{2} /.test(v) ? v.replace(' ', 'T') : v);
  if (!Number.isNaN(direct)) return direct;
  // A bare time next to a separate date column, e.g. Date "2026-03-01", Start "18:30".
  if (dateOnly && /^\d{1,2}:\d{2}/.test(v)) return parseLooseDate(`${dateOnly.trim()} ${v}`);
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:,?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?)?$/i.exec(v);
  if (!us) return null;
  const [, mo, d, y, h = '0', mi = '0', s = '0', ampm] = us;
  let hour = Number(h);
  if (ampm) hour = (hour % 12) + (ampm.toLowerCase() === 'pm' ? 12 : 0);
  const year = Number(y) < 100 ? 2000 + Number(y) : Number(y);
  return new Date(year, Number(mo) - 1, Number(d), hour, Number(mi), Number(s)).getTime();
}

/** "36", "36.5", "36:30" (h:mm) or "1d 12h" into hours. */
export function parseHours(value: string): number | null {
  const v = value.trim();
  const hm = /^(\d+):(\d{2})$/.exec(v);
  if (hm) return Number(hm[1]) + Number(hm[2]) / 60;
  const words = /^(?:(\d+)\s*d)?\s*(?:(\d+(?:\.\d+)?)\s*h)?\s*(?:(\d+)\s*m)?$/i.exec(v);
  if (words && (words[1] || words[2] || words[3])) {
    return Number(words[1] ?? 0) * 24 + Number(words[2] ?? 0) + Number(words[3] ?? 0) / 60;
  }
  const n = Number(v.replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function importFasts(text: string, now: number): ImportResult {
  const clean = text.replace(/^﻿/, '');
  if (/^id,start_utc,end_utc/.test(clean))
    return { source: 'fastaway', fasts: csvToFasts(clean), skipped: [] };
  const [header = [], ...rows] = parseRows(clean);
  const startCol = find(header, START);
  const endCol = find(header, END);
  const hoursCol = find(header, HOURS);
  const noteCol = find(header, NOTE);
  const dateCol = find(header, DATE);
  if (startCol < 0 || (endCol < 0 && hoursCol < 0)) {
    throw new Error('Could not find a start column and an end or length column in this file.');
  }
  const fasts: Fast[] = [];
  const skipped: number[] = [];
  rows.forEach((r, i) => {
    const day = dateCol >= 0 ? r[dateCol] : undefined;
    const start = parseLooseDate(r[startCol] ?? '', day);
    let end = endCol >= 0 ? parseLooseDate(r[endCol] ?? '', day) : null;
    if (end === null && hoursCol >= 0) {
      const h = parseHours(r[hoursCol] ?? '');
      if (h !== null && start !== null) end = start + h * HOUR;
    }
    // An end time before the start on a same-day row usually means the fast crossed midnight.
    if (start !== null && end !== null && end <= start && dateCol >= 0) end += 24 * HOUR;
    if (start === null || (end !== null && (end <= start || end > now))) {
      skipped.push(i + 2);
      return;
    }
    const note = noteCol >= 0 ? (r[noteCol] ?? '').trim() : '';
    fasts.push({ id: newId(), start, end, goal: null, presetId: null, note: note || null, log: [] });
  });
  return { source: 'other', fasts, skipped };
}

/**
 * Adds imported fasts to your history, skipping any that overlap one you already have,
 * so importing the same file twice changes nothing.
 */
export function mergeImported(existing: readonly Fast[], imported: readonly Fast[], now: number) {
  const kept: Fast[] = [];
  const all = [...existing];
  for (const f of imported) {
    const end = f.end ?? now;
    const clash = all.some((o) => o.start < end && (o.end ?? now) > f.start);
    if (clash) continue;
    kept.push(f);
    all.push(f);
  }
  return { added: kept, duplicates: imported.length - kept.length };
}
