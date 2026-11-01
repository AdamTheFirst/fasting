import { useEffect } from 'react';

import { mergeWeights } from '../domain/body';
import { DAY } from '../domain/time';
import { health } from '../services/health';
import { useStore } from './store';

/** On open (with Plus), pulls the last year of weights and the latest height from Health, if the person turned sync on. */
export function useHealthSync(): void {
  const { loaded, plus, settings, weights, heights, addWeight, addHeight } = useStore();
  // Health sync comes with Plus. Weight and height typed in by hand stay free.
  const enabled = loaded && plus && settings.healthSyncEnabled;

  useEffect(() => {
    if (!enabled) return;
    void (async () => {
      try {
        if (!(await health.isAvailable())) return;
        const incoming = await health.readWeights(Date.now() - 365 * DAY);
        const merged = mergeWeights(weights, incoming);
        for (const w of merged.filter((m) => !weights.some((l) => l.id === m.id))) await addWeight(w);
        const height = await health.readLatestHeight();
        if (height && !heights.some((h) => h.id === height.id)) await addHeight(height);
      } catch {
        // Health being unavailable never blocks the app; manual entry still works.
      }
    })();
    // Run once per launch after load, not on every weight change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
}
