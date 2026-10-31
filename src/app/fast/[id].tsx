import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ConfirmDialog } from '../../components/ConfirmDialog';
import { DateTimeField } from '../../components/DateTimeField';
import { Body, Button, Card, Chip, SectionHeader, Title } from '../../components/ui';
import {
  FAST_ERROR_TEXT,
  type Fast,
  GOAL_CHOICES,
  type Goal,
  goalLabel,
  newId,
  presetFromFast,
  validateFast,
} from '../../domain/fast';
import { formatDuration, HOUR } from '../../domain/time';
import { useStore } from '../../state/store';
import { useNow } from '../../state/useNow';
import { font, radius, space, tabular, useColors } from '../../theme';

/** Edit any fast, running or past, or add a past one ("new"). It's your record. */
export default function EditFast() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { fasts, presets, saveFast, deleteFast, savePreset } = useStore();
  const c = useColors();
  const existing = fasts.find((f) => f.id === id);
  const isNew = id === 'new' || !existing;
  const [draft, setDraft] = useState<Fast>(
    () =>
      existing ?? {
        id: newId(),
        start: Date.now() - 17 * HOUR,
        end: Date.now() - HOUR,
        goal: null,
        presetId: null,
        note: null,
        log: [],
      },
  );
  const now = useNow(30_000);
  const error = validateFast(draft, fasts, now);

  const save = async () => {
    if (error) return;
    await saveFast(draft);
    router.back();
  };

  const [confirmDelete, setConfirmDelete] = useState(false);

  const saveAsPreset = async () => {
    const preset = presetFromFast(draft, now);
    await savePreset(preset);
    Alert.alert(`Saved "${preset.name}" as a preset.`);
  };

  // Goals you can switch to. The fast's own goal stays listed even if it matches no choice.
  const goalChoices = [
    ...GOAL_CHOICES.map((g) => ({ key: g.label, label: g.label, goal: g.goal })),
    ...presets.map((p) => ({ key: p.id, label: p.name, goal: p.goal })),
  ];
  const sameGoal = (a: Goal | null, b: Goal | null) => JSON.stringify(a) === JSON.stringify(b);
  const currentGoalListed = goalChoices.some((ch) => sameGoal(ch.goal, draft.goal));

  const duration = (draft.end ?? now) - draft.start;
  const running = draft.end === null;

  return (
    <ScrollView
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={styles.screen}
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen options={{ title: isNew ? 'Add a past fast' : running ? 'Running fast' : 'Edit fast' }} />
      <Card style={{ alignItems: 'center', gap: space[1] }}>
        <Text style={[font.sm, { color: c.textMuted }]}>{running ? 'So far' : 'Duration'}</Text>
        <Title size="2xl" style={tabular}>
          {formatDuration(duration)}
        </Title>
        <Body muted style={font.sm}>
          Change start or end. It&apos;s your record.
        </Body>
      </Card>

      <Card>
        <DateTimeField
          label="Start"
          value={draft.start}
          onChange={(start) => setDraft({ ...draft, start })}
          error={
            error && error !== 'end_before_start' && error !== 'end_in_future' ? FAST_ERROR_TEXT[error] : null
          }
        />
        {draft.end !== null && (
          <DateTimeField
            label="End"
            value={draft.end}
            onChange={(end) => setDraft({ ...draft, end })}
            error={error === 'end_before_start' || error === 'end_in_future' ? FAST_ERROR_TEXT[error] : null}
          />
        )}
      </Card>

      <SectionHeader>Goal</SectionHeader>
      <View style={styles.chips} accessibilityRole="radiogroup">
        {!currentGoalListed && <Chip label={goalLabel(draft.goal)} selected onPress={() => {}} />}
        {goalChoices.map((ch) => (
          <Chip
            key={ch.key}
            label={ch.label}
            selected={sameGoal(ch.goal, draft.goal)}
            onPress={() => setDraft({ ...draft, goal: ch.goal })}
          />
        ))}
      </View>

      <SectionHeader>Note</SectionHeader>
      <TextInput
        placeholder="How it went, what you broke it with… (optional)"
        placeholderTextColor={c.textFaint}
        value={draft.note ?? ''}
        onChangeText={(note) => setDraft({ ...draft, note: note || null })}
        multiline
        style={[font.md, styles.note, { color: c.text, backgroundColor: c.surface2 }]}
      />
      <Button
        label={isNew ? 'Add fast' : 'Save'}
        size="lg"
        block
        onPress={() => void save()}
        disabled={!!error}
        style={{ marginTop: space[2] }}
      />
      {!isNew && (
        <View style={styles.row}>
          {draft.end !== null && (
            <Button
              label="Save as preset"
              icon="plus"
              size="sm"
              variant="quiet"
              onPress={() => void saveAsPreset()}
            />
          )}
          <Button label="Delete" size="sm" variant="danger" onPress={() => setConfirmDelete(true)} />
        </View>
      )}
      <ConfirmDialog
        visible={confirmDelete}
        title="Delete this fast?"
        message={`${formatDuration(duration)}. This can't be undone.`}
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          setConfirmDelete(false);
          await deleteFast(draft.id);
          router.back();
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 20, gap: space[3], paddingBottom: space[12] },
  row: { flexDirection: 'row', gap: space[2], justifyContent: 'center', marginTop: space[2] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  note: {
    minHeight: 96,
    borderRadius: radius.lg,
    padding: space[4],
    textAlignVertical: 'top',
  },
});
