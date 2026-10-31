import * as SQLite from 'expo-sqlite';

import type { HeightEntry, WeightEntry } from '../domain/body';
import type { Fast, FastNote, Goal, Preset } from '../domain/fast';

/** Everything lives on the phone. No account, no server. */
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

const MIGRATIONS: string[] = [
  `CREATE TABLE fasts (
     id TEXT PRIMARY KEY NOT NULL,
     start INTEGER NOT NULL,
     end INTEGER,
     goal TEXT,
     preset_id TEXT,
     note TEXT
   );
   CREATE INDEX fasts_start ON fasts (start);
   CREATE TABLE presets (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, goal TEXT);
   CREATE TABLE weights (id TEXT PRIMARY KEY NOT NULL, at INTEGER NOT NULL, kg REAL NOT NULL, source TEXT NOT NULL);
   CREATE TABLE heights (id TEXT PRIMARY KEY NOT NULL, at INTEGER NOT NULL, m REAL NOT NULL, source TEXT NOT NULL);
   CREATE TABLE settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);`,
  `ALTER TABLE fasts ADD COLUMN log TEXT;`,
];

// The first screen fires several queries at once, so share one open-and-migrate promise
// instead of letting each call run the migrations again.
export function getDb(): Promise<SQLite.SQLiteDatabase> {
  dbPromise ??= openAndMigrate().catch((e: unknown) => {
    dbPromise = null;
    throw e;
  });
  return dbPromise;
}

async function openAndMigrate(): Promise<SQLite.SQLiteDatabase> {
  const opened = await SQLite.openDatabaseAsync('fasts.db');
  await opened.execAsync('PRAGMA journal_mode = WAL;');
  const row = await opened.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  for (let v = row?.user_version ?? 0; v < MIGRATIONS.length; v++) {
    await opened.withTransactionAsync(async () => {
      await opened.execAsync(MIGRATIONS[v]!);
      await opened.execAsync(`PRAGMA user_version = ${v + 1}`);
    });
  }
  return opened;
}

interface FastRow {
  id: string;
  start: number;
  end: number | null;
  goal: string | null;
  preset_id: string | null;
  note: string | null;
  log: string | null;
}

const toFast = (r: FastRow): Fast => ({
  id: r.id,
  start: r.start,
  end: r.end,
  goal: r.goal ? (JSON.parse(r.goal) as Goal) : null,
  presetId: r.preset_id,
  note: r.note,
  log: r.log ? (JSON.parse(r.log) as FastNote[]) : [],
});

export async function listFasts(): Promise<Fast[]> {
  const rows = await (await getDb()).getAllAsync<FastRow>('SELECT * FROM fasts ORDER BY start DESC');
  return rows.map(toFast);
}

export async function saveFast(f: Fast): Promise<void> {
  await (
    await getDb()
  ).runAsync(
    'INSERT OR REPLACE INTO fasts (id, start, end, goal, preset_id, note, log) VALUES (?, ?, ?, ?, ?, ?, ?)',
    f.id,
    f.start,
    f.end,
    f.goal ? JSON.stringify(f.goal) : null,
    f.presetId,
    f.note,
    f.log.length ? JSON.stringify(f.log) : null,
  );
}

export async function deleteFast(id: string): Promise<void> {
  await (await getDb()).runAsync('DELETE FROM fasts WHERE id = ?', id);
}

export async function replaceAllFasts(fasts: readonly Fast[]): Promise<void> {
  const d = await getDb();
  await d.withTransactionAsync(async () => {
    await d.runAsync('DELETE FROM fasts');
    for (const f of fasts) await saveFast(f);
  });
}

export async function listPresets(): Promise<Preset[]> {
  const rows = await (
    await getDb()
  ).getAllAsync<{ id: string; name: string; goal: string | null }>('SELECT * FROM presets ORDER BY name');
  return rows.map((r) => ({ id: r.id, name: r.name, goal: r.goal ? (JSON.parse(r.goal) as Goal) : null }));
}

export async function savePreset(p: Preset): Promise<void> {
  await (
    await getDb()
  ).runAsync(
    'INSERT OR REPLACE INTO presets (id, name, goal) VALUES (?, ?, ?)',
    p.id,
    p.name,
    p.goal ? JSON.stringify(p.goal) : null,
  );
}

export async function deletePreset(id: string): Promise<void> {
  await (await getDb()).runAsync('DELETE FROM presets WHERE id = ?', id);
}

export async function listWeights(): Promise<WeightEntry[]> {
  return (await getDb()).getAllAsync<WeightEntry>('SELECT * FROM weights ORDER BY at');
}

export async function saveWeight(w: WeightEntry): Promise<void> {
  await (
    await getDb()
  ).runAsync(
    'INSERT OR REPLACE INTO weights (id, at, kg, source) VALUES (?, ?, ?, ?)',
    w.id,
    w.at,
    w.kg,
    w.source,
  );
}

export async function listHeights(): Promise<HeightEntry[]> {
  return (await getDb()).getAllAsync<HeightEntry>('SELECT * FROM heights ORDER BY at');
}

export async function saveHeight(h: HeightEntry): Promise<void> {
  await (
    await getDb()
  ).runAsync(
    'INSERT OR REPLACE INTO heights (id, at, m, source) VALUES (?, ?, ?, ?)',
    h.id,
    h.at,
    h.m,
    h.source,
  );
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await (
    await getDb()
  ).getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', key);
  return row ? (JSON.parse(row.value) as T) : fallback;
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  await (
    await getDb()
  ).runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', key, JSON.stringify(value));
}

/** Deletes every record and setting on this phone. */
export async function deleteEverything(): Promise<void> {
  const d = await getDb();
  await d.withTransactionAsync(async () => {
    for (const t of ['fasts', 'presets', 'weights', 'heights', 'settings']) {
      await d.runAsync(`DELETE FROM ${t}`);
    }
  });
}
