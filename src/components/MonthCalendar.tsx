import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { dayKey } from '../domain/stats';
import { font, inkBorder, radius, space, strong, useColors } from '../theme';
import { Icon } from './Icon';

const GAP = 4;

// Monday first. Built from a known Monday so the labels follow the phone's language.
const WEEKDAYS = Array.from({ length: 7 }, (_, i) =>
  new Date(2026, 0, 5 + i).toLocaleDateString(undefined, { weekday: 'narrow' }),
);

/** Month grid, each day shaded by hours fasted (full at 24 h). A multi-day fast fills every day it touches. */
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
          return (
            <Pressable
              key={key}
              accessibilityLabel={`${key}: ${Math.round(hours)} hours fasted`}
              onPress={() => onPressDay?.(key)}
              style={[
                styles.cell,
                {
                  width: size,
                  height: size,
                  backgroundColor: hours >= 12 ? c.period : hours > 0 ? c.periodSubtle : c.surface2,
                },
                isToday && { borderWidth: inkBorder, borderColor: c.text },
              ]}
            >
              <Text
                style={[
                  font.sm,
                  { color: hours >= 12 ? c.onPeriod : c.text, fontWeight: isToday ? '600' : '400' },
                ]}
              >
                {d}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: space[2], gap: space[2] },
  arrow: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  weekday: { alignItems: 'center', paddingBottom: 2 },
  cell: { borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
