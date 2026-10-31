import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ConfirmDialog } from '../../components/ConfirmDialog';
import { DateTimeField } from '../../components/DateTimeField';
import { HourStrip } from '../../components/HourStrip';
import { Icon } from '../../components/Icon';
import { MilestoneBanner, useJustPassed } from '../../components/MilestoneBanner';
import { MilestoneList } from '../../components/MilestoneList';
import { SafetyCard } from '../../components/SafetyCard';
import {
  Badge,
  Body,
  Button,
  Card,
  Chip,
  Screen,
  SectionHeader,
  Segmented,
  Stat,
  Title,
} from '../../components/ui';
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
import { phaseAt, type PhaseKey } from '../../domain/phases';
import { shouldShowSafetyCard } from '../../domain/safety';
import { presetForToday } from '../../domain/settings';
import { dayKey, hoursByDay, hoursInRange, longestFast, startOfLocalWeek, streaks } from '../../domain/stats';
import { DAY, formatDuration, formatElapsed, formatShort, HOUR } from '../../domain/time';
import { useStore } from '../../state/store';
import { useNow } from '../../state/useNow';
import {
  bold,
  font,
  inkBorder,
  medium,
  phaseColor,
  radius,
  space,
  strong,
  tabular,
  useColors,
} from '../../theme';

const CUSTOM = 'custom';

type CustomKind = GoalUnit | 'until';

const when = (t: number) =>
  new Date(t).toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' });

const goalHoursOf = (goal: Goal | null, start: number) =>
  goal === null ? null : (goal.kind === 'duration' ? goal.ms : goal.at - start) / HOUR;

