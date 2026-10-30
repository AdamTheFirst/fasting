import { Pressable, StyleSheet, Text, View } from 'react-native';

import { dayKey } from '../domain/stats';
import { font, space, useColors } from '../theme';

/** Month grid, each day shaded by hours fasted (full at 24 h). A multi-day fast fills every day it touches. */
export function MonthCalendar({
  month,
  hoursByDay,
  onPressDay,
}: {
  month: Date;
  hoursByDay: Map<string, number>;
  onPressDay?: (key: string) => void;
}) {
  const c = useColors();
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7;
  const cells: (number | null)[] = [
    ...Array(lead).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <View>
      <Text style={[font.sm, { color: c.text, fontWeight: '600', marginBottom: space[2] }]}>
        {first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
      </Text>
      <View style={styles.grid}>
        {cells.map((d, i) => {
          if (d === null) return <View key={`e${i}`} style={styles.cell} />;
          const key = dayKey(new Date(month.getFullYear(), month.getMonth(), d).getTime());
          const hours = hoursByDay.get(key) ?? 0;
          return (
            <Pressable
              key={key}
              accessibilityLabel={`${key}: ${Math.round(hours)} hours fasted`}
              onPress={() => onPressDay?.(key)}
              style={[
                styles.cell,
                { backgroundColor: c.accent, opacity: hours ? 0.2 + 0.8 * Math.min(1, hours / 24) : 1 },
                !hours && { backgroundColor: c.surface2 },
              ]}
            >
              <Text style={[font.xs, { color: hours > 12 ? c.onAccent : c.text }]}>{d}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  cell: { width: '13%', aspectRatio: 1, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
});
