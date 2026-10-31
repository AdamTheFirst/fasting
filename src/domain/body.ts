export type MeasureSource = 'manual' | 'health';

export interface WeightEntry {
  id: string;
  at: number;
  kg: number;
  source: MeasureSource;
}

export interface HeightEntry {
  id: string;
  at: number;
  m: number;
  source: MeasureSource;
}

/**
 * Merges weights from Health into the local list. A Health sample within a minute
 * of an existing entry with the same value is the same reading, so it is not
 * added twice (this is the "clashes with manual entries" complaint about other apps).
 */
export function mergeWeights(local: readonly WeightEntry[], incoming: readonly WeightEntry[]): WeightEntry[] {
  const out = [...local];
  for (const w of incoming) {
    const dup = out.some((l) => Math.abs(l.at - w.at) < 60_000 && Math.abs(l.kg - w.kg) < 0.05);
    if (!dup) out.push(w);
  }
  return out.sort((a, b) => a.at - b.at);
}