/** "16 hours", "3 days", "Open-ended": the goal in words for the dial. */
function goalWords(goal: Goal | null): string {
  if (!goal) return 'Open-ended';
  if (goal.kind === 'until') return goalLabel(goal).replace(/^until/, 'Until');
  const h = goal.ms / HOUR;
  if (h >= 48 && h % 24 === 0) return `${h / 24} days`;
  return `${Math.round(h * 10) / 10} hours`;
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
      label: g.label,
      goal: g.goal,
      presetId: null as string | null,
    })),
    ...presets.map((p) => ({ key: p.id, label: p.name, goal: p.goal, presetId: p.id as string | null })),
  ];
  // Today's rhythm preset goes first so the selected pill is always in view.
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
        date: d.getDate(),
        hours: byDay.get(dayKey(d.getTime())) ?? 0,
        today: dayKey(d.getTime()) === dayKey(now),
        future: d.getTime() > now,
      };
    });
  }, [fasts, now]);
  const weekHours = hoursInRange(fasts, startOfLocalWeek(now), now, now);
  const streak = streaks(fasts, settings.streakMinHours, now).current;
  const last = fasts.filter((f) => f.end !== null).sort((a, b) => b.end! - a.end!)[0];
  const goalH = goal ? goalHoursOf(goal, now) : null;

  const plannedEnd = goal ? (goal.kind === 'until' ? goal.at : now + goal.ms) : null;

  return (
    <Screen title="Today" right={<HeaderDate now={now} />}>
      {justEnded && (
        <EndedCard
          fast={justEnded}
          previousBestMs={previousBest(fasts, now, justEnded.id)}
          onSavePreset={() => void saveEndedAsPreset()}
          onDismiss={clearJustEnded}
        />
      )}

      <Card style={styles.hero}>
        <View style={styles.headline}>
          <Text
            adjustsFontSizeToFit
            numberOfLines={1}
            style={[font.display, strong, tabular, { color: c.text, flexShrink: 1 }]}
          >
            {goalWords(goal)}
          </Text>
          <Text style={[font.md, { color: c.textMuted }]}>{goal ? 'goal' : ''}</Text>
        </View>
        <HourStrip elapsedHours={null} goalHours={goalH} />
        <View style={styles.planRow}>
          <Badge label={goal ? 'Plan' : 'Open'} tone="estimate" />
          <Text style={[font.sm, { color: c.text, flex: 1 }]}>
            {plannedEnd
              ? `Ends around ${when(plannedEnd)} if you start now`
              : 'No end time. Stop when you choose.'}
          </Text>
        </View>
        {last ? (
          <Text style={[font.xs, { color: c.textMuted }]}>
            Last fast {formatShort(elapsedMs(last, now))}, ended{' '}
            {new Date(last.end!).toLocaleDateString(undefined, { weekday: 'long' })}
          </Text>
        ) : null}
      </Card>

      <Button
        label="Start fasting"
        size="lg"
        block
        disabled={isCustom && !customGoal}
        onPress={() => void startFast(goal, presetId)}
      />

      <SectionHeader>Goal</SectionHeader>
      <View style={styles.row} accessibilityRole="radiogroup">
        {choices.map((ch) => (
          <Chip
            key={ch.key}
            label={ch.presetId && ch.presetId === todays ? `${ch.label} · today` : ch.label}
            selected={ch.key === selectedKey}
            onPress={() => setPicked(ch.key)}
          />
        ))}
        <Chip label="Custom" selected={isCustom} onPress={() => setPicked(CUSTOM)} />
      </View>

      {isCustom && (
        <Card>
          <Segmented
            options={[
              { value: 'hours', label: 'Hours' },
              { value: 'days', label: 'Days' },
              { value: 'until', label: 'Until' },
            ]}
            value={customKind}
            onChange={(v) => setCustomKind(v as CustomKind)}
          />
          {customKind === 'until' ? (
            <DateTimeField label="Fast until" value={customUntil} onChange={setCustomUntil} future />
          ) : (
            <View style={[styles.amountWrap, { borderColor: c.borderInput, backgroundColor: c.surface }]}>
              <TextInput
                accessibilityLabel={`Goal in ${customKind}`}
                placeholder={customKind === 'hours' ? '36' : '5'}
                placeholderTextColor={c.textFaint}
                keyboardType="decimal-pad"
                value={customAmount}
                onChangeText={setCustomAmount}
                style={[font['2xl'], strong, styles.amount, { color: c.text }]}
              />
              <Text style={[font.md, { color: c.textMuted }]}>{customKind}</Text>
            </View>
          )}
          <View style={styles.rowBetween}>
            <Body muted style={[font.sm, { flex: 1 }]}>
              {customGoal ? `${goalLabel(customGoal)}. No upper limit.` : 'Any length you like.'}
            </Body>
            {customGoal?.kind === 'duration' && (
              <Button
                label="Save preset"
                icon="plus"
                size="sm"
                variant="secondary"
                onPress={() => void saveCustomPreset()}
              />
            )}
          </View>
        </Card>
      )}

      <SectionHeader
        action={
          <Pressable accessibilityRole="link" onPress={() => router.push('/history')} hitSlop={8}>
            <Text key={c.text} style={[font.sm, { color: c.text, textDecorationLine: 'underline' }]}>
              History
            </Text>
          </Pressable>
        }
      >
        This week
      </SectionHeader>
      <Card>
        <WeekCells days={week} />
        <View style={styles.weekStats}>
          <Stat label="Fasted this week" value={`${Math.round(weekHours)}`} unit="hours" />
          <Stat
            label={`Streak at ${settings.streakMinHours}h or more`}
            value={`${streak}`}
            unit={streak === 1 ? 'day' : 'days'}
          />
        </View>
      </Card>

      <Button label="Log a past fast" variant="secondary" block onPress={() => router.push('/fast/new')} />
      <Text style={[font.xs, { color: c.textMuted, textAlign: 'center' }]}>
        No account, no ads, no tracking. Your data stays on this phone.
      </Text>
    </Screen>
  );
}

