import {
  isHealthDataAvailableAsync,
  queryCategorySamples,
  queryQuantitySamples,
  requestAuthorization,
  saveQuantitySample,
} from '@kingstinct/react-native-healthkit';

import { dailyAverage, mergeSignals } from '../../domain/signals';
import { dayKey } from '../../domain/stats';
import { HOUR } from '../../domain/time';
import type { HealthBridge } from './types';

const WEIGHT = 'HKQuantityTypeIdentifierBodyMass' as const;
const HEIGHT = 'HKQuantityTypeIdentifierHeight' as const;
const RESTING_HR = 'HKQuantityTypeIdentifierRestingHeartRate' as const;
const HRV = 'HKQuantityTypeIdentifierHeartRateVariabilitySDNN' as const;
const SLEEP = 'HKCategoryTypeIdentifierSleepAnalysis' as const;
// HKCategoryValueSleepAnalysis: asleep (unspecified), core, deep, REM. In bed (0) and awake (2) don't count.
const ASLEEP = new Set([1, 3, 4, 5]);

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
  requestSignalsAccess: () => requestAuthorization({ toRead: [RESTING_HR, HRV, SLEEP] }),
  async readSignals(since) {
    const filter = { date: { startDate: new Date(since) } };
    const [hr, hrv, sleep] = await Promise.all([
      queryQuantitySamples(RESTING_HR, { limit: 0, unit: 'count/min', ascending: true, filter }),
      queryQuantitySamples(HRV, { limit: 0, unit: 'ms', ascending: true, filter }),
      queryCategorySamples(SLEEP, { limit: 0, ascending: true, filter }),
    ]);
    // Sleep counts toward the day you woke up.
    const sleepByDay = new Map<string, number>();
    for (const s of sleep) {
      if (!ASLEEP.has(Number(s.value))) continue;
      const k = dayKey(s.endDate.getTime());
      sleepByDay.set(k, (sleepByDay.get(k) ?? 0) + (s.endDate.getTime() - s.startDate.getTime()) / HOUR);
    }
    return mergeSignals({
      restingHr: dailyAverage(hr.map((s) => ({ at: s.startDate.getTime(), value: s.quantity }))),
      hrv: dailyAverage(hrv.map((s) => ({ at: s.startDate.getTime(), value: s.quantity }))),
      sleepHours: [...sleepByDay].map(([day, value]) => ({ day, value })),
    });
  },
};
