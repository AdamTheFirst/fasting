import {
  getSdkStatus,
  initialize,
  insertRecords,
  readRecords,
  requestPermission,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';

import type { HealthBridge } from './types';

const PERMISSIONS = [
  { accessType: 'read', recordType: 'Weight' },
  { accessType: 'write', recordType: 'Weight' },
  { accessType: 'read', recordType: 'Height' },
  { accessType: 'write', recordType: 'Height' },
] as const;

let ready: Promise<boolean> | null = null;
const ensureInitialized = () => (ready ??= initialize());

const now = () => new Date().toISOString();

export const health: HealthBridge = {
  name: 'Health Connect',
  async isAvailable() {
    return (await getSdkStatus()) === SdkAvailabilityStatus.SDK_AVAILABLE;
  },
  async requestAccess() {
    if (!(await ensureInitialized())) return false;
    const granted = await requestPermission([...PERMISSIONS]);
    return PERMISSIONS.every((p) =>
      granted.some(
        (g) => 'recordType' in g && g.recordType === p.recordType && g.accessType === p.accessType,
      ),
    );
  },
  async readWeights(since) {
    await ensureInitialized();
    const { records } = await readRecords('Weight', {
      timeRangeFilter: { operator: 'between', startTime: new Date(since).toISOString(), endTime: now() },
      ascendingOrder: true,
    });
    return records.map((r) => ({
      id: `hc-${r.metadata?.id ?? r.time}`,
      at: Date.parse(r.time),
      kg: r.weight.inKilograms,
      source: 'health' as const,
    }));
  },
  async readLatestHeight() {
    await ensureInitialized();
    const { records } = await readRecords('Height', {
      timeRangeFilter: { operator: 'between', startTime: new Date(0).toISOString(), endTime: now() },
      ascendingOrder: false,
      pageSize: 1,
    });
    const r = records[0];
    return r
      ? {
          id: `hc-${r.metadata?.id ?? r.time}`,
          at: Date.parse(r.time),
          m: r.height.inMeters,
          source: 'health',
        }
      : null;
  },
  async writeWeight(kg, at) {
    await ensureInitialized();
    await insertRecords([
      { recordType: 'Weight', weight: { value: kg, unit: 'kilograms' }, time: new Date(at).toISOString() },
    ]);
  },
  async writeHeight(m, at) {
    await ensureInitialized();
    await insertRecords([
      { recordType: 'Height', height: { value: m, unit: 'meters' }, time: new Date(at).toISOString() },
    ]);
  },
};
