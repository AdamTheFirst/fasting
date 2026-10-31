import type { HeightEntry, WeightEntry } from '../../domain/body';

/** Weight and height only. Health Connect has no fasting record, so fasts stay in the app and the CSV. */
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
}