function HeaderDate({ now }: { now: number }) {
  const c = useColors();
  return (
    <Text style={[font.sm, { color: c.textMuted, paddingBottom: 6 }]}>
      {new Date(now).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
    </Text>
  );
}

/** The week as rounded day cells, like Periodiary's calendar: fasted days solid, today ringed. */
function WeekCells({
  days,
}: {
  days: { letter: string; date: number; hours: number; today: boolean; future: boolean }[];
}) {
  const c = useColors();
  return (
    <View style={styles.week}>
      {days.map((d, i) => {
        const fasted = d.hours >= 1;
        return (
          <View
            key={i}
            style={styles.weekCol}
            accessible
            accessibilityLabel={`${d.letter} ${d.date}: ${Math.round(d.hours)} hours${d.today ? ', today' : ''}`}
          >
            <Text style={[font.xs, { color: c.textMuted }]}>{d.letter}</Text>
            <View
              style={[
                styles.dayCell,
                { backgroundColor: fasted ? c.period : d.future ? 'transparent' : c.surface2 },
                d.today && { borderWidth: inkBorder, borderColor: c.text },
              ]}
            >
              <Text
                style={[
                  font.sm,
                  medium,
                  tabular,
                  { color: fasted ? c.onPeriod : d.future ? c.textMuted : c.text },
                ]}
              >
                {d.date}
              </Text>
            </View>
            <Text style={[font.xs, tabular, { color: c.textMuted }]}>
              {fasted ? `${Math.round(d.hours)}h` : ' '}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/** A small square in the phase's colour, outlined in ink so the pastel never carries meaning alone. */
function PhaseSwatch({ phase, size = 14 }: { phase: PhaseKey; size?: number }) {
  const c = useColors();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 3.5,
        backgroundColor: phaseColor(c, phase),
        borderWidth: 1.5,
        borderColor: c.text,
      }}
    />
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
  const phase = phaseAt(ms / HOUR);
  return (
    <Card>
      <View style={styles.rowBetween}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[font.sm, { color: c.textMuted }]}>Fast logged</Text>
          <Title size="2xl" style={tabular}>
            {formatDuration(ms)}
          </Title>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Dismiss" hitSlop={12} onPress={onDismiss}>
          <Icon name="close" color={c.textMuted} />
        </Pressable>
      </View>
      <View style={styles.phaseRow}>
        <PhaseSwatch phase={phase.key} />
        <Text style={[font.sm, { color: c.text, flex: 1 }]}>
          Reached {phase.label.toLowerCase()}. {note}
        </Text>
      </View>
      <View style={styles.row}>
        <Button label="Save as preset" icon="plus" size="sm" onPress={onSavePreset} />
        <Button label="Edit" size="sm" variant="ghost" onPress={() => router.push(`/fast/${fast.id}`)} />
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
  const [confirming, setConfirming] = useState(false);
  const goalAt = goalReachedAt(fast);
  const goalH = goalHoursOf(fast.goal, fast.start);
  const day = Math.floor(elapsed / DAY) + 1;
  const phase = phaseAt(elapsedHours);
  const next = marks.find((m) => !m.passed);

  const showCard = shouldShowSafetyCard(fast, now, {
    disabled: settings.safetyCardDisabled,
    dismissedFastIds: settings.safetyCardDismissedFor,
  });

  // Under a day the seconds tick, set smaller so the hours and minutes stay the headline.
  const [, timerMain = '', timerSeconds] = /^(.*?)(?: (\d+s))?$/.exec(formatElapsed(elapsed)) ?? [];

  const goalLine = goalAt
    ? now >= goalAt
      ? `Goal reached ${when(goalAt)}. Everything now is extra.`
      : `Done around ${when(goalAt)}, ${formatShort(goalAt - now)} to go`
    : 'Open-ended. Stop when you choose.';

  return (
    <Screen title={elapsed >= DAY ? `Day ${day}` : 'Fasting'} eyebrow={`Since ${when(fast.start)}`}>
      {justPassed && <MilestoneBanner mark={justPassed} onClose={closeBanner} />}

      <Card style={styles.hero}>
        <View style={styles.headline} accessible accessibilityLabel={`Fasting ${formatElapsed(elapsed)}`}>
          <Text
            adjustsFontSizeToFit
            numberOfLines={1}
            style={[font.display, strong, tabular, { color: c.text }]}
          >
            {timerMain}
          </Text>
          {timerSeconds ? (
            <Text style={[font.md, tabular, { color: c.textMuted, width: 34 }]}>{timerSeconds}</Text>
          ) : null}
          <Text style={[font.md, { color: c.textMuted }]}>
            {goalH ? `of ${goalWords(fast.goal).replace(/^Until /, 'until ')}` : 'fasted'}
          </Text>
        </View>
        <HourStrip elapsedHours={elapsedHours} goalHours={goalH} />
        <View style={styles.planRow}>
          <Badge
            label={goalAt && now >= goalAt ? 'Done' : 'Goal'}
            tone={goalAt && now >= goalAt ? 'accent' : 'estimate'}
          />
          <Text style={[font.sm, { color: c.text, flex: 1 }]}>{goalLine}</Text>
        </View>
        <View style={[styles.phaseRow, styles.phaseNow, { borderTopColor: c.border }]}>
          <PhaseSwatch phase={phase.key} />
          <Text style={[font.sm, { color: c.text, flex: 1 }]}>
            <Text style={bold}>{phase.label}</Text>
            <Text style={{ color: c.textMuted }}> · likely phase right now</Text>
          </Text>
        </View>
      </Card>

      <Button label="End fast" size="lg" block onPress={() => setConfirming(true)} />
      <Button
        label="Change start or goal"
        variant="ghost"
        size="sm"
        onPress={() => router.push(`/fast/${fast.id}`)}
      />

      {next ? (
        <Card style={styles.nextCard}>
          <View
            style={[
              styles.nextIcon,
              {
                backgroundColor: next.kind === 'goal' ? c.accent : phaseColor(c, phaseAt(next.hours).key),
                borderColor: c.text,
              },
            ]}
          >
            <Icon
              name={next.kind === 'goal' ? 'flag' : next.kind === 'best' ? 'trophy' : 'fast'}
              size={18}
              color={c.onAccent}
            />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[font.xs, { color: c.textMuted }]}>
              {next.hours - elapsedHours < 1 / 60
                ? 'Next, any moment'
                : `Next, in ${formatShort((next.hours - elapsedHours) * HOUR)}`}
            </Text>
            <Text style={[font.md, bold, { color: c.text }]}>{next.title}</Text>
            <Text style={[font.sm, { color: c.textMuted }]}>{next.body}</Text>
          </View>
        </Card>
      ) : null}

      {showCard && (
        <SafetyCard
          onDismiss={() =>
            void updateSettings({ safetyCardDismissedFor: [...settings.safetyCardDismissedFor, fast.id] })
          }
          onTurnOff={() => void updateSettings({ safetyCardDisabled: true })}
        />
      )}

      <SectionHeader>Along the way</SectionHeader>
      <Card style={{ paddingVertical: space[1] }}>
        <MilestoneList marks={marks} elapsedHours={elapsedHours} start={fast.start} />
      </Card>
      <Card tone="flat" style={styles.note}>
        <Icon name="info" size={18} color={c.textMuted} />
        <Text style={[font.sm, { color: c.textMuted, flex: 1 }]}>
          <Text style={[bold, { color: c.text }]}>Autophagy. </Text>
          {AUTOPHAGY_NOTE}
        </Text>
      </Card>
      <Text style={[font.xs, { color: c.textMuted, textAlign: 'center' }]}>
        Phases are likely and vary by person. Fastaway is not a medical device.
      </Text>

      <ConfirmDialog
        visible={confirming}
        title={`End at ${formatDuration(elapsed)}?`}
        message={`You reached ${phase.label.toLowerCase()}. You can change the times afterwards.`}
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
  hero: { gap: space[4], paddingVertical: space[5] },
  headline: { flexDirection: 'row', alignItems: 'baseline', gap: space[2], flexWrap: 'wrap' },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  phaseRow: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  phaseNow: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: space[3] },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2], alignItems: 'center' },
  rowBetween: { flexDirection: 'row', gap: space[3], alignItems: 'center' },
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: space[2],
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: space[4],
    paddingVertical: space[2],
  },
  amount: { flex: 1, paddingVertical: 0 },
  weekStats: { flexDirection: 'row', gap: space[4] },
  week: { flexDirection: 'row', justifyContent: 'space-between' },
  weekCol: { alignItems: 'center', gap: 6, flex: 1 },
  dayCell: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextCard: { flexDirection: 'row', gap: space[3], alignItems: 'flex-start' },
  nextIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: { flexDirection: 'row', gap: space[2], padding: space[4] },
});
