import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ConfirmDialog } from '../../components/ConfirmDialog';
import { DateTimeField } from '../../components/DateTimeField';
import { HorizonTrack } from '../../components/HorizonTrack';
import { Icon } from '../../components/Icon';
import { MilestoneBanner, useJustPassed } from '../../components/MilestoneBanner';
import { MilestoneList } from '../../components/MilestoneList';
import { SafetyCard } from '../../components/SafetyCard';
import { Badge, Body, Button, Card, Chip, Screen, SectionHeader, Stat, Title } from '../../components/ui';
import {
  elapsedMs,
  type Fast,
  GOAL_CHOICES,
  type Goal,
  goalLabel,
  goalReachedAt,
  type GoalUnit,
  newId,
  parseDurationGoal,
  presetFromFast,
} from '../../domain/fast';
import { AUTOPHAGY_NOTE, timeline } from '../../domain/milestones';
import { shouldShowSafetyCard } from '../../domain/safety';
import { presetForToday } from '../../domain/settings';
import { hoursByDay, hoursInRange, longestFast, startOfLocalWeek, streaks, dayKey } from '../../domain/stats';
import { DAY, formatDuration, formatElapsed, formatShort, HOUR } from '../../domain/time';
import { useStore } from '../../state/store';
import { useNow } from '../../state/useNow';
import { font, radius, serif, space, tabular, useColors } from '../../theme';

const CUSTOM = 'custom';

type CustomKind = GoalUnit | 'until';

const when = (t: number) =>
  new Date(t).toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' });

