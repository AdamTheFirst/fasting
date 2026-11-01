import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import * as db from '../data/db';
import type { HeightEntry, WeightEntry } from '../domain/body';
import { elapsedMs, type Fast, type Goal, newId, type Preset } from '../domain/fast';
import { planAlerts } from '../domain/milestones';
import { planName } from '../domain/plan';
import { type AppSettings, DEFAULT_SETTINGS } from '../domain/settings';
import { longestFast } from '../domain/stats';
import { syncMilestoneAlerts, syncPlanReminders } from '../services/notifications';
import { checkPlus, listenForPlus } from '../services/purchases';
import { syncWidgets } from '../services/widgets';

interface Store {
  loaded: boolean;
  fasts: Fast[];
  running: Fast | null;
  presets: Preset[];
  weights: WeightEntry[];
  heights: HeightEntry[];
  settings: AppSettings;
  /** Fastaway Plus is unlocked. Only the extras read this; tracking never does. */
  plus: boolean;
  /** The last purchase failure in plain words, cleared on the next try. */
  purchaseError: string | null;
  setPlus(owned: boolean): Promise<void>;
  clearPurchaseError(): void;
  startFast(goal: Goal | null, presetId?: string | null): Promise<void>;
  endFast(at?: number): Promise<void>;
  saveFast(fast: Fast): Promise<void>;
  deleteFast(id: string): Promise<void>;
  replaceAllFasts(fasts: Fast[]): Promise<void>;
  /** Adds fasts from another app without touching the ones you have. */
  addFasts(fasts: readonly Fast[]): Promise<void>;
  /** Deletes every fast, preset, weight and setting on this phone. */
  deleteEverything(): Promise<void>;
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
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

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

  // Plus is written straight to the saved settings, so a purchase that lands while another
  // setting is being saved can't be lost.
  const setPlus = useCallback(async (owned: boolean) => {
    setSettings((s) => {
      if (s.plusOwned === owned) return s;
      const next = { ...s, plusOwned: owned };
      void db.setSetting('app', next);
      return next;
    });
  }, []);

  // A purchase that goes through, now or replayed by the store at launch, unlocks Plus.
  useEffect(() => {
    if (!loaded) return;
    return listenForPlus(
      () => {
        setPurchaseError(null);
        void setPlus(true);
      },
      (message) => setPurchaseError(message),
    );
  }, [loaded, setPlus]);

  // At launch, ask the store once. Only a yes changes anything: an offline phone or a store that
  // can't answer never takes Plus away from someone who bought it.
  useEffect(() => {
    if (!loaded || settings.plusOwned) return;
    void checkPlus().then((owned) => {
      if (owned) void setPlus(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

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

  // Reminders for planned fasts follow the plan list; only plans with "Remind me" on get one.
  useEffect(() => {
    if (!loaded) return;
    void syncPlanReminders(settings.plannedFasts, (p) => planName(p, presets), Date.now());
  }, [loaded, settings.plannedFasts, presets]);

  // The widget and lock screen follow the running fast, its goal and the discreet setting.
  useEffect(() => {
    if (loaded) syncWidgets(running, settings.discreetWidget, settings.plusOwned);
  }, [loaded, running, settings.discreetWidget, settings.plusOwned]);

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
      plus: settings.plusOwned,
      purchaseError,
      setPlus,
      clearPurchaseError: () => setPurchaseError(null),
      async startFast(goal, presetId = null) {
        if (running) return;
        await db.saveFast({ id: newId(), start: Date.now(), end: null, goal, presetId, note: null, log: [] });
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
      async addFasts(added) {
        for (const f of added) await db.saveFast(f);
        await reloadFasts();
      },
      async deleteEverything() {
        await db.deleteEverything();
        setFasts([]);
        setPresets([]);
        setWeights([]);
        setHeights([]);
        // Plus was paid for, not written by you: it stays after everything else is deleted.
        const kept = { ...DEFAULT_SETTINGS, plusOwned: settings.plusOwned };
        setSettings(kept);
        if (kept.plusOwned) await db.setSetting('app', kept);
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
    [loaded, fasts, running, presets, weights, heights, settings, purchaseError, setPlus, reloadFasts],
  );

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside StoreProvider');
  return store;
}
