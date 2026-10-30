import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { DateTimeField } from '../../components/DateTimeField';
import { Body, Button } from '../../components/ui';
import { FAST_ERROR_TEXT, type Fast, newId, validateFast } from '../../domain/fast';
import { formatDuration, HOUR } from '../../domain/time';
import { useStore } from '../../state/store';
import { useNow } from '../../state/useNow';
import { font, layout, radius, space, useColors } from '../../theme';

/** Edit any fast, running or past, or add a past one ("new"). It's your record. */
export default function EditFast() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { fasts, saveFast, deleteFast, savePreset } = useStore();
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
      },
  );
  const now = useNow(30_000);
  const error = validateFast(draft, fasts, now);

  const save = async () => {
    if (error) return;
    await saveFast(draft);
    router.back();
  };

  const remove = () =>
    Alert.alert('Delete this fast?', formatDuration((draft.end ?? now) - draft.start), [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteFast(draft.id);
          router.back();
        },
      },
    ]);

  const saveAsPreset = async () => {
    const hours = Math.round(((draft.end ?? now) - draft.start) / HOUR);
    await savePreset({ id: newId(), name: `${hours}h`, goal: { kind: 'duration', ms: hours * HOUR } });
    Alert.alert(`Saved "${hours}h" as a preset.`);
  };

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Stack.Screen options={{ title: isNew ? 'Add a past fast' : 'Edit fast' }} />
      <Body muted>Change start or end. It&apos;s your record.</Body>
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
      <Body>Duration {formatDuration((draft.end ?? now) - draft.start)}</Body>
      <TextInput
        placeholder="Note (optional)"
        placeholderTextColor={c.textMuted}
        value={draft.note ?? ''}
        onChangeText={(note) => setDraft({ ...draft, note: note || null })}
        multiline
        style={[
          font.md,
          styles.note,
          { color: c.text, borderColor: c.borderInput, backgroundColor: c.surface },
        ]}
      />
      <Button label="Save" onPress={() => void save()} disabled={!!error} />
      {!isNew && (
        <View style={styles.row}>
          {draft.end !== null && (
            <Button label="Save as preset" variant="secondary" onPress={() => void saveAsPreset()} />
          )}
          <Button label="Delete" variant="danger" onPress={remove} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: layout.gutter, gap: space[4] },
  row: { flexDirection: 'row', gap: space[2] },
  note: { minHeight: 80, borderWidth: 1, borderRadius: radius.md, padding: space[3] },
});
