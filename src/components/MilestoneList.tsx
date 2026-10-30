import { Linking, StyleSheet, Text, View } from 'react-native';

import type { TimelineMark } from '../domain/milestones';
import { formatDuration, HOUR } from '../domain/time';
import { font, serif, space, tabular, useColors } from '../theme';
import { Icon } from './Icon';

const hoursLabel = (h: number) => (h >= 48 && h % 24 === 0 ? `${h / 24}d` : `${Math.round(h * 10) / 10}h`);

/**
 * "Along the way": a vertical line of what is likely happening, passed points filled
 * in ochre, the next one highlighted. Plain words, "likely", and a source for each.
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
  return (
    <View>
      {marks.map((m, i) => {
        const isNext = m.key === nextKey;
        const last = i === marks.length - 1;
        const dot = m.passed ? c.milestone : isNext ? c.accent : c.border;
        const when = m.passed
          ? 'Passed'
          : `In ${formatDuration((m.hours - elapsedHours) * HOUR)} · ${new Date(
              start + m.hours * HOUR,
            ).toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' })}`;
        return (
          <View
            key={m.key}
            style={styles.item}
            accessible
            accessibilityLabel={`${m.title}, ${hoursLabel(m.hours)}. ${when}. ${m.body}`}
          >
            <View style={styles.rail}>
              <View
                style={[
                  styles.dot,
                  { borderColor: dot, backgroundColor: m.passed ? dot : 'transparent' },
                  isNext && styles.dotNext,
                ]}
              >
                {m.passed ? <Icon name="check" size={12} color={c.surface} /> : null}
              </View>
              {!last && (
                <View style={[styles.line, { backgroundColor: m.passed ? c.milestone : c.border }]} />
              )}
            </View>
            <View style={[styles.text, !last && { paddingBottom: space[5] }]}>
              <View style={styles.titleRow}>
                <Text
                  style={[
                    font.md,
                    tabular,
                    { color: c.text, fontFamily: serif, fontWeight: '700', minWidth: 40 },
                  ]}
                >
                  {hoursLabel(m.hours)}
                </Text>
                <Text style={[font.md, { color: c.text, fontWeight: '600', flex: 1 }]}>{m.title}</Text>
              </View>
              <Text style={[font.xs, { color: isNext ? c.accent : c.textMuted, fontWeight: '600' }]}>
                {when}
              </Text>
              <Text style={[font.sm, { color: m.passed || isNext ? c.text : c.textMuted }]}>{m.body}</Text>
              {m.source ? (
                <Text
                  accessibilityRole="link"
                  onPress={() => void Linking.openURL(m.source!.url)}
                  style={[font.xs, { color: c.accent, fontWeight: '600' }]}
                >
                  Source: {m.source.label}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', gap: space[3] },
  rail: { alignItems: 'center', width: 22 },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  dotNext: { borderWidth: 3 },
  line: { width: 2, flex: 1, marginVertical: 2, borderRadius: 1 },
  text: { flex: 1, gap: 3 },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', gap: space[2] },
});
