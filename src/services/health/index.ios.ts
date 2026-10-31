import {
  isHealthDataAvailableAsync,
  queryQuantitySamples,
  requestAuthorization,
  saveQuantitySample,
} from '@kingstinct/react-native-healthkit';

import type { HealthBridge } from './types';

const WEIGHT = 'HKQuantityTypeIdentifierBodyMass' as const;
const HEIGHT = 'HKQuantityTypeIdentifierHeight' as const;

export const health: HealthBridge = {
  name: 'Apple Health',
  isAvailable: () => isHealthDataAvailableAsync(),
  requestAccess: () => requestAuthorization({ toRead: [WEIGHT, HEIGHT], toShare: [WEIGHT, HEIGHT] }),
  async readWeights(since) {
    const samples = await queryQuantitySamples(WEIGHT, {
      limit: 0,
      unit: 'kg',
      ascending: true,
      filter: { date: { startDate: new Date(since) } },
    });
    return samples.map((s) => ({
      id: `hk-${s.uuid}`,
      at: s.startDate.getTime(),
      kg: s.quantity,
      source: 'health' as const,
    }));
  },
  async readLatestHeight() {
    const [latest] = await queryQuantitySamples(HEIGHT, { limit: 1, unit: 'm', ascending: false });
    return latest
      ? { id: `hk-${latest.uuid}`, at: latest.startDate.getTime(), m: latest.quantity, source: 'health' }
      : null;
  },
  async writeWeight(kg, at) {
    await saveQuantitySample(WEIGHT, 'kg', kg, new Date(at), new Date(at));
  },
  async writeHeight(m, at) {
    await saveQuantitySample(HEIGHT, 'm', m, new Date(at), new Date(at));
  },
};
