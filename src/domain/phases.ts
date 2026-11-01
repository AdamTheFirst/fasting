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

/** The deep phase has no end; on a road it is drawn as 48 hours wide and anything past that sits at the end. */
const DEEP_SPAN = 48;

/**
 * Where `hours` sits on the phase road, 0 to 1. Every phase gets an equal share of the road,
 * so the short early phases stay readable next to the long ones.
 */
export function roadPosition(hours: number): number {
  const h = Math.max(0, hours);
  const i = PHASES.indexOf(phaseAt(h));
  const from = PHASES[i]!.from;
  const to = PHASES[i + 1]?.from ?? from + DEEP_SPAN;
  return (i + Math.min(1, (h - from) / (to - from))) / PHASES.length;
}

/** How full phase `index` is at `hours`, 0 to 1. */
export function phaseFill(index: number, hours: number): number {
  const p = roadPosition(hours) * PHASES.length - index;
  return Math.min(1, Math.max(0, p));
}
