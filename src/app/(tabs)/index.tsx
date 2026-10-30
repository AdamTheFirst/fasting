import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { DayRing } from '../../components/DayRing';
import { SafetyCard } from '../../components/SafetyCard';
import { Body, Button, Chip } from '../../components/ui';
import { APP_NAME } from '../../config/identity';
import { elapsedMs, GOAL_CHOICES, type Goal } from '../../domain/fast';
import { shouldShowSafetyCard } from '../../domain/safety';
import { formatDuration } from '../../domain/time';
import { useStore } from '../../state/store';
import { useNow } from '../../state/useNow';
import { font, layout, space } from '../../theme';

export default function FastScreen() {
  const { loaded, running, presets, settings, startFast, endFast, updateSettings } = useStore();
  const now = useNow();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [presetId, setPresetId] = useState<string | null>(null);

  if (!loaded) return null;

  if (!running) {
    const choices = [
      ...GOAL_CHOICES.map((g) => ({ key: g.label, label: g.label, goal: g.goal, presetId: null })),
      ...presets.map((p) => ({ key: p.id, label: p.name, goal: p.goal, presetId: p.id })),
    ];
    const selectedKey =
      choices.find((ch) => ch.presetId === presetId && ch.goal === goal)?.key ?? 'Open-ended';
    return (
      <ScrollView contentContainerStyle={styles.screen}>
        <Body style={[font.xl, { fontWeight: '600' }]}>{APP_NAME}</Body>
        <View style={styles.chips} accessibilityRole="radiogroup">
          {choices.map((ch) => (
            <Chip
              key={ch.key}
              label={ch.label}
              selected={ch.key === selectedKey}
              onPress={() => {
                setGoal(ch.goal);
                setPresetId(ch.presetId);
              }}
            />
          ))}
        </View>
        <Button label="Start a fast" size="lg" onPress={() => void startFast(goal, presetId)} />
        <Body muted style={font.sm}>
          No account. No quiz. Your data stays on this phone.
        </Body>
        <Button label="Add a past fast" variant="ghost" onPress={() => router.push('/fast/new')} />
      </ScrollView>
    );
  }

  const showCard = shouldShowSafetyCard(running, now, {
    disabled: settings.safetyCardDisabled,
    dismissedFastIds: settings.safetyCardDismissedFor,
  });
  const confirmEnd = () =>
    Alert.alert(`End this fast at ${formatDuration(elapsedMs(running, Date.now()))}?`, undefined, [
      { text: 'Keep going', style: 'cancel' },
      { text: 'End fast', onPress: () => void endFast() },
    ]);

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      {showCard && (
        <SafetyCard
          onDismiss={() =>
            void updateSettings({ safetyCardDismissedFor: [...settings.safetyCardDismissedFor, running.id] })
          }
          onTurnOff={() => void updateSettings({ safetyCardDisabled: true })}
        />
      )}
      <DayRing fast={running} now={now} />
      <Button label="End fast" size="lg" onPress={confirmEnd} />
      <Button label="Change start" variant="ghost" onPress={() => router.push(`/fast/${running.id}`)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: layout.gutter, gap: space[4], alignItems: 'center', paddingTop: space[8] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2], justifyContent: 'center' },
});