/** "16h", "3d", "∞": the big value on a goal tile. */
function goalShort(goal: Goal | null): string {
  if (!goal) return '∞';
  if (goal.kind === 'until')
    return new Date(goal.at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  const h = goal.ms / HOUR;
  if (h >= 48 && h % 24 === 0) return `${h / 24}d`;
  return `${Math.round(h * 10) / 10}h`;
}

/** The previous longest finished fast, used for "new record" moments. */
function previousBest(fasts: readonly Fast[], now: number, exceptId?: string) {
  const best = longestFast(
    fasts.filter((f) => f.end !== null && f.id !== exceptId),
    now,
  );
  return best ? elapsedMs(best, now) : 0;
}

export default function FastScreen() {
  const { loaded, running } = useStore();
  const [justEndedId, setJustEndedId] = useState<string | null>(null);
  if (!loaded) return null;
  return running ? (
    <RunningFast fast={running} onEnded={setJustEndedId} />
  ) : (
    <StartFast justEndedId={justEndedId} clearJustEnded={() => setJustEndedId(null)} />
  );
}

function StartFast({
  justEndedId,
  clearJustEnded,
}: {
  justEndedId: string | null;
  clearJustEnded: () => void;
}) {
  const { fasts, presets, settings, startFast, savePreset } = useStore();
  const now = useNow(30_000);
  const c = useColors();
  const [picked, setPicked] = useState<string | null>(null);
  // Until you pick something, the weekly rhythm (if any) chooses; otherwise open-ended.
  const todays = presetForToday(
    settings.weekdayPresets,
    presets.map((p) => p.id),
    now,
  );
  const selectedKey = picked ?? todays ?? 'Open-ended';
  const [customKind, setCustomKind] = useState<CustomKind>('hours');
  const [customAmount, setCustomAmount] = useState('');
  const [customUntil, setCustomUntil] = useState(() => Date.now() + DAY);

  const choices = [
    ...GOAL_CHOICES.map((g) => ({
      key: g.label,
      caption: g.goal ? goalLabel(g.goal).replace(/h$/, ' hours') : 'Open-ended',
      goal: g.goal,
      presetId: null as string | null,
    })),
    ...presets.map((p) => ({ key: p.id, caption: p.name, goal: p.goal, presetId: p.id as string | null })),
  ];
  // Today's rhythm preset goes first so the selected tile is always in view.
  choices.sort(
    (a, b) =>
      Number(b.presetId !== null && b.presetId === todays) -
      Number(a.presetId !== null && a.presetId === todays),
  );
  const isCustom = selectedKey === CUSTOM;
  const customGoal: Goal | null =
    customKind === 'until'
      ? customUntil > now
        ? { kind: 'until', at: customUntil }
        : null
      : parseDurationGoal(customAmount, customKind);
  const choice = choices.find((ch) => ch.key === selectedKey) ?? choices[0]!;
  const goal = isCustom ? customGoal : choice.goal;
  const presetId = isCustom ? null : choice.presetId;

  const saveCustomPreset = async () => {
    if (!customGoal || customGoal.kind !== 'duration') return;
    const preset = { id: newId(), name: goalLabel(customGoal), goal: customGoal };
    await savePreset(preset);
    setPicked(preset.id);
  };

  const justEnded = fasts.find((f) => f.id === justEndedId && f.end !== null) ?? null;
  const saveEndedAsPreset = async () => {
    if (!justEnded) return;
    const preset = presetFromFast(justEnded, now);
    await savePreset(preset);
    setPicked(preset.id);
    clearJustEnded();
  };

  const week = useMemo(() => {
    const byDay = hoursByDay(fasts, now);
    const monday = startOfLocalWeek(now);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      return {
        letter: d.toLocaleDateString(undefined, { weekday: 'narrow' }),
        hours: byDay.get(dayKey(d.getTime())) ?? 0,
        today: dayKey(d.getTime()) === dayKey(now),
      };
    });
  }, [fasts, now]);
  const weekHours = hoursInRange(fasts, startOfLocalWeek(now), now, now);
  const streak = streaks(fasts, settings.streakMinHours, now).current;
  const best = longestFast(fasts, now);
  const last = fasts.filter((f) => f.end !== null).sort((a, b) => b.end! - a.end!)[0];
  const goalText = goal ? `Goal ${goalLabel(goal)}` : 'Open-ended. No cap.';

  return (
    <Screen title="Ready when you are" eyebrow="Fastaway">
      {justEnded && (
        <EndedCard
          fast={justEnded}
          previousBestMs={previousBest(fasts, now, justEnded.id)}
          onSavePreset={() => void saveEndedAsPreset()}
          onDismiss={clearJustEnded}
        />
      )}

      <SectionHeader>Goal</SectionHeader>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tiles}
        style={styles.tilesScroll}
        accessibilityRole="radiogroup"
      >
        {choices.map((ch) => (
          <GoalTile
            key={ch.key}
            value={goalShort(ch.goal)}
            caption={ch.caption}
            tag={ch.presetId && ch.presetId === todays ? 'Today' : undefined}
            selected={ch.key === selectedKey}
            onPress={() => setPicked(ch.key)}
          />
        ))}
        <GoalTile value="+" caption="Custom" selected={isCustom} onPress={() => setPicked(CUSTOM)} />
      </ScrollView>

      {isCustom && (
        <Card>
          <View style={styles.chips} accessibilityRole="radiogroup">
            <Chip label="Hours" selected={customKind === 'hours'} onPress={() => setCustomKind('hours')} />
            <Chip label="Days" selected={customKind === 'days'} onPress={() => setCustomKind('days')} />
            <Chip label="Until…" selected={customKind === 'until'} onPress={() => setCustomKind('until')} />
          </View>
          {customKind === 'until' ? (
            <DateTimeField label="Fast until" value={customUntil} onChange={setCustomUntil} future />
          ) : (
            <View style={[styles.amountWrap, { borderColor: c.borderInput, backgroundColor: c.bg }]}>
              <TextInput
                accessibilityLabel={`Goal in ${customKind}`}
                placeholder={customKind === 'hours' ? '36' : '5'}
                placeholderTextColor={c.textFaint}
                keyboardType="decimal-pad"
                value={customAmount}
                onChangeText={setCustomAmount}
                style={[font['2xl'], styles.amount, { color: c.text, fontFamily: serif }]}
              />
              <Text style={[font.lg, { color: c.textMuted }]}>{customKind}</Text>
            </View>
          )}
          <Body muted style={font.sm}>
            {customGoal ? `Goal: ${goalLabel(customGoal)}. No upper limit.` : 'Any length you like.'}
          </Body>
          {customGoal?.kind === 'duration' && (
            <Button
              label="Save as preset"
              icon="plus"
              size="sm"
              variant="quiet"
              style={{ alignSelf: 'flex-start' }}
              onPress={() => void saveCustomPreset()}
            />
          )}
        </Card>
      )}

      <Button
        label="Start a fast"
        size="lg"
        block
        caption={goalText}
        disabled={isCustom && !customGoal}
        onPress={() => void startFast(goal, presetId)}
        style={{ marginTop: space[2] }}
      />
      <Text style={[font.xs, { color: c.textMuted, textAlign: 'center' }]}>
        No account. No quiz. Your data stays on this phone.
      </Text>

      <SectionHeader>This week</SectionHeader>
      <Card onPress={() => router.push('/history')} accessibilityLabel="Open history">
        <View style={styles.weekHead}>
          <Stat label="Fasted this week" value={`${Math.round(weekHours)}`} unit="h" />
          <Stat
            label="Streak"
            value={`${streak}`}
            unit={streak === 1 ? 'day' : 'days'}
            hint={`a day counts at ${settings.streakMinHours}h+`}
          />
        </View>
        <WeekBars days={week} />
      </Card>

      <View style={styles.pair}>
        <Card style={{ flex: 1 }}>
          <Stat
            label="Last fast"
            value={last ? formatShort(elapsedMs(last, now)) : '–'}
            hint={last ? `ended ${when(last.end!)}` : 'none yet'}
          />
        </Card>
        <Card style={{ flex: 1 }}>
          <Stat
            label="Longest"
            value={best ? formatShort(elapsedMs(best, now)) : '–'}
            hint={
              best
                ? new Date(best.start).toLocaleDateString(undefined, {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'your record shows here'
            }
          />
        </Card>
      </View>

      <Button label="Add a past fast" icon="plus" variant="ghost" onPress={() => router.push('/fast/new')} />
    </Screen>
  );
}

