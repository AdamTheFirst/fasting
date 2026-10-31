import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import { parseAction } from '../../domain/actions';
import { useStore } from '../../state/store';

/**
 * Handles fastaway://action/start and fastaway://action/end from Shortcuts, Siri, Back Tap,
 * the Action Button, NFC tags or app-icon quick actions, then shows the Fast screen.
 * Starting while a fast runs, or ending with none running, does nothing.
 */
export default function LinkAction() {
  const { verb, ...params } = useLocalSearchParams<{
    verb: string;
    hours?: string;
    days?: string;
    preset?: string;
  }>();
  const { loaded, running, presets, startFast, endFast } = useStore();
  const [done, setDone] = useState(false);
  const ran = useRef(false);

  useEffect(() => {
    if (!loaded || ran.current) return;
    ran.current = true;
    const action = parseAction(verb, params);
    void (async () => {
      if (action.kind === 'start' && !running) {
        const preset = action.presetId ? presets.find((p) => p.id === action.presetId) : undefined;
        await startFast(preset ? preset.goal : action.goal, preset?.id ?? null);
      } else if (action.kind === 'end' && running) {
        await endFast();
      }
      setDone(true);
    })();
  }, [loaded, verb, params, running, presets, startFast, endFast]);

  return done ? <Redirect href="/" /> : null;
}
