import type { Fast, Goal } from './fast';

/**
 * CSV export and import of every fast. Times are ISO 8601 UTC so the file reads
 * the same in any time zone, and an export followed by an import is lossless.
 */
const HEADER = ['id', 'start_utc', 'end_utc', 'goal_kind', 'goal_value', 'preset_id', 'note'];

function escape(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function fastsToCsv(fasts: readonly Fast[]): string {
  const rows = [...fasts]
    .sort((a, b) => a.start - b.start)
    .map((f) => {
      const goalValue =
        f.goal === null
          ? ''
          : f.goal.kind === 'duration'
            ? String(f.goal.ms)
            : new Date(f.goal.at).toISOString();
      return [
        f.id,
        new Date(f.start).toISOString(),
        f.end === null ? '' : new Date(f.end).toISOString(),
        f.goal?.kind ?? '',
        goalValue,
        f.presetId ?? '',
        f.note ?? '',
      ]
        .map(escape)
        .join(',');
    });
  return [HEADER.join(','), ...rows].join('\n') + '\n';
}

/** Splits CSV text into rows of fields, handling quotes, escaped quotes and newlines in fields. */
function parseRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        quoted = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += c;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((f) => f !== ''));
}

export class CsvImportError extends Error {
  constructor(
    message: string,
    readonly line: number,
  ) {
    super(message);
  }
}

export function csvToFasts(text: string): Fast[] {
  const [header, ...rows] = parseRows(text.replace(/^﻿/, ''));
  if (!header || header.join(',') !== HEADER.join(',')) {
    throw new CsvImportError(`Expected the header "${HEADER.join(',')}".`, 1);
  }
  return rows.map((r, i) => {
    const line = i + 2;
    const [id, start, end, goalKind, goalValue, presetId, note] = r;
    const startMs = Date.parse(start ?? '');
    if (!id || Number.isNaN(startMs)) throw new CsvImportError('Missing id or start time.', line);
    const endMs = end ? Date.parse(end) : null;
    if (endMs !== null && Number.isNaN(endMs)) throw new CsvImportError('Bad end time.', line);
    let goal: Goal | null = null;
    if (goalKind === 'duration') goal = { kind: 'duration', ms: Number(goalValue) };
    else if (goalKind === 'until') goal = { kind: 'until', at: Date.parse(goalValue ?? '') };
    else if (goalKind) throw new CsvImportError(`Unknown goal kind "${goalKind}".`, line);
    return { id, start: startMs, end: endMs, goal, presetId: presetId || null, note: note || null };
  });
}
