import React, { type ReactNode, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Line, Path, Pattern, Rect, Text as SvgText } from 'react-native-svg';

import { font, space, tabular, useColors } from '../theme';

const AXIS_W = 44;
const LABEL_H = 20;

/** 4 even steps that end on a round number, so gridlines read cleanly. */
export function niceMax(max: number, steps = 4): number {
  if (max <= 0) return steps;
  const raw = max / steps;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const nice = [1, 2, 2.5, 3, 4, 5, 6, 8, 10].map((m) => m * mag).find((m) => m >= raw) ?? 10 * mag;
  return nice * steps;
}

/** Hours on an axis: "16h", and whole days once the axis passes 4 days, so a 5-day fast never reads as "120". */
export const hoursTick = (h: number, maxH: number) =>
  maxH > 96 ? `${Math.round((h / 24) * 10) / 10}d` : `${Math.round(h)}h`;

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
  /** Solid (true) or hatched (false), e.g. a fast that ended before its goal. */
  strong?: boolean;
}

/**
 * Periodiary-style bars: a pastel fill with an ink outline, values inside when they fit,
 * and a dashed ink average line. Tap a bar to read it. The axis grows with the
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
  // Past 4 days the axis steps in whole days, so it reads 2d 4d 6d rather than 1.7d 3.3d, with as
  // few gridlines as it takes to clear the tallest bar.
  let steps = 4;
  let max = niceMax(integer ? Math.max(top, 4) : top);
  if (dayAxis && top > 96) {
    const days = Math.ceil(top / 24);
    const step = [1, 2, 3, 5, 7, 10, 14].find((d) => d * 4 >= days) ?? Math.ceil(days / 4);
    steps = Math.ceil(days / step);
    max = steps * step * 24;
  }
  const gridSteps = Array.from({ length: steps + 1 }, (_, i) => i);
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
    <View onLayout={onLayout} style={{ paddingTop: space[2] }}>
      {width > 0 && (
        <View>
          <Svg width={width} height={height + LABEL_H}>
            <Defs>
              <Pattern
                id="barHatch"
                width={7}
                height={7}
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <Line x1={0} y1={0} x2={0} y2={7} stroke={c.hatch} strokeWidth={2} />
              </Pattern>
            </Defs>
            {gridSteps.map((i) => {
              const v = (max / steps) * i;
              return (
                <Line
                  key={i}
                  x1={AXIS_W}
                  x2={width}
                  y1={y(v)}
                  y2={y(v)}
                  stroke={c.border}
                  strokeWidth={1}
                  strokeDasharray={i === 0 ? undefined : '2 4'}
                />
              );
            })}
            {bars.map((b, i) => {
              const h = Math.max(b.value > 0 ? 3 : 0, (b.value / max) * height);
              const x = AXIS_W + slot * i + (slot - barW) / 2;
              const r = Math.min(6, barW / 2, h);
              const soft = b.strong === false;
              const showValue = barW >= 20 && h >= 26;
              return (
                <React.Fragment key={b.key}>
                  <Path
                    d={`M${x} ${height} V${height - h + r} Q${x} ${height - h} ${x + r} ${height - h} H${x + barW - r} Q${x + barW} ${height - h} ${x + barW} ${height - h + r} V${height}`}
                    fill={soft ? 'url(#barHatch)' : c.accentStrong}
                    opacity={selected && selected !== b.key ? 0.4 : 1}
                  />
                  {showValue && (
                    <SvgText
                      x={x + barW / 2}
                      y={height - h + 16}
                      fontSize={12}
                      fontWeight="600"
                      fill={c.text}
                      textAnchor="middle"
                    >
                      {tick(b.value, max)}
                    </SvgText>
                  )}
                </React.Fragment>
              );
            })}
            {average !== undefined && average > 0 && (
              <Line
                x1={AXIS_W}
                x2={width}
                y1={y(average)}
                y2={y(average)}
                stroke={c.text}
                strokeWidth={1.25}
                strokeDasharray="4 4"
                opacity={0.7}
              />
            )}
          </Svg>
          {gridSteps.slice(1).map((i) => (
            <Text
              key={i}
              style={[font.xs, tabular, styles.yLabel, { color: c.textMuted, top: y((max / steps) * i) - 8 }]}
            >
              {tick((max / steps) * i, max)}
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
          {sel ? (
            <View pointerEvents="none" style={[styles.readout, { backgroundColor: c.primary }]}>
              <Text style={[font.xs, tabular, { color: c.onPrimary, fontWeight: '600' }]}>
                {sel.detail ?? `${sel.label}: ${tick(sel.value, max)}`}
              </Text>
            </View>
          ) : null}
        </View>
      )}
      {average !== undefined && average > 0 && averageLabel ? (
        <View style={styles.legend}>
          <View style={[styles.legendDash, { borderColor: c.text }]} />
          <Text style={[font.xs, { color: c.textMuted, flex: 1 }]}>{averageLabel}</Text>
        </View>
      ) : null}
    </View>
  );
}

export interface Point {
  t: number;
  v: number;
}

/**
 * A plain ink line for weight or BMI, with an optional shaded band (the healthy BMI range)
 * and optional time spans shaded behind it (your fasts, so you can see weight move around them).
 */
