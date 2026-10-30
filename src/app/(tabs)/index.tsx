import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { DateTimeField } from '../../components/DateTimeField';
import { DayRing } from '../../components/DayRing';
import { SafetyCard } from '../../components/SafetyCard';
import { Body, Button, Card, Chip } from '../../components/ui';
import { APP_NAME } from '../../config/identity';
import {
  elapsedMs,
  GOAL_CHOICES,
  type Goal,
  goalLabel,
  type GoalUnit,
  newId,
  parseDurationGoal,
  presetFromFast,
} from '../../domain/fast';
import { shouldShowSafetyCard } from '../../domain/safety';
import { DAY, formatDuration } from '../../domain/time';
import { useStore } from '../../state/store';
import { useNow } from '../../state/useNow';
import { font, layout, radius, space, useColors } from '../../theme';

const CUSTOM = 'custom';

type CustomKind = GoalUnit | 'until';

export default function FastScreen() {
  const { loaded, fasts, running, presets, settings, startFast, endFast, updateSettings, savePreset } =
    useStore();
  const now = useNow();
  const c = useColors();
  const [selectedKey, setSelectedKey] = useState('Open-ended');
  const [customKind, setCustomKind] = useState<CustomKind>('hours');
  const [customAmount, setCustomAmount] = useState('');
  const [customUntil, setCustomUntil] = useState(() => Date.now() + DAY);
  // The fast you just ended, so it can become a preset in one tap.
  const [justEndedId, setJustEndedId] = useState<string | null>(null);

  if (!loaded) return null;

  if (!running) {
    const choices = [
      ...GOAL_CHOICES.map((g) => ({ key: g.label, label: g.label, goal: g.goal, presetId: null })),
      ...presets.map((p) => ({ key: p.id, label: p.name, goal: p.goal, presetId: p.id })),
    ];
    const isCustom = selectedKey === CUSTOM;
    const customGoal: Goal | null =
      customKind === 'until'
        ? customUntil > now
          ? { kind: 'until', at: customUntil }
          : null
        : parseDurationGoal(customAmount, customKind);
    const picked = choices.find((ch) => ch.key === selectedKey) ?? choices[0]!;
    const goal = isCustom ? customGoal : picked.goal;
    const presetId = isCustom ? null : picked.presetId;
    const saveCustomPreset = async () => {
      if (!customGoal || customGoal.kind !== 'duration') return;
      const preset = { id: newId(), name: goalLabel(customGoal), goal: customGoal };
      await savePreset(preset);
      setSelectedKey(preset.id);
    };

    const justEnded = fasts.find((f) => f.id === justEndedId && f.end !== null) ?? null;
    const saveEndedAsPreset = async () => {
      if (!justEnded) return;
      const preset = presetFromFast(justEnded, now);
      await savePreset(preset);
      setSelectedKey(preset.id);
      setJustEndedId(null);
    };

    return (
      <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
        {justEnded && (
          <Card>
            <Body style={{ fontWeight: '600' }}>
              Fast ended at {formatDuration(elapsedMs(justEnded, now))}
            </Body>
            <View style={styles.row}>
              <Button label="Save as preset" variant="secondary" onPress={() => void saveEndedAsPreset()} />
              <Button label="Edit" variant="ghost" onPress={() => router.push(`/fast/${justEnded.id}`)} />
              <Button label="Dismiss" variant="ghost" onPress={() => setJustEndedId(null)} />
            </View>
          </Card>
        )}
        <Body style={[font.xl, { fontWeight: '600' }]}>{APP_NAME}</Body>
        <View style={styles.chips} accessibilityRole="radiogroup">
          {choices.map((ch) => (
            <Chip
              key={ch.key}
              label={ch.label}
              selected={ch.key === selectedKey}
              onPress={() => setSelectedKey(ch.key)}
            />
          ))}
          <Chip label="Custom" selected={isCustom} onPress={() => setSelectedKey(CUSTOM)} />
        </View>
        {isCustom && (
          <Card>
            <View style={styles.chips} accessibilityRole="radiogroup">
              <Chip label="Hours" selected={customKind === 'hours'} onPress={() => setCustomKind('hours')} />
              <Chip label="Days" selected={customKind === 'days'} onPress={() => setCustomKind('days')} />
              <Chip
                label="Until a date"
                selected={customKind === 'until'}
                onPress={() => setCustomKind('until')}
              />
            </View>
            {customKind === 'until' ? (
              <DateTimeField label="Fast until" value={customUntil} onChange={setCustomUntil} future />
            ) : (
              <TextInput
                accessibilityLabel={`Goal in ${customKind}`}
                placeholder={customKind === 'hours' ? 'e.g. 36' : 'e.g. 5'}
                placeholderTextColor={c.textMuted}
                keyboardType="decimal-pad"
                value={customAmount}
                onChangeText={setCustomAmount}
                style={[
                  font.lg,
                  styles.amount,
                  { color: c.text, borderColor: c.borderInput, backgroundColor: c.surface },
                ]}
              />
            )}
            <Body muted style={font.sm}>
              {customGoal ? `Goal: ${goalLabel(customGoal)}. No upper limit.` : 'Any length you like.'}
            </Body>
            {customGoal?.kind === 'duration' && (
              <Button label="Save as preset" variant="secondary" onPress={() => void saveCustomPreset()} />
            )}
          </Card>
        )}
        <Button
          label="Start a fast"
          size="lg"
          disabled={isCustom && !customGoal}
          onPress={() => void startFast(goal, presetId)}
        />
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
      {
        text: 'End fast',
        onPress: () => {
          setJustEndedId(running.id);
          void endFast();
        },
      },
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
      <Button label="Edit start or goal" variant="ghost" onPress={() => router.push(`/fast/${running.id}`)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: layout.gutter, gap: space[4], alignItems: 'center', paddingTop: space[8] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2], justifyContent: 'center' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  amount: { height: 52, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: space[3] },
});
