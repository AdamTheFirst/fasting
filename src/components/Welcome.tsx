import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { APP_NAME } from '../config/identity';
import { elevation, font, radius, space, strong, useColors } from '../theme';
import { BrandMark, Icon, type IconName } from './Icon';
import { Button } from './ui';

const POINTS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'clock',
    title: 'Any length, your way',
    body: 'Set a goal in hours, days or a time of day, or leave it open. No quiz, no plan to follow first.',
  },
  {
    icon: 'fast',
    title: 'What is likely happening',
    body: 'Milestones say what your body is likely doing at 12, 24, 48 and 72 hours, each with its source.',
  },
  {
    icon: 'history',
    title: 'Your record, yours to edit',
    body: 'Fix any start or end time, add notes, and see your weeks and months at a glance.',
  },
  {
    icon: 'lock',
    title: 'Stays on this phone',
    body: 'No account, no ads, no tracking. Your fasts never leave this device.',
  },
];

/**
 * First launch only: what the app is, then one tap that says you're an adult. Shown full screen,
 * before the tabs. No questions, no account; it sets one flag on the phone.
 */
export function Welcome({ onConfirm }: { onConfirm: () => void }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical={false}
      >
        <View style={styles.hero}>
          <View style={[styles.mark, { backgroundColor: c.surface, shadowColor: c.shadow, ...elevation }]}>
            <BrandMark size={56} color={c.text} accent={c.accentStrong} />
          </View>
          <Text accessibilityRole="header" style={[font.title, strong, { color: c.text }]}>
            Welcome to {APP_NAME}
          </Text>
          <Text style={[font.md, styles.lead, { color: c.textMuted }]}>
            A calm log for the fasts you already know how to do, from 16 hours to many days.
          </Text>
        </View>

        <View style={styles.points}>
          {POINTS.map((pt) => (
            <View
              key={pt.title}
              style={styles.point}
              accessible
              accessibilityLabel={`${pt.title}. ${pt.body}`}
            >
              <View style={[styles.pointIcon, { backgroundColor: c.accentSubtle }]}>
                <Icon name={pt.icon} size={22} color={c.text} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[font.md, { color: c.text, fontWeight: '600' }]}>{pt.title}</Text>
                <Text style={[font.sm, { color: c.textMuted }]}>{pt.body}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + space[4] }]}>
        <View style={[styles.note, { backgroundColor: c.surface2 }]}>
          <Icon name="info" size={18} color={c.textMuted} />
          <Text style={[font.xs, { color: c.textMuted, flex: 1 }]}>
            {APP_NAME} is for adults and is not medical advice. If you&apos;re under 18, pregnant or take
            medication, talk to a doctor before fasting.
          </Text>
        </View>
        <Button label="I'm 18 or older" size="lg" block onPress={onConfirm} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingTop: space[10], paddingBottom: space[6], gap: space[10] },
  hero: { alignItems: 'center', gap: space[4] },
  mark: {
    width: 104,
    height: 104,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space[2],
  },
  lead: { textAlign: 'center', maxWidth: 330 },
  points: { gap: space[6] },
  point: { flexDirection: 'row', gap: space[4], alignItems: 'flex-start' },
  pointIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: { paddingHorizontal: 24, gap: space[4], paddingTop: space[2] },
  note: {
    flexDirection: 'row',
    gap: space[2],
    alignItems: 'flex-start',
    borderRadius: radius.md,
    padding: space[3],
  },
});