function GoalTile({
  value,
  caption,
  selected,
  onPress,
  tag,
}: {
  value: string;
  caption: string;
  selected: boolean;
  onPress: () => void;
  tag?: string;
}) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={tag ? `${caption}, ${tag}` : caption}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: selected ? c.accent : c.surface,
          borderColor: selected ? c.accent : c.border,
        },
        pressed && { transform: [{ scale: 0.97 }] },
      ]}
    >
      {tag ? (
        <View style={[styles.tileTag, { backgroundColor: selected ? c.onAccent : c.milestoneSubtle }]}>
          <Text style={[font.xs, { color: c.milestone, fontWeight: '700', fontSize: 10 }]}>{tag}</Text>
        </View>
      ) : null}
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={[
          font.xl,
          tabular,
          { color: selected ? c.onAccent : c.text, fontFamily: serif, fontWeight: '700' },
        ]}
      >
        {value}
      </Text>
      <Text
        numberOfLines={1}
        style={[font.xs, { color: selected ? c.onAccent : c.textMuted, fontWeight: '600' }]}
      >
        {caption}
      </Text>
    </Pressable>
  );
}

function WeekBars({ days }: { days: { letter: string; hours: number; today: boolean }[] }) {
  const c = useColors();
  return (
    <View style={styles.week} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {days.map((d, i) => (
        <View key={i} style={styles.weekCol}>
          <View style={[styles.weekTrack, { backgroundColor: c.surface2 }]}>
            <View
              style={{
                height: `${Math.min(100, (d.hours / 24) * 100)}%`,
                backgroundColor: d.hours >= 16 ? c.accent : c.accentSoft,
                borderRadius: 6,
              }}
            />
          </View>
          <Text
            style={[
              font.xs,
              { color: d.today ? c.accent : c.textMuted, fontWeight: d.today ? '800' : '600' },
            ]}
          >
            {d.letter}
          </Text>
        </View>
      ))}
    </View>
  );
}

