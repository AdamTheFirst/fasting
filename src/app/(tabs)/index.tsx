import { router } from 'expo-router';
import { type ReactNode, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ConfirmDialog } from '../../components/ConfirmDialog';
import { DateTimeField } from '../../components/DateTimeField';
import { FastDial } from '../../components/FastDial';
import { FastNotesCard, PastYouCard } from '../../components/FastNotes';
import { BrandMark, Icon } from '../../components/Icon';
import { MilestoneBanner, useJustPassed } from '../../components/MilestoneBanner';
import { MilestoneList } from '../../components/MilestoneList';
import { SafetyCard } from '../../components/SafetyCard';
import { Body, Button, Card, Screen, SectionHeader, Segmented, Title } from '../../components/ui';
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
import { noteFromPastYou } from '../../domain/notes';
import { phaseAt, type PhaseKey } from '../../domain/phases';
import { shouldShowSafetyCard } from '../../domain/safety';
import { presetForToday } from '../../domain/settings';
import { longestFast } from '../../domain/stats';
import { DAY, formatDuration, formatElapsed, formatShort, HOUR } from '../../domain/time';
import { tick } from '../../services/haptics';
import { useStore } from '../../state/store';
import { useNow } from '../../state/useNow';
import {
  bold,
  elevation,
  font,
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
  const { loaded, running, settings, updateSettings } = useStore();
  const [justEndedId, setJustEndedId] = useState<string | null>(null);
  if (!loaded) return null;
  if (!settings.adultConfirmed) {
    return <AdultGate onConfirm={() => void updateSettings({ adultConfirmed: true })} />;
  }
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

  const last = fasts.filter((f) => f.end !== null).sort((a, b) => b.end! - a.end!)[0];

  const plannedEnd = goal ? (goal.kind === 'until' ? goal.at : now + goal.ms) : null;

  return (
    <Screen
      title="Today"
      eyebrow={new Date(now).toLocaleDateString(undefined, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })}
    >
      {justEnded && (
        <EndedCard
          fast={justEnded}
          previousBestMs={previousBest(fasts, now, justEnded.id)}
          onSavePreset={() => void saveEndedAsPreset()}
          onDismiss={clearJustEnded}
        />
      )}

      <Card style={styles.hero}>
        <FastDial progress={null}>
          <GoalCenter goal={goal} />
        </FastDial>
        <View style={[styles.factRow, { borderTopColor: c.border }]}>
          <Fact label="Start" value="Now" />
          <View style={[styles.factDivider, { backgroundColor: c.border }]} />
          <Fact
            label={plannedEnd ? 'Ends around' : 'Ends'}
            value={plannedEnd ? when(plannedEnd) : 'When you choose'}
          />
        </View>
      </Card>

      <SectionHeader>Goal</SectionHeader>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        accessibilityRole="radiogroup"
        style={styles.tilesScroll}
        contentContainerStyle={styles.tiles}
      >
        {choices.map((ch) => (
          <GoalTile
            key={ch.key}
            label={ch.label}
            goal={ch.goal}
            today={ch.presetId !== null && ch.presetId === todays}
            selected={ch.key === selectedKey}
            onPress={() => setPicked(ch.key)}
          />
        ))}
        <GoalTile label="Custom" custom selected={isCustom} onPress={() => setPicked(CUSTOM)} />
      </ScrollView>

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
            <View style={[styles.amountWrap, { backgroundColor: c.surface2 }]}>
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

      <Button
        label={startLabel(goal)}
        size="lg"
        block
        disabled={isCustom && !customGoal}
        onPress={() => void startFast(goal, presetId)}
      />
      {last ? (
        <Text style={[font.xs, { color: c.textMuted, textAlign: 'center' }]}>
          Last fast {formatShort(elapsedMs(last, now))}, ended{' '}
          {new Date(last.end!).toLocaleDateString(undefined, { weekday: 'long' })}
        </Text>
      ) : null}
    </Screen>
  );
}

const goalParts = (goal: Goal | null) => /^(\d+(?:\.\d+)?) (hours|days)$/.exec(goalWords(goal));

/** "Start 16 hour fast", "Start fasting": the button says what will happen. */
function startLabel(goal: Goal | null): string {
  const m = goalParts(goal);
  if (m) return `Start ${m[1]} ${m[2] === 'hours' ? 'hour' : 'day'} fast`;
  return 'Start fasting';
}

