import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import type { TimelineMark } from '../domain/milestones';
import { phaseAt } from '../domain/phases';
import { formatShort, HOUR } from '../domain/time';
import { font, medium, phaseColor, radius, space, tabular, useColors } from '../theme';

/** "12h", "2d", "3d 4h": days once past 48 h, so a previous best of 72.2 h reads "3d". */
const hoursLabel = (h: number) => {
  if (h < 48) return `${Math.round(h * 10) / 10}h`;
  const whole = Math.round(h);
  const d = Math.floor(whole / 24);
  const rest = whole % 24;
  return rest ? `${d}d ${rest}h` : `${d}d`;
};

/**
 * Every point along the fast as one tidy row, coloured by its phase.
 * Tap a row to read what is likely happening and its source.
 */
export function MilestoneList({
  marks,
  elapsedHours,
  start,
}: {
  marks: readonly TimelineMark[];
  elapsedHours: number;
  start: number;
}) {
  const c = useColors();
  const nextKey = marks.find((m) => !m.passed)?.key;
  const [open, setOpen] = useState<string | null>(null);
  return (
    <View>
      {marks.map((m, i) => {
        const isNext = m.key === nextKey;
        const isOpen = open === m.key;
        const dot =
          m.kind === 'goal'
            ? c.accent
            : m.kind === 'best'
              ? c.periodSubtle
              : phaseColor(c, phaseAt(m.hours).key);
        const when = m.passed ? 'Done' : `in ${formatShort((m.hours - elapsedHours) * HOUR)}`;
        const at = new Date(start + m.hours * HOUR).toLocaleString(undefined, {
          weekday: 'short',
          hour: 'numeric',
          minute: '2-digit',
        });
        return (
          <Pressable
            key={m.key}
            accessibilityRole="button"
            accessibilityState={{ expanded: isOpen }}
            accessibilityLabel={`${m.title}, ${hoursLabel(m.hours)}, ${m.passed ? 'done' : when}`}
            onPress={() => setOpen(isOpen ? null : m.key)}
            style={[
              styles.row,
              i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
            ]}
          >
            <View style={styles.head}>
              <View
                style={[
                  styles.cell,
                  { backgroundColor: m.passed ? c.accentStrong : c.surface2 },
                  isNext && { backgroundColor: c.primary },
                ]}
              >
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={[
                    font.xs,
                    medium,
                    tabular,
                    { color: isNext ? c.onPrimary : m.passed ? c.onAccent : c.text },
                  ]}
                >
                  {hoursLabel(m.hours)}
                </Text>
              </View>
              <View style={[styles.swatch, { backgroundColor: dot }]} />
              <Text
                numberOfLines={1}
                style={[font.sm, medium, { color: m.passed || isNext ? c.text : c.textMuted, flex: 1 }]}
              >
                {m.title}
              </Text>
              <Text style={[font.xs, tabular, { color: c.textMuted }]}>{when}</Text>
            </View>
            {isOpen ? (
              <View style={styles.body}>
                <Text style={[font.sm, { color: c.text }]}>{m.body}</Text>
                <Text style={[font.xs, { color: c.textMuted }]}>
                  {m.passed ? `Passed ${at}` : `Around ${at}`}
                </Text>
                {m.source ? (
                  <Text
                    key={c.text}
                    accessibilityRole="link"
                    onPress={() => void Linking.openURL(m.source!.url)}
                    style={[font.xs, { color: c.text, textDecorationLine: 'underline' }]}
                  >
                    Source: {m.source.label}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: space[3], gap: space[2], minHeight: 56, justifyContent: 'center' },
  head: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  cell: {
    width: 52,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  swatch: { width: 10, height: 10, borderRadius: 5 },
  body: { paddingLeft: 52 + space[3], gap: 4 },
});
