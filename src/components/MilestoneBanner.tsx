import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { TimelineMark } from '../domain/milestones';
import { formatDuration, HOUR } from '../domain/time';
import { font, radius, serif, space, useColors } from '../theme';
import { Icon } from './Icon';

/**
 * The mark you just passed while the app was open, or null. Marks already passed
 * when the screen opened don't pop up again; only crossings you are here for do.
 */
export function useJustPassed(marks: readonly TimelineMark[], fastId: string) {
  const seen = useRef<{ fastId: string | null; keys: Set<string> }>({ fastId: null, keys: new Set() });
  const [shown, setShown] = useState<TimelineMark | null>(null);
  useEffect(() => {
    const passed = marks.filter((m) => m.passed);
    if (seen.current.fastId !== fastId) {
      seen.current = { fastId, keys: new Set(passed.map((m) => m.key)) };
      setShown(null);
      return;
    }
    const fresh = passed.filter((m) => !seen.current.keys.has(m.key));
    if (fresh.length === 0) return;
    fresh.forEach((m) => seen.current.keys.add(m.key));
    setShown(fresh.at(-1)!);
  }, [marks, fastId]);
  useEffect(() => {
    if (!shown) return;
    const t = setTimeout(() => setShown(null), 12_000);
    return () => clearTimeout(t);
  }, [shown]);
  return [shown, () => setShown(null)] as const;
}

const headline = (m: TimelineMark) =>
  m.kind === 'goal'
    ? 'Goal reached.'
    : m.kind === 'best'
      ? 'New longest fast.'
      : `${formatDuration(m.hours * HOUR)
          .replace(/ 00m$/, '')
          .replace(/ 0h$/, '')}. ${m.title}.`;

/** A quiet in-app note when you pass a milestone. No confetti, no sound. */
export function MilestoneBanner({ mark, onClose }: { mark: TimelineMark; onClose: () => void }) {
  const c = useColors();
  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={[styles.banner, { backgroundColor: c.milestoneSubtle, borderColor: c.milestone }]}
    >
      <View style={[styles.icon, { backgroundColor: c.milestone }]}>
        <Icon
          name={mark.kind === 'goal' ? 'flag' : mark.kind === 'best' ? 'trophy' : 'check'}
          size={18}
          color={c.surface}
        />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[font.md, { color: c.text, fontFamily: serif, fontWeight: '700' }]}>
          {headline(mark)}
        </Text>
        <Text style={[font.sm, { color: c.text }]}>{mark.body}</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Close" hitSlop={12} onPress={onClose}>
        <Icon name="close" size={18} color={c.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    gap: space[3],
    padding: space[4],
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  icon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
