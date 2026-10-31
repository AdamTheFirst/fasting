import type { HealthBridge } from './types';

/** Fallback for platforms without a health store (web, tests). Manual entry still works everywhere. */
export const health: HealthBridge = {
  name: 'Health',
  isAvailable: async () => false,
  requestAccess: async () => false,
  readWeights: async () => [],
  readLatestHeight: async () => null,
  writeWeight: async () => {},
  writeHeight: async () => {},
  requestSignalsAccess: async () => false,
  readSignals: async () => [],
};

export type { HealthBridge };
