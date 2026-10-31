import type { HeightEntry, WeightEntry } from '../../domain/body';
import type { DailySignal } from '../../domain/signals';

/**
 * Weight and height, plus (only when you turn on body signals) sleep, resting heart rate and HRV,
 * read and never written. Health Connect has no fasting record, so fasts stay in the app and the CSV.
 */
export interface HealthBridge {
  /** Platform name shown in settings: "Apple Health" or "Health Connect". */
  readonly name: string;
  isAvailable(): Promise<boolean>;
  /** Asked when the person first opens the weight chart or turns sync on, never at install. */
  requestAccess(): Promise<boolean>;
  readWeights(since: number): Promise<WeightEntry[]>;
  readLatestHeight(): Promise<HeightEntry | null>;
  writeWeight(kg: number, at: number): Promise<void>;
  writeHeight(m: number, at: number): Promise<void>;
  /** Asked when the person turns body signals on, never before. Read-only. */
  requestSignalsAccess(): Promise<boolean>;
  /** One row per local day since `since`, with whatever of the three signals exists. */
  readSignals(since: number): Promise<DailySignal[]>;
}