function EndedCard({
  fast,
  previousBestMs,
  onSavePreset,
  onDismiss,
}: {
  fast: Fast;
  previousBestMs: number;
  onSavePreset: () => void;
  onDismiss: () => void;
}) {
  const c = useColors();
  const ms = elapsedMs(fast, fast.end!);
  const goalAt = goalReachedAt(fast);
  const note =
    previousBestMs > 0 && ms > previousBestMs
      ? 'Your longest fast yet.'
      : goalAt && fast.end! >= goalAt
        ? `Goal of ${goalLabel(fast.goal)} reached.`
        : 'Every fast counts, any length.';
  return (
    <Card tone="accent">
      <View style={styles.endedHead}>
        <View style={{ flex: 1 }}>
          <Text style={[font.xs, { color: c.accent, fontWeight: '700', letterSpacing: 0.8 }]}>LOGGED</Text>
          <Title size="2xl" style={tabular}>
            {formatDuration(ms)}
          </Title>
          <Body>{note}</Body>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Dismiss" hitSlop={12} onPress={onDismiss}>
          <Icon name="close" color={c.textMuted} />
        </Pressable>
      </View>
      <View style={styles.chips}>
        <Button label="Save as preset" icon="plus" size="sm" variant="primary" onPress={onSavePreset} />
        <Button
          label="Edit"
          icon="edit"
          size="sm"
          variant="ghost"
          onPress={() => router.push(`/fast/${fast.id}`)}
        />
      </View>
    </Card>
  );
}