export function LineChart({
  points,
  height = 150,
  format,
  band,
  bandLabel,
  spans,
  spansLabel,
}: {
  points: readonly Point[];
  height?: number;
  /** Axis label; by default one decimal when the range is narrow, whole numbers otherwise. */
  format?: (v: number) => string;
  band?: { min: number; max: number };
  bandLabel?: string;
  spans?: readonly { start: number; end: number }[];
  spansLabel?: string;
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
  const lastP = points.at(-1);
  const date = (t: number) => new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  // Spans are clipped to the weight range; with a single weight there is no range to shade.
  const shown =
    t1 > t0
      ? (spans ?? [])
          .filter((s) => s.end > t0 && s.start < t1)
          .map((s) => ({ x0: x(Math.max(s.start, t0)), x1: x(Math.min(s.end, t1)) }))
      : [];

  return (
    <View onLayout={onLayout}>
      {width > 0 && points.length > 0 && (
        <View>
          <Svg width={width} height={height + LABEL_H}>
            {band && (
              <Rect
                x={AXIS_W}
                width={width - AXIS_W}
                y={y(band.max)}
                height={y(band.min) - y(band.max)}
                fill={c.accentSubtle}
              />
            )}
            {shown.map((s, i) => (
              <Rect
                key={`s${i}`}
                x={s.x0}
                width={Math.max(1.5, s.x1 - s.x0)}
                y={4}
                height={height - 8}
                rx={2}
                fill={c.accentSubtle}
              />
            ))}
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
            <Path
              d={line}
              stroke={c.text}
              strokeWidth={2.25}
              fill="none"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {points.length <= 40 &&
              points.map((p) => (
                <Circle
                  key={p.t}
                  cx={x(p.t)}
                  cy={y(p.v)}
                  r={3}
                  fill={c.surface}
                  stroke={c.text}
                  strokeWidth={1.5}
                />
              ))}
            {lastP && (
              <Circle
                cx={x(lastP.t)}
                cy={y(lastP.v)}
                r={6}
                fill={c.primary}
                stroke={c.surface}
                strokeWidth={2.5}
              />
            )}
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
          <View
            style={[
              styles.legendBox,
              { backgroundColor: c.accentSubtle, borderColor: c.border, borderWidth: 1 },
            ]}
          />
          <Text style={[font.xs, { color: c.textMuted, flex: 1 }]}>{bandLabel}</Text>
        </View>
      ) : null}
      {shown.length > 0 && spansLabel ? (
        <View style={styles.legend}>
          <View style={[styles.legendBox, { backgroundColor: c.accentSubtle }]} />
          <Text style={[font.xs, { color: c.textMuted, flex: 1 }]}>{spansLabel}</Text>
        </View>
      ) : null}
    </View>
  );
}

/**
 * The last `weeks` weeks as a grid of days, in the same three steps as the calendar.
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
          fill={h >= 12 ? c.accentStrong : h > 0 ? c.accentSubtle : c.surface2}
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
      <View style={[styles.legend, { justifyContent: 'flex-end', gap: space[3] }]}>
        {[
          { fill: c.surface2, label: 'None' },
          { fill: c.accentSubtle, label: 'Under 12h' },
          { fill: c.accentStrong, label: '12h or more' },
        ].map((l) => (
          <View key={l.label} style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: l.fill }]} />
            <Text style={[font.xs, { color: c.textMuted }]}>{l.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  readout: {
    position: 'absolute',
    top: -space[2],
    right: 0,
    borderRadius: 9999,
    paddingHorizontal: space[3],
    paddingVertical: 5,
  },
  yLabel: { position: 'absolute', left: 0, width: AXIS_W - 6 },
  xLabel: { position: 'absolute', width: 60, textAlign: 'center' },
  legend: { flexDirection: 'row', alignItems: 'center', gap: space[2], marginTop: space[2] },
  legendDash: { width: 18, borderTopWidth: 2, borderStyle: 'dashed' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendBox: { width: 12, height: 12, borderRadius: 3 },
});
