import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ConfirmDialog } from '../../components/ConfirmDialog';
import { DateTimeField } from '../../components/DateTimeField';
import { Body, Button, Card, Chip, ListGroup, SectionHeader, SwitchRow, Title } from '../../components/ui';
import { GOAL_CHOICES, type Goal, goalLabel } from '../../domain/fast';
import { countdownLabel, newPlan, nextRoundStart, planName, type PlannedFast } from '../../domain/plan';
import { ensureNotificationPermission } from '../../services/notifications';
import { useStore } from '../../state/store';
import { useNow } from '../../state/useNow';
import { font, space, tabular, useColors } from '../../theme';

const longDate = (t: number) =>
  new Date(t).toLocaleString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

/** Plan a fast for later, or change one. "new" adds; `?preset=<id>` starts from a preset. */
export default function EditPlan() {
  const { id, preset } = useLocalSearchParams<{ id: string; preset?: string }>();
  const { presets, settings, updateSettings } = useStore();
  const c = useColors();
  const now = useNow(30_000);
  const existing = settings.plannedFasts.find((p) => p.id === id);
  const isNew = !existing;
  const [draft, setDraft] = useState<PlannedFast>(() => {
    if (existing) return existing;
    const from = presets.find((p) => p.id === preset);
    return newPlan(nextRoundStart(Date.now()), from?.goal ?? GOAL_CHOICES[3]!.goal, from?.id ?? null);
  });
  const [confirmDelete, setConfirmDelete] = useState(false);

  const choices = [
    ...presets.map((p) => ({ key: p.id, label: p.name, goal: p.goal, presetId: p.id as string | null })),
    ...GOAL_CHOICES.map((g) => ({ key: g.label, label: g.label, goal: g.goal, presetId: null })),
  ];
  const sameGoal = (a: Goal | null, b: Goal | null) => JSON.stringify(a) === JSON.stringify(b);
  const isPicked = (ch: (typeof choices)[number]) =>
    draft.presetId ? ch.presetId === draft.presetId : ch.presetId === null && sameGoal(ch.goal, draft.goal);
  const listed = choices.some(isPicked);
  const inPast = draft.at <= now;

  const save = async () => {
    const rest = settings.plannedFasts.filter((p) => p.id !== draft.id);
    await updateSettings({ plannedFasts: [...rest, draft].sort((a, b) => a.at - b.at) });
    router.back();
  };

  const setRemind = async (remind: boolean) => {
    if (remind && !(await ensureNotificationPermission())) return;
    setDraft({ ...draft, remind });
  };

  return (
    <ScrollView
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={styles.screen}
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen options={{ title: isNew ? 'Plan a fast' : 'Planned fast' }} />
      <Card style={{ alignItems: 'center', gap: space[1] }}>
        <Body muted style={font.sm}>
          {planName(draft, presets)}
        </Body>
        <Title size="2xl" style={[tabular, { textAlign: 'center' }]}>
          {longDate(draft.at)}
        </Title>
        <Body muted style={font.sm}>
          {inPast ? 'This time has passed' : `Starts ${countdownLabel(draft, now)}`}
        </Body>
      </Card>

      <Card>
        <DateTimeField label="Start" value={draft.at} onChange={(at) => setDraft({ ...draft, at })} future />
      </Card>

      <SectionHeader>Goal</SectionHeader>
      <View style={styles.chips} accessibilityRole="radiogroup">
        {!listed && <Chip label={goalLabel(draft.goal)} selected onPress={() => {}} />}
        {choices.map((ch) => (
          <Chip
            key={ch.key}
            label={ch.label}
            selected={isPicked(ch)}
            onPress={() => setDraft({ ...draft, goal: ch.goal, presetId: ch.presetId })}
          />
        ))}
      </View>

      <ListGroup footer="Off unless you turn it on. It only tells you the time has come; you start the fast yourself.">
        <SwitchRow
          icon="bell"
          label="Remind me at the start"
          value={draft.remind}
          onChange={(v) => void setRemind(v)}
        />
      </ListGroup>

      <Button
        label={isNew ? 'Add to plan' : 'Save'}
        size="lg"
        block
        disabled={inPast}
        onPress={() => void save()}
        style={{ marginTop: space[2] }}
      />
      {!isNew && (
        <Button
          label="Remove from plan"
          size="sm"
          variant="danger"
          onPress={() => setConfirmDelete(true)}
          style={{ marginTop: space[2] }}
        />
      )}
      <ConfirmDialog
        visible={confirmDelete}
        title="Remove this plan?"
        message={`${planName(draft, presets)}, ${longDate(draft.at)}.`}
        confirmLabel="Remove"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          setConfirmDelete(false);
          await updateSettings({ plannedFasts: settings.plannedFasts.filter((p) => p.id !== draft.id) });
          router.back();
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 20, gap: space[3], paddingBottom: space[12] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
});