function RunningFast({ fast, onEnded }: { fast: Fast; onEnded: (id: string) => void }) {
  const { fasts, settings, endFast, updateSettings } = useStore();
  const now = useNow();
  const c = useColors();
  const elapsed = elapsedMs(fast, now);
  const elapsedHours = elapsed / HOUR;
  const best = previousBest(fasts, now, fast.id);
  const marks = useMemo(
    () => timeline(fast, settings.milestones.custom, best, now),
    [fast, settings.milestones.custom, best, now],
  );
  const [justPassed, closeBanner] = useJustPassed(marks, fast.id);
  const goalAt = goalReachedAt(fast);
  const day = Math.floor(elapsed / DAY) + 1;

  const showCard = shouldShowSafetyCard(fast, now, {
    disabled: settings.safetyCardDisabled,
    dismissedFastIds: settings.safetyCardDismissedFor,
  });
  const [confirming, setConfirming] = useState(false);

  const goalLine = goalAt
    ? now >= goalAt
      ? `Goal reached ${when(goalAt)} · ${formatDuration(now - goalAt)} past it`
      : `${Math.floor((elapsed / (goalAt - fast.start)) * 100)}% of ${goalLabel(fast.goal)} · ${formatDuration(goalAt - now)} to go`
    : 'Open-ended. No cap, end it when you choose.';

  // Under a day the seconds tick, set smaller so the hours and minutes stay the headline.
  const [, timerMain = '', timerSeconds] = /^(.*?)(?: (\d+s))?$/.exec(formatElapsed(elapsed)) ?? [];

  return (
    <Screen title={elapsed >= DAY ? `Day ${day}` : 'Fasting'} eyebrow="Fasting now">
      {justPassed && <MilestoneBanner mark={justPassed} onClose={closeBanner} />}
      <Card tone="hero" style={styles.hero}>
        <Text
          accessibilityLabel={`Fasting ${formatElapsed(elapsed)}`}
          adjustsFontSizeToFit
          numberOfLines={1}
          style={[font.display, tabular, { color: c.onHero, fontWeight: '300', letterSpacing: -1 }]}
        >
          {timerMain}
          {timerSeconds ? <Text style={[font.xl, { color: c.onHeroMuted }]}> {timerSeconds}</Text> : null}
        </Text>
        <Text style={[font.sm, { color: c.onHeroMuted }]}>
          Started {when(fast.start)}
          {goalAt ? ` · ends ${when(goalAt)}` : ''}
        </Text>
        <HorizonTrack
          elapsedHours={elapsedHours}
          marks={marks}
          line={c.onHero}
          faint={c.onHeroMuted}
          milestone={c.onHeroMilestone}
          now={c.onHero}
        />
        <View style={[styles.goalLine, { borderTopColor: c.onHeroMuted }]}>
          <Icon name={goalAt ? 'flag' : 'fast'} size={16} color={c.onHeroMuted} />
          <Text style={[font.sm, { color: c.onHero, flex: 1 }]}>{goalLine}</Text>
        </View>
      </Card>

      <View style={styles.pair}>
        <Button label="End fast" size="lg" block onPress={() => setConfirming(true)} style={{ flex: 1 }} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Change start or goal"
          onPress={() => router.push(`/fast/${fast.id}`)}
          style={({ pressed }) => [
            styles.editBtn,
            { backgroundColor: c.surface2 },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Icon name="edit" color={c.text} />
        </Pressable>
      </View>

      {showCard && (
        <SafetyCard
          onDismiss={() =>
            void updateSettings({ safetyCardDismissedFor: [...settings.safetyCardDismissedFor, fast.id] })
          }
          onTurnOff={() => void updateSettings({ safetyCardDisabled: true })}
        />
      )}

      <SectionHeader action={<Badge label="likely, varies by person" tone="muted" />}>
        Along the way
      </SectionHeader>
      <Card>
        <MilestoneList marks={marks} elapsedHours={elapsedHours} start={fast.start} />
      </Card>
      <View style={[styles.note, { backgroundColor: c.surface2 }]}>
        <Icon name="info" size={18} color={c.textMuted} />
        <Text style={[font.sm, { color: c.textMuted, flex: 1 }]}>
          <Text style={{ fontWeight: '700', color: c.text }}>Autophagy. </Text>
          {AUTOPHAGY_NOTE}
        </Text>
      </View>
      <Text style={[font.xs, { color: c.textMuted, textAlign: 'center' }]}>
        Turn alerts for any of these on in Settings. Not medical advice.
      </Text>
      <ConfirmDialog
        visible={confirming}
        title={`End this fast at ${formatDuration(elapsed)}?`}
        message={`Started ${when(fast.start)}. You can change the times afterwards.`}
        confirmLabel="End fast"
        cancelLabel="Keep going"
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          onEnded(fast.id);
          void endFast();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  tilesScroll: { marginHorizontal: -20 },
  tiles: { gap: space[2], paddingHorizontal: 20, paddingVertical: 2 },
  tile: {
    width: 104,
    height: 96,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: space[3],
    justifyContent: 'flex-end',
    gap: 2,
  },
  tileTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    borderRadius: radius.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: space[2],
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space[4],
    paddingVertical: space[2],
  },
  amount: { flex: 1, paddingVertical: 0 },
  weekHead: { flexDirection: 'row', gap: space[4] },
  week: { flexDirection: 'row', gap: space[2], height: 92 },
  weekCol: { flex: 1, alignItems: 'center', gap: space[1] },
  weekTrack: { flex: 1, width: '100%', borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' },
  pair: { flexDirection: 'row', gap: space[3], alignItems: 'stretch' },
  endedHead: { flexDirection: 'row', gap: space[3] },
  hero: { gap: space[3], paddingVertical: space[6] },
  goalLine: {
    flexDirection: 'row',
    gap: space[2],
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: space[3],
  },
  editBtn: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  note: { flexDirection: 'row', gap: space[2], padding: space[4], borderRadius: 16 },
});
