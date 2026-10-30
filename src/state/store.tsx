import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import * as db from '../data/db';
import type { HeightEntry, WeightEntry } from '../domain/body';
import { elapsedMs, type Fast, type Goal, newId, type Preset } from '../domain/fast';
import { planAlerts } from '../domain/milestones';
import { type AppSettings, DEFAULT_SETTINGS } from '../domain/settings';
import { longestFast } from '../domain/stats';
import { syncMilestoneAlerts } from '../services/notifications';

interface Store {
  loaded: boolean;
  fasts: Fast[];
  running: Fast | null;
  presets: Preset[];
  weights: WeightEntry[];
  heights: HeightEntry[];
  settings: AppSettings;
  startFast(goal: Goal | null, presetId?: string | null): Promise<void>;
  endFast(at?: number): Promise<void>;
  saveFast(fast: Fast): Promise<void>;
  deleteFast(id: string): Promise<void>;
  replaceAllFasts(fasts: Fast[]): Promise<void>;
  savePreset(preset: Preset): Promise<void>;
  deletePreset(id: string): Promise<void>;
  addWeight(entry: WeightEntry): Promise<void>;
  addHeight(entry: HeightEntry): Promise<void>;
  updateSettings(patch: Partial<AppSettings>): Promise<void>;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [fasts, setFasts] = useState<Fast[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [heights, setHeights] = useState<HeightEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    void (async () => {
      const [f, p, w, h, s] = await Promise.all([
        db.listFasts(),
        db.listPresets(),
        db.listWeights(),
        db.listHeights(),
        db.getSetting<AppSettings>('app', DEFAULT_SETTINGS),
      ]);
      setFasts(f);
      setPresets(p);
      setWeights(w);
      setHeights(h);
      setSettings({ ...DEFAULT_SETTINGS, ...s });
      setLoaded(true);
    })();
  }, []);

  const running = useMemo(() => fasts.find((f) => f.end === null) ?? null, [fasts]);

  // Any change to the running fast, history or milestone settings reschedules every alert.
  useEffect(() => {
    if (!loaded) return;
    const now = Date.now();
    const previous = longestFast(
      fasts.filter((f) => f.end !== null),
      now,
    );
    const alerts = running
      ? planAlerts(running, settings.milestones, previous ? elapsedMs(previous, now) : 0, now)
      : [];
    void syncMilestoneAlerts(alerts);
  }, [loaded, fasts, running, settings.milestones]);

  const reloadFasts = useCallback(async () => setFasts(await db.listFasts()), []);

  const store = useMemo<Store>(
    () => ({
      loaded,
      fasts,
      running,
      presets,
      weights,
      heights,
      settings,
      async startFast(goal, presetId = null) {
        if (running) return;
        await db.saveFast({ id: newId(), start: Date.now(), end: null, goal, presetId, note: null });
        await reloadFasts();
      },
      async endFast(at = Date.now()) {
        if (!running) return;
        await db.saveFast({ ...running, end: at });
        await reloadFasts();
      },
      async saveFast(fast) {
        await db.saveFast(fast);
        await reloadFasts();
      },
      async deleteFast(id) {
        await db.deleteFast(id);
        await reloadFasts();
      },
      async replaceAllFasts(next) {
        await db.replaceAllFasts(next);
        await reloadFasts();
      },
      async savePreset(preset) {
        await db.savePreset(preset);
        setPresets(await db.listPresets());
      },
      async deletePreset(id) {
        await db.deletePreset(id);
        setPresets(await db.listPresets());
      },
      async addWeight(entry) {
        await db.saveWeight(entry);
        setWeights(await db.listWeights());
      },
      async addHeight(entry) {
        await db.saveHeight(entry);
        setHeights(await db.listHeights());
      },
      async updateSettings(patch) {
        const next = { ...settings, ...patch };
        setSettings(next);
        await db.setSetting('app', next);
      },
    }),
    [loaded, fasts, running, presets, weights, heights, settings, reloadFasts],
  );

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside StoreProvider');
  return store;
}