/** The goal in the middle of an idle dial: "16 hours", "3 days", or open. */
function GoalCenter({ goal }: { goal: Goal | null }) {
  const c = useColors();
  const words = goalWords(goal);
  const m = goalParts(goal);
  return (
    <View style={{ alignItems: 'center', gap: 2 }} accessible accessibilityLabel={`Goal: ${words}`}>
      <Text style={[font.xs, styles.kicker, { color: c.textMuted }]}>{goal ? 'GOAL' : 'NO END TIME'}</Text>
      {m ? (
        <Text style={[font.timer, strong, tabular, { color: c.text, letterSpacing: -2 }]}>
          {m[1]}
          <Text style={[font.xl, { color: c.textMuted, letterSpacing: 0, fontWeight: '600' }]}> {m[2]}</Text>
        </Text>
      ) : (
        <Text
          adjustsFontSizeToFit
          numberOfLines={2}
          style={[font['2xl'], strong, { color: c.text, textAlign: 'center' }]}
        >
          {words}
        </Text>
      )}
      <Text style={[font.sm, { color: c.textMuted, textAlign: 'center' }]}>
        {goal ? 'No upper limit' : 'Stop whenever you like'}
      </Text>
    </View>
  );
}

/** A label over a value, in a card's fact row. */
function Fact({ label, value }: { label: string; value: string }) {
  const c = useColors();
  return (
    <View style={{ flex: 1, gap: 2 }} accessible accessibilityLabel={`${label}: ${value}`}>
      <Text style={[font.xs, medium, { color: c.textMuted }]}>{label}</Text>
      <Text numberOfLines={1} adjustsFontSizeToFit style={[font.md, bold, tabular, { color: c.text }]}>
        {value}
      </Text>
    </View>
  );
}

/** A square goal choice: the number big, the unit small. */
function GoalTile({
  label,
  goal = null,
  today,
  custom,
  selected,
  onPress,
}: {
  label: string;
  goal?: Goal | null;
  today?: boolean;
  custom?: boolean;
  selected: boolean;
  onPress: () => void;
}) {
  const c = useColors();
  const fg = selected ? c.onPrimary : c.text;
  const sub = selected ? c.onPrimary : c.textMuted;
  const m = custom ? null : goalParts(goal);
  let big: ReactNode;
  let small: string;
  if (custom) {
    big = <Icon name="plus" size={26} color={fg} />;
    small = 'Custom';
  } else if (!goal) {
    big = <Text style={[font['2xl'], strong, { color: fg }]}>∞</Text>;
    small = 'Open';
  } else if (m) {
    big = <Text style={[font['2xl'], strong, tabular, { color: fg }]}>{m[1]}</Text>;
    small = m[2] ?? '';
  } else {
    big = (
      <Text numberOfLines={1} adjustsFontSizeToFit style={[font.md, bold, { color: fg }]}>
        {label}
      </Text>
    );
    small = 'Preset';
  }
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={`${custom ? 'Custom goal' : label}${today ? ', today' : ''}`}
      accessibilityState={{ selected }}
      onPress={() => {
        tick();
        onPress();
      }}
      style={({ pressed }) => [
        styles.tile,
        selected
          ? { backgroundColor: c.primary }
          : {
              backgroundColor: c.surface,
              ...elevation,
              shadowColor: c.shadow,
              borderWidth: 1,
              borderColor: c.borderInput,
            },
        pressed && { transform: [{ scale: 0.96 }] },
      ]}
    >
      <View style={styles.tileBig}>{big}</View>
      <Text style={[font.xs, medium, { color: sub }]}>{small}</Text>
      {today ? <View style={[styles.todayDot, { backgroundColor: selected ? c.accent : c.period }]} /> : null}
    </Pressable>
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
        borderRadius: size / 2,
        backgroundColor: phaseColor(c, phase),
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
        <Button
          label="Edit"
          icon="edit"
          size="sm"
          variant="secondary"
          onPress={() => router.push(`/fast/${fast.id}`)}
        />
      </View>
    </Card>
  );
}

