import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import type { Fast } from '../domain/fast';
import { compareSignals, type DailySignal, SIGNALS } from '../domain/signals';
import { DAY } from '../domain/time';
import { health } from '../services/health';
import { font, space, tabular, useColors } from '../theme';
import { LineChart } from './charts';
import { Card } from './ui';

const DAYS = 90;
const noon = (day: string) => new Date(`${day}T12:00:00`).getTime();

/**
 * Sleep, resting heart rate and HRV from the phone's health store, drawn behind your fasts.
 * Only the numbers: no "recovery" or "stress" labels, and no verdict on what changed.
 */
export function BodySignals({ fasts, now }: { fasts: readonly Fast[]; now: number }) {
  const c = useColors();
  const [signals, setSignals] = useState<DailySignal[] | null>(null);
  const day = Math.floor(now / DAY);
  useEffect(() => {
    let live = true;
    health
      .readSignals(day * DAY - DAYS * DAY)
      .then((s) => live && setSignals(s))
      .catch(() => live && setSignals([]));
    return () => {
      live = false;
    };
  }, [day]);

  if (signals === null) return null;
  const spans = fasts.map((f) => ({ start: f.start, end: f.end ?? now }));
  const compared = compareSignals(signals, fasts, now);
  const fmt = (v: number | null, unit: string) =>
    v === null ? '–' : `${unit === 'h' ? v.toFixed(1) : Math.round(v)} ${unit}`;

  if (signals.length === 0) {
    return (
      <Card>
        <Text style={[font.sm, { color: c.textMuted }]}>
          No sleep, resting heart rate or HRV in {health.name} for the last {DAYS} days.
        </Text>
      </Card>
    );
  }

  return (
    <>
      {SIGNALS.map((s, i) => {
        const points = signals.flatMap((d) =>
          d[s.key] === undefined ? [] : [{ t: noon(d.day), v: d[s.key]! }],
        );
        if (points.length === 0) return null;
        const cmp = compared[i]!;
        return (
          <Card key={s.key}>
            <View style={{ gap: 2 }}>
              <Text accessibilityRole="header" style={[font.lg, { color: c.text, fontWeight: '700' }]}>
                {s.label}
              </Text>
              <Text style={[font.sm, tabular, { color: c.textMuted }]}>
                Fasting days {fmt(cmp.fasting, s.unit)} · other days {fmt(cmp.other, s.unit)}
              </Text>
            </View>
            <LineChart
              points={points}
              format={(v) => (s.unit === 'h' ? v.toFixed(1) : String(Math.round(v)))}
              spans={spans}
              spansLabel="Shaded: when you were fasting"
            />
          </Card>
        );
      })}
      <Text style={[font.xs, { color: c.textMuted, paddingHorizontal: space[1] }]}>
        Last {DAYS} days from {health.name}. A fasting day is one with 16 hours or more fasted. Daily
        averages, shown as they are.
      </Text>
    </>
  );
}
