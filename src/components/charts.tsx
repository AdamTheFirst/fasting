import { type ReactNode, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { font, space, tabular, useColors } from '../theme';

const AXIS_W = 38;
const LABEL_H = 20;

/** 4 even steps that end on a round number, so gridlines read cleanly. */
export function niceMax(max: number, steps = 4): number {
  if (max <= 0) return steps;
  const raw = max / steps;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const nice = [1, 2, 2.5, 3, 4, 5, 6, 8, 10].map((m) => m * mag).find((m) => m >= raw) ?? 10 * mag;
  return nice * steps;
}

/** Hours on an axis: "16h", and days past 48 h ("3d"), so a 5-day fast never reads as "120". */
export const hoursTick = (h: number, maxH: number) =>
  maxH > 48 ? `${Math.round((h / 24) * 10) / 10}d` : `${Math.round(h)}h`;

function useWidth() {
  const [width, setWidth] = useState(0);
  return [
    width,
    (e: { nativeEvent: { layout: { width: number } } }) => setWidth(e.nativeEvent.layout.width),
  ] as const;
}

export interface Bar {
  key: string;
  value: number;
  label?: string;
  /** Shown above the chart when the bar is tapped. */
  detail?: string;
  /** Full colour (true) or soft (false). */
  strong?: boolean;
}

/**
 * Bars on soft dashed gridlines. Tap a bar to read it. The axis grows with the
 * tallest bar, so a 120 h fast never clips.
 */
export function BarChart({
  bars,
  height = 160,
  tick,
  average,
  averageLabel,
  maxBarWidth = 26,
  emptyText = 'Nothing in this range yet.',
  dayAxis = false,
  integer = false,
}: {
  /** Counts: keep every axis step a whole number. */
  integer?: boolean;
  /** Values are hours: snap the axis to whole days once it passes 48 h. */
  dayAxis?: boolean;
  bars: readonly Bar[];
  height?: number;
  tick: (v: number, max: number) => string;
  average?: number;
  averageLabel?: string;
  maxBarWidth?: number;
  emptyText?: string;
}) {
  const c = useColors();
  const [width, onLayout] = useWidth();
  const [selected, setSelected] = useState<string | null>(null);
  const top = Math.max(...bars.map((b) => b.value), average ?? 0, 1);
  // Past 48 h the axis steps in whole days, so it reads 1d 2d 3d 4d rather than 0.8d 1.7d.
  const max = dayAxis && top > 48 ? Math.ceil(top / 96) * 96 : niceMax(integer ? Math.max(top, 4) : top);
  const plotW = Math.max(0, width - AXIS_W);
  const slot = bars.length ? plotW / bars.length : 0;
  const barW = Math.max(3, Math.min(maxBarWidth, slot * 0.62));
  const y = (v: number) => height - (v / max) * height;
  const sel = bars.find((b) => b.key === selected);
  const labelEvery = Math.max(1, Math.ceil(bars.length / 6));
  // Several fasts can start on the same day; label that day once.
  const shownLabels = new Set<number>();
  let lastLabel: string | undefined;
  bars.forEach((b, i) => {
    if (b.label && i % labelEvery === 0 && b.label !== lastLabel) {
      shownLabels.add(i);
      lastLabel = b.label;
    }
  });

  if (bars.length === 0)
    return (
      <Text style={[font.sm, { color: c.textMuted, paddingVertical: space[6], textAlign: 'center' }]}>
        {emptyText}
      </Text>
    );

  return (
    <View onLayout={onLayout}>
      <View style={styles.readout}>
        <Text
          style={[font.sm, tabular, { color: sel ? c.text : c.textMuted, fontWeight: sel ? '600' : '400' }]}
        >
          {sel ? (sel.detail ?? `${sel.label}: ${tick(sel.value, max)}`) : 'Tap a bar to read it'}
        </Text>
      </View>
      {width > 0 && (
        <View>
          <Svg width={width} height={height + LABEL_H}>
            {[0, 1, 2, 3, 4].map((i) => {
              const v = (max / 4) * i;
              return (
                <Line
                  key={i}
                  x1={AXIS_W}
                  x2={width}
                  y1={y(v)}
                  y2={y(v)}
                  stroke={c.border}
                  strokeWidth={1}
                  strokeDasharray={i === 0 ? undefined : '3 5'}
                />
              );
            })}
            {bars.map((b, i) => {
              const h = Math.max(b.value > 0 ? 3 : 0, (b.value / max) * height);
              const x = AXIS_W + slot * i + (slot - barW) / 2;
              const r = Math.min(6, barW / 2, h);
              const fill = b.strong === false ? c.accentSoft : c.accent;
              return (
                <Path
                  key={b.key}
                  d={`M${x} ${height} V${height - h + r} Q${x} ${height - h} ${x + r} ${height - h} H${x + barW - r} Q${x + barW} ${height - h} ${x + barW} ${height - h + r} V${height} Z`}
                  fill={fill}
                  opacity={selected && selected !== b.key ? 0.45 : 1}
                />
              );
            })}
            {average !== undefined && average > 0 && (
              <Line
                x1={AXIS_W}
                x2={width}
                y1={y(average)}
                y2={y(average)}
                stroke={c.milestone}
                strokeWidth={1.5}
                strokeDasharray="6 4"
              />
            )}
          </Svg>
          {[1, 2, 3, 4].map((i) => (
            <Text
              key={i}
              style={[font.xs, tabular, styles.yLabel, { color: c.textMuted, top: y((max / 4) * i) - 8 }]}
            >
              {tick((max / 4) * i, max)}
            </Text>
          ))}
          {bars.map((b, i) =>
            shownLabels.has(i) ? (
              <Text
                key={b.key}
                numberOfLines={1}
                style={[
                  font.xs,
                  styles.xLabel,
                  { color: c.textMuted, left: AXIS_W + slot * i + slot / 2 - 30, top: height + 3 },
                ]}
              >
                {b.label}
              </Text>
            ) : null,
          )}
          <View style={[StyleSheet.absoluteFill, { left: AXIS_W, flexDirection: 'row', bottom: LABEL_H }]}>
            {bars.map((b) => (
              <Pressable
                key={b.key}
                accessibilityRole="button"
                accessibilityLabel={b.detail ?? `${b.label}: ${tick(b.value, max)}`}
                onPress={() => setSelected(selected === b.key ? null : b.key)}
                style={{ width: slot, height: '100%' }}
              />
            ))}
          </View>
        </View>
      )}
      {average !== undefined && average > 0 && averageLabel ? (
        <View style={styles.legend}>
          <View style={[styles.legendDash, { backgroundColor: c.milestone }]} />
          <Text style={[font.xs, { color: c.textMuted }]}>{averageLabel}</Text>
        </View>
      ) : null}
    </View>
  );
}

export interface Point {
  t: number;
  v: number;
}

/** A soft area line for weight or BMI, with an optional shaded band (the healthy BMI range). */
export function LineChart({
  points,
  height = 150,
  format,
  band,
  bandLabel,
}: {
  points: readonly Point[];
  height?: number;
  /** Axis label; by default one decimal when the range is narrow, whole numbers otherwise. */
  format?: (v: number) => string;
  band?: { min: number; max: number };
  bandLabel?: string;
}) {
  const c = useColors();
  const [width, onLayout] = useWidth();
  const vs = points.map((p) => p.v);
  const lo0 = Math.min(...vs, band ? band.min : Infinity);
  const hi0 = Math.max(...vs, band ? band.max : -Infinity);
  const pad = Math.max(0.5, (hi0 - lo0) * 0.15);
  const lo = lo0 - pad;
  const hi = hi0 + pad;
  const label = format ?? ((v: number) => v.toFixed(hi - lo < 6 ? 1 : 0));
  const t0 = points[0]?.t ?? 0;
  const t1 = points.at(-1)?.t ?? 1;
  const plotW = Math.max(0, width - AXIS_W - 8);
  const x = (t: number) => AXIS_W + (t1 === t0 ? plotW / 2 : ((t - t0) / (t1 - t0)) * plotW);
  const y = (v: number) => 8 + (height - 16) * (1 - (v - lo) / (hi - lo));
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.t)} ${y(p.v)}`).join(' ');
  const area = points.length > 1 ? `${line} L${x(t1)} ${height} L${x(t0)} ${height} Z` : '';
  const lastP = points.at(-1);
  const date = (t: number) => new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

  return (
    <View onLayout={onLayout}>
      {width > 0 && points.length > 0 && (
        <View>
          <Svg width={width} height={height + LABEL_H}>
            <Defs>
              <LinearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={c.accent} stopOpacity={0.28} />
                <Stop offset="1" stopColor={c.accent} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            {band && (
              <Rect
                x={AXIS_W}
                width={width - AXIS_W}
                y={y(band.max)}
                height={y(band.min) - y(band.max)}
                fill={c.success}
                opacity={0.12}
              />
            )}
            {[0, 1, 2].map((i) => (
              <Line
                key={i}
                x1={AXIS_W}
                x2={width}
                y1={8 + ((height - 16) / 2) * i}
                y2={8 + ((height - 16) / 2) * i}
                stroke={c.border}
                strokeDasharray="3 5"
              />
            ))}
            {area ? <Path d={area} fill="url(#area)" /> : null}
            <Path d={line} stroke={c.accent} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
            {points.length <= 40 &&
              points.map((p) => (
                <Circle
                  key={p.t}
                  cx={x(p.t)}
                  cy={y(p.v)}
                  r={3}
                  fill={c.surface}
                  stroke={c.accent}
                  strokeWidth={2}
                />
              ))}
            {lastP && <Circle cx={x(lastP.t)} cy={y(lastP.v)} r={5.5} fill={c.accent} />}
          </Svg>
          {[0, 1, 2].map((i) => {
            const v = hi - ((hi - lo) / 2) * i;
            return (
              <Text key={i} style={[font.xs, tabular, styles.yLabel, { color: c.textMuted, top: y(v) - 8 }]}>
                {label(v)}
              </Text>
            );
          })}
          <Text
            style={[font.xs, { color: c.textMuted, position: 'absolute', left: AXIS_W, top: height + 3 }]}
          >
            {date(t0)}
          </Text>
          {t1 !== t0 && (
            <Text style={[font.xs, { color: c.textMuted, position: 'absolute', right: 0, top: height + 3 }]}>
              {date(t1)}
            </Text>
          )}
        </View>
      )}
      {band && bandLabel ? (
        <View style={styles.legend}>
          <View style={[styles.legendBox, { backgroundColor: c.success, opacity: 0.35 }]} />
          <Text style={[font.xs, { color: c.textMuted }]}>{bandLabel}</Text>
        </View>
      ) : null}
    </View>
  );
}

/**
 * The last `weeks` weeks as a grid of days, darker the longer you fasted.
 * Days, not rings: the shape of your rhythm at a glance.
 */
export function DayGrid({
  hoursByDay,
  weeks = 26,
  now,
}: {
  hoursByDay: Map<string, number>;
  weeks?: number;
  now: number;
}) {
  const c = useColors();
  const [width, onLayout] = useWidth();
  const gap = 3;
  const cell = width ? (width - gap * (weeks - 1)) / weeks : 0;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const mondayOffset = (today.getDay() + 6) % 7;
  const firstMonday = new Date(today);
  firstMonday.setDate(today.getDate() - mondayOffset - (weeks - 1) * 7);
  const key = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const cells: ReactNode[] = [];
  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < 7; d++) {
      const day = new Date(firstMonday);
      day.setDate(firstMonday.getDate() + w * 7 + d);
      if (day > today) continue;
      const h = hoursByDay.get(key(day)) ?? 0;
      cells.push(
        <Rect
          key={`${w}-${d}`}
          x={w * (cell + gap)}
          y={d * (cell + gap)}
          width={cell}
          height={cell}
          rx={Math.min(3, cell / 3)}
          fill={h > 0 ? c.accent : c.border}
          opacity={h > 0 ? 0.25 + 0.75 * Math.min(1, h / 24) : 1}
        />,
      );
    }
  }
  return (
    <View onLayout={onLayout} accessibilityLabel={`Fasting days over the last ${weeks} weeks`}>
      {width > 0 && (
        <Svg width={width} height={7 * cell + 6 * gap}>
          {cells}
        </Svg>
      )}
      <View style={[styles.legend, { justifyContent: 'flex-end' }]}>
        <Text style={[font.xs, { color: c.textMuted }]}>0h</Text>
        {[0, 0.33, 0.66, 1].map((o) => (
          <View
            key={o}
            style={[
              styles.legendBox,
              { backgroundColor: o ? c.accent : c.border, opacity: o ? 0.25 + 0.75 * o : 1 },
            ]}
          />
        ))}
        <Text style={[font.xs, { color: c.textMuted }]}>24h</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  readout: { minHeight: 22, marginBottom: space[2] },
  yLabel: { position: 'absolute', left: 0, width: AXIS_W - 6 },
  xLabel: { position: 'absolute', width: 60, textAlign: 'center' },
  legend: { flexDirection: 'row', alignItems: 'center', gap: space[2], marginTop: space[2] },
  legendDash: { width: 16, height: 2, borderRadius: 1 },
  legendBox: { width: 10, height: 10, borderRadius: 2 },
});
