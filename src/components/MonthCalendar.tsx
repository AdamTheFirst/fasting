import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { dayKey } from '../domain/stats';
import { font, space, strong, tabular, useColors } from '../theme';
import { Icon } from './Icon';

const GAP = 4;

// Monday first. Built from a known Monday so the labels follow the phone's language.
const WEEKDAYS = Array.from({ length: 7 }, (_, i) =>
  new Date(2026, 0, 5 + i).toLocaleDateString(undefined, { weekday: 'narrow' }),
);

/**
 * Month grid. Each day wears a thin ring that fills with the hours fasted that day, so 12 h is half
 * a ring; a day fasted end to end becomes a solid disc. A multi-day fast reads as a run of discs.
 */
export function MonthCalendar({
  month,
  hoursByDay,
  onPressDay,
  onChangeMonth,
  canGoForward = true,
  now,
}: {
  /** Marks today. */
  now: number;
  month: Date;
  hoursByDay: Map<string, number>;
  onPressDay?: (key: string) => void;
  /** -1 for the previous month, +1 for the next. Arrows are hidden when not given. */
  onChangeMonth?: (delta: -1 | 1) => void;
  canGoForward?: boolean;
}) {
  const c = useColors();
  // Percent widths with aspectRatio leave gaps inside a wrapping row on Android, so size cells from
  // the measured width instead.
  const [width, setWidth] = useState(0);
  const size = width ? Math.floor((width - GAP * 6) / 7) : 0;
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7;
  const cells: (number | null)[] = [
    ...Array(lead).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const todayKey = dayKey(now);
  const title = first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const arrow = (label: string, glyph: string, delta: -1 | 1, enabled: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={!enabled}
      hitSlop={12}
      onPress={() => onChangeMonth?.(delta)}
      style={[styles.arrow, !enabled && { opacity: 0.3 }]}
    >
      <Icon name={glyph === '‹' ? 'chevronLeft' : 'chevron'} size={20} color={c.text} />
    </Pressable>
  );

  return (
    <View>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={[font.lg, { color: c.text, ...strong, flex: 1 }]}>
          {title}
        </Text>
        {onChangeMonth && arrow('Previous month', '‹', -1, true)}
        {onChangeMonth && arrow('Next month', '›', 1, canGoForward)}
      </View>
      <View style={styles.grid} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {WEEKDAYS.map((w, i) => (
          <View key={`w${i}`} style={[styles.weekday, { width: size }]}>
            <Text style={[font.xs, { color: c.textMuted }]}>{w}</Text>
          </View>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <View key={`e${i}`} style={{ width: size, height: size }} />;
          const key = dayKey(new Date(month.getFullYear(), month.getMonth(), d).getTime());
          const hours = hoursByDay.get(key) ?? 0;
          const isToday = key === todayKey;
          const isFuture = key > todayKey;
          const full = hours >= 23.9;
          return (
            <Pressable
              key={key}
              accessibilityRole={onPressDay && hours > 0 ? 'button' : undefined}
              accessibilityLabel={`${new Date(month.getFullYear(), month.getMonth(), d).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}: ${hours > 0 ? `${Math.round(hours)} hours fasted` : 'no fast'}${isToday ? ', today' : ''}`}
              disabled={!onPressDay || hours === 0}
              onPress={() => onPressDay?.(key)}
              style={({ pressed }) => [styles.cell, { width: size, height: size }, pressed && { opacity: 0.6 }]}
            >
              {size > 0 && <DayRing size={size - 6} hours={hours} full={full} />}
              <Text
                style={[
                  font.sm,
                  tabular,
                  {
                    color: full ? c.onAccent : isFuture ? c.textFaint : c.text,
                    fontWeight: isToday || full ? '700' : '500',
                  },
                ]}
              >
                {d}
              </Text>
              {isToday ? (
                <View style={[styles.todayDot, { backgroundColor: full ? c.onAccent : c.primary }]} />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function DayRing({ size, hours, full }: { size: number; hours: number; full: boolean }) {
  const c = useColors();
  const stroke = 3;
  const r = (size - stroke) / 2;
  const mid = size / 2;
  const circ = 2 * Math.PI * r;
  const p = Math.min(1, hours / 24);
  return (
    <Svg width={size} height={size} style={{ position: 'absolute', top: 3, left: 3 }}>
      {full ? (
        <Circle cx={mid} cy={mid} r={size / 2} fill={c.accentStrong} />
      ) : (
        <>
          <Circle cx={mid} cy={mid} r={r} stroke={c.surface2} strokeWidth={stroke} fill="none" />
          {p > 0 && (
            <G rotation={-90} origin={`${mid}, ${mid}`}>
              <Circle
                cx={mid}
                cy={mid}
                r={r}
                stroke={c.accentStrong}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={`${Math.max(circ * p, stroke)} ${circ}`}
                fill="none"
              />
            </G>
          )}
        </>
      )}
    </Svg>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: space[2], gap: space[2] },
  arrow: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  weekday: { alignItems: 'center', paddingBottom: 2 },
  todayDot: { position: 'absolute', bottom: 9, width: 4, height: 4, borderRadius: 2 },
  cell: { alignItems: 'center', justifyContent: 'center' },
});
