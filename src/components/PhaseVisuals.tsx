import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import { PHASES, phaseAt, phaseFill, type PhaseKey, roadPosition } from '../domain/phases';
import type { DayDepth } from '../domain/stats';
import { font, medium, phaseColor, radius, space, tabular, useColors } from '../theme';

const ROAD_TICKS = ['0', '12h', '24h', '2d', '3d'];

/**
 * The phase road: the five phases side by side, each an equal share, filled up to `reach`.
 * A line, not a ring, so long fasts read as a road that keeps going. `at` adds an ink marker
 * for where you are now, `goal` a thin notch where the goal sits.
 */
export function PhaseRoad({
  reach,
  at,
  goal,
  ticks = true,
  height = 12,
}: {
  /** Hours filled with colour; null leaves every phase as an empty track. */
  reach: number | null;
  at?: number;
  goal?: number | null;
  ticks?: boolean;
  height?: number;
}) {
  const c = useColors();
  const markerIn = at === undefined ? -1 : PHASES.indexOf(phaseAt(at));
  const goalIn = goal == null ? -1 : PHASES.indexOf(phaseAt(goal));
  const within = (h: number, i: number) =>
    `${Math.round((roadPosition(h) * PHASES.length - i) * 1000) / 10}%` as const;
  return (
    <View
      accessible
      accessibilityLabel={
        reach === null
          ? 'Phases: none reached yet'
          : `Phase road, reaches ${phaseAt(reach).label.toLowerCase()}`
      }
      style={{ gap: space[2] }}
    >
      <View style={[styles.road, { height: height + 10 }]}>
        {PHASES.map((p, i) => {
          const fill = reach === null ? 0 : phaseFill(i, reach);
          return (
            <View key={p.key} style={styles.segmentWrap}>
              <View
                style={[
                  styles.segment,
                  { height, borderRadius: Math.min(radius.xs, height / 2) - 2, backgroundColor: c.surface2 },
                ]}
              >
                {fill > 0 && (
                  <View
                    style={{ width: `${fill * 100}%`, height: '100%', backgroundColor: phaseColor(c, p.key) }}
                  />
                )}
              </View>
              {goalIn === i && goal != null && (
                <View style={[styles.goal, { left: within(goal, i), backgroundColor: c.accentStrong }]} />
              )}
              {markerIn === i && at !== undefined && (
                <View
                  style={[
                    styles.marker,
                    { left: within(at, i), backgroundColor: c.primary, borderColor: c.surface },
                  ]}
                />
              )}
            </View>
          );
        })}
      </View>
      {ticks && (
        <View style={styles.road}>
          {ROAD_TICKS.map((t) => (
            <Text key={t} style={[styles.tick, tabular, { color: c.textMuted }]}>
              {t}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

/**
 * A fast's length as a bar in true hours, coloured by the phases it went through.
 * Bars share `maxHours`, so a list of them compares at a glance.
 */
export function PhaseLengthBar({
  hours,
  maxHours,
  height = 6,
}: {
  hours: number;
  maxHours: number;
  height?: number;
}) {
  const c = useColors();
  const total = Math.max(maxHours, hours, 1);
  return (
    <View style={[styles.lengthTrack, { height, borderRadius: height / 2 }]}>
      {PHASES.map((p, i) => {
        const to = PHASES[i + 1]?.from ?? Infinity;
        const span = Math.max(0, Math.min(hours, to) - p.from);
        if (span <= 0) return null;
        return (
          <View
            key={p.key}
            style={{ width: `${(span / total) * 100}%`, backgroundColor: phaseColor(c, p.key) }}
          />
        );
      })}
    </View>
  );
}

/**
 * Two weeks as bars: height is hours fasted that day, colour is how deep the day went.
 * Days without a fast keep a small stub so the rhythm still reads.
 */
export function DayDepthBars({ days, now }: { days: readonly DayDepth[]; now: number }) {
  const c = useColors();
  const chartH = 64;
  const fasted = days.filter((d) => d.hours > 0).length;
  return (
    <View
      accessible
      accessibilityLabel={`Last ${days.length} days: fasted on ${fasted} of them`}
      style={{ gap: space[2] }}
    >
      <View style={[styles.bars, { height: chartH }]}>
        {days.map((d) => {
          const h = d.hours > 0 ? Math.max(6, (Math.min(d.hours, 24) / 24) * chartH) : 4;
          const isToday = now - d.day < 24 * 3_600_000 && now >= d.day;
          return (
            <View key={d.day} style={styles.barCol}>
              <View
                style={{
                  height: h,
                  borderRadius: 4,
                  backgroundColor: d.hours > 0 ? phaseColor(c, phaseAt(d.depth).key) : c.surface2,
                  borderWidth: isToday && d.hours > 0 ? 1.5 : 0,
                  borderColor: c.text,
                }}
              />
            </View>
          );
        })}
      </View>
      <View style={styles.road}>
        <Text style={[font.xs, { color: c.textMuted, flex: 1 }]}>{days.length / 7} weeks ago</Text>
        <Text style={[font.xs, medium, { color: c.textMuted }]}>Today</Text>
      </View>
    </View>
  );
}

/**
 * A small drawing for each phase on its own colour: a horizon for settling in, a falling step
 * for insulin, stores running low, a rising line for ketones and still water for the deep fast.
 */
export function PhaseArt({ phase, size = 40 }: { phase: PhaseKey; size?: number }) {
  const c = useColors();
  const ink = c.onAccent;
  const p = {
    stroke: ink,
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.md,
        backgroundColor: phaseColor(c, phase),
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24">
        {phase === 'settling' && (
          <>
            <Path d="M7 15a5 5 0 0 1 10 0" {...p} />
            <Line x1="3" y1="15" x2="21" y2="15" {...p} />
            <Line x1="6" y1="19" x2="18" y2="19" {...p} opacity={0.6} />
          </>
        )}
        {phase === 'insulin' && <Path d="M3 6h5v6h5v6h8" {...p} />}
        {phase === 'glycogen' && (
          <>
            <Rect x="3" y="7" width="16" height="10" rx="2.5" {...p} />
            <Line x1="21" y1="10.5" x2="21" y2="13.5" {...p} />
            <Rect x="5.5" y="9.5" width="3" height="5" rx="1" fill={ink} />
          </>
        )}
        {phase === 'ketones' && (
          <>
            <Path d="M3 19c6 0 9-4 11-8s3-6 7-6" {...p} />
            <Circle cx="9" cy="8" r="1.25" fill={ink} />
            <Circle cx="14" cy="17" r="1.25" fill={ink} />
          </>
        )}
        {phase === 'deep' && (
          <>
            <Path d="M3 8c3-2 6 2 9 0s6-2 9 0" {...p} />
            <Path d="M3 13c3-2 6 2 9 0s6-2 9 0" {...p} />
            <Path d="M3 18c3-2 6 2 9 0s6-2 9 0" {...p} opacity={0.6} />
          </>
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  road: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  segmentWrap: { flex: 1, justifyContent: 'center' },
  segment: { overflow: 'hidden', flexDirection: 'row' },
  marker: { position: 'absolute', width: 8, height: 22, marginLeft: -4, borderRadius: 3, borderWidth: 2 },
  goal: { position: 'absolute', width: 3, height: 22, marginLeft: -1.5, borderRadius: 1.5 },
  tick: { flex: 1, fontSize: 11, lineHeight: 14 },
  lengthTrack: { flexDirection: 'row', overflow: 'hidden', gap: 2 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 5 },
  barCol: { flex: 1, justifyContent: 'flex-end' },
});
