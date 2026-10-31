import { HOUR } from './time';

export type PhaseKey = 'settling' | 'insulin' | 'glycogen' | 'ketones' | 'deep';

export interface Phase {
  key: PhaseKey;
  /** Hours from the start of the fast when this phase begins. */
  from: number;
  label: string;
}

/**
 * Fasting phases, like the phases of a cycle in a period tracker: each gets its own colour
 * across the app. The edges follow the sourced milestones (12, 24, 48, 72 h); the words
 * stay "likely", and the colours are a way to see where you are, not a measurement.
 */
export const PHASES: readonly Phase[] = [
  { key: 'settling', from: 0, label: 'Settling in' },
  { key: 'insulin', from: 12, label: 'Insulin falling' },
  { key: 'glycogen', from: 24, label: 'Glycogen low' },
  { key: 'ketones', from: 48, label: 'Ketones rising' },
  { key: 'deep', from: 72, label: 'Deep fast' },
];

export function phaseAt(hours: number): Phase {
  let current = PHASES[0]!;
  for (const p of PHASES) if (hours >= p.from) current = p;
  return current;
}

export const phaseAtMs = (ms: number) => phaseAt(ms / HOUR);