function RunningFast({ fast, onEnded }: { fast: Fast; onEnded: (id: string) => void }) {
  const { fasts, settings, endFast, updateSettings, saveFast } = useStore();
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
  // The ring is the goal; open-ended fasts go round once a day.
  const ringHours = goalH ?? 24;
  const lapStart = goalH ? 0 : Math.floor(elapsedHours / 24) * 24;
  const ring = {
    progress: goalH ? elapsedHours / goalH : (elapsedHours - lapStart) / 24,
    marks: marks
      .filter((m) => m.hours > lapStart && m.hours < lapStart + ringHours)
      .map((m) => ({ at: (m.hours - lapStart) / ringHours, passed: m.passed })),
  };

  const [pastHiddenFor, setPastHiddenFor] = useState<string | null>(null);
  const past = settings.showPastNotes && pastHiddenFor !== fast.id ? noteFromPastYou(fast, fasts, now) : null;

  const showCard = shouldShowSafetyCard(fast, now, {
    disabled: settings.safetyCardDisabled,
    dismissedFastIds: settings.safetyCardDismissedFor,
  });

  // Under a day the seconds tick, set smaller so the hours and minutes stay the headline.
  const [, timerMain = '', timerSeconds] = /^(.*?)(?: (\d+s))?$/.exec(formatElapsed(elapsed)) ?? [];

  return (
    <Screen title={elapsed >= DAY ? `Day ${day}` : 'Fasting'} eyebrow={`Since ${when(fast.start)}`}>
      {justPassed && <MilestoneBanner mark={justPassed} onClose={closeBanner} />}

      <Card style={styles.hero}>
        <FastDial progress={ring.progress} marks={ring.marks}>
          <View
            style={{ alignItems: 'center', gap: 2 }}
            accessible
            accessibilityLabel={`Fasting ${formatElapsed(elapsed)}`}
          >
            <Text style={[font.xs, styles.kicker, { color: c.textMuted }]}>
              {goalAt && now >= goalAt
                ? 'GOAL REACHED'
                : goalH
                  ? `${goalWords(fast.goal)} goal`.toUpperCase()
                  : 'OPEN-ENDED'}
            </Text>
            <Text
              adjustsFontSizeToFit
              numberOfLines={1}
              style={[font.timer, strong, tabular, { color: c.text, letterSpacing: -2 }]}
            >
              {timerMain}
            </Text>
            <Text style={[font.sm, tabular, { color: c.textMuted }]}>
              {timerSeconds ? `${timerSeconds} · ` : ''}
              {goalAt && now < goalAt ? `${formatShort(goalAt - now)} to go` : `day ${day}`}
            </Text>
          </View>
        </FastDial>
        <View style={[styles.phasePill, { backgroundColor: c.surface2 }]}>
          <PhaseSwatch phase={phase.key} size={10} />
          <Text style={[font.sm, bold, { color: c.text }]}>{phase.label}</Text>
          <Text style={[font.xs, { color: c.textMuted }]}>likely phase now</Text>
        </View>
      </Card>

      <Button label="End fast" size="lg" block onPress={() => setConfirming(true)} />
      <Button
        label="Change start or goal"
        icon="edit"
        variant="secondary"
        block
        onPress={() => router.push(`/fast/${fast.id}`)}
      />

      {next ? (
        <Card style={styles.nextCard}>
          <View
            style={[
              styles.nextIcon,
              {
                backgroundColor: next.kind === 'goal' ? c.accent : phaseColor(c, phaseAt(next.hours).key),
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

      {past && <PastYouCard past={past} onHide={() => setPastHiddenFor(fast.id)} />}
      <FastNotesCard fast={fast} onSave={(f) => void saveFast(f)} />

      <SectionHeader>Along the way</SectionHeader>
      <Card style={{ paddingVertical: space[1] }}>
        <MilestoneList marks={marks} elapsedHours={elapsedHours} start={fast.start} />
      </Card>
      <Text style={[font.xs, { color: c.textMuted, textAlign: 'center', paddingHorizontal: space[4] }]}>
        Phases are likely and vary by person. {AUTOPHAGY_NOTE} Fastaway is not a medical device.
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

/** First launch only: one tap that says you're an adult. No questions, no account; one flag on the phone. */
function AdultGate({ onConfirm }: { onConfirm: () => void }) {
  const c = useColors();
  return (
    <Screen title="Welcome" scroll={false}>
      <Card style={{ alignItems: 'center', gap: space[4], paddingVertical: space[8] }}>
        <BrandMark size={44} color={c.text} accent={c.accentStrong} />
        <Title size="xl" style={{ textAlign: 'center' }}>
          Fastaway is for adults
        </Title>
        <Text style={[font.md, { color: c.textMuted, textAlign: 'center' }]}>
          It tracks fasts of any length. If you&apos;re under 18, please talk to a doctor before fasting.
        </Text>
        <Button label="I'm 18 or older" size="lg" block onPress={onConfirm} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: space[5], paddingTop: space[6], paddingBottom: space[5], alignItems: 'stretch' },
  kicker: { fontWeight: '700', letterSpacing: 1.2 },
  factRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: space[4],
  },
  factDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch' },
  phasePill: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    borderRadius: radius.full,
    paddingHorizontal: space[4],
    paddingVertical: space[2],
  },
  phaseRow: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2], alignItems: 'center' },
  rowBetween: { flexDirection: 'row', gap: space[3], alignItems: 'center' },
  tilesScroll: { marginHorizontal: -20, marginVertical: -space[3] },
  tiles: { gap: space[3], paddingHorizontal: 20, paddingVertical: space[3] },
  tile: {
    width: 84,
    height: 92,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tileBig: { height: 36, justifyContent: 'center', alignItems: 'center', paddingHorizontal: space[2] },
  todayDot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4 },
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: space[2],
    borderRadius: radius.md,
    paddingHorizontal: space[4],
    paddingVertical: space[2],
  },
  amount: { flex: 1, paddingVertical: 0 },
  week: { flexDirection: 'row', justifyContent: 'space-between' },
  weekCol: { alignItems: 'center', gap: space[2], flex: 1 },
  barTrack: {
    width: 26,
    height: 84,
    borderRadius: 13,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: { width: '100%', borderRadius: 13 },
  dayLetter: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  nextCard: { flexDirection: 'row', gap: space[3], alignItems: 'flex-start' },
  nextIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: { flexDirection: 'row', gap: space[2], padding: space[4] },
});
