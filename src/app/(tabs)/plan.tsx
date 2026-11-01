import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '../../components/Icon';
import { Body, Button, Card, Chip, ListGroup, ListRow, Screen, SectionHeader } from '../../components/ui';
import { type Goal, goalLabel } from '../../domain/fast';
import {
  countdownLabel,
  isDue,
  planName,
  type PlannedFast,
  upcomingPlans,
  weekAhead,
} from '../../domain/plan';
import { toggleWeekday } from '../../domain/settings';
import { tick } from '../../services/haptics';
import { useStore } from '../../state/store';
import { useNow } from '../../state/useNow';
import { bold, font, radius, space, strong, tabular, useColors } from '../../theme';

const time = (t: number) => new Date(t).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
const dayAndTime = (t: number) =>
  new Date(t).toLocaleString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
/** "Tue, Nov 10, 18:00": short enough for a list row next to its countdown. */
const shortDayAndTime = (t: number) =>
  new Date(t).toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
const weekdayLong = (t: number) => new Date(t).toLocaleDateString(undefined, { weekday: 'long' });
const weekdayShort = (t: number) => new Date(t).toLocaleDateString(undefined, { weekday: 'short' });

/** Looking ahead: your weekly rhythm, fasts you planned, and your presets one tap from starting. */
export default function PlanScreen() {
  const { presets, settings, running, startFast, updateSettings } = useStore();
  const c = useColors();
  const now = useNow(30_000);
  const plans = useMemo(() => upcomingPlans(settings.plannedFasts, now), [settings.plannedFasts, now]);
  const week = useMemo(
    () => weekAhead(settings.weekdayPresets, presets, plans, now),
    [settings.weekdayPresets, presets, plans, now],
  );
  const [picked, setPicked] = useState(0);
  const day = week[picked]!;
  const next = plans[0];
  const later = plans.slice(1);

  const start = async (goal: Goal | null, presetId: string | null, plan?: PlannedFast) => {
    if (running) return;
    await startFast(goal, presetId);
    if (plan) await updateSettings({ plannedFasts: settings.plannedFasts.filter((p) => p.id !== plan.id) });
    router.navigate('/');
  };

  const setRhythm = (presetId: string | null) => {
    const current = settings.weekdayPresets[day.weekday];
    if (presetId === null) {
      if (!current) return;
      const nextRhythm = { ...settings.weekdayPresets };
      delete nextRhythm[day.weekday];
      void updateSettings({ weekdayPresets: nextRhythm });
    } else if (current !== presetId) {
      void updateSettings({ weekdayPresets: toggleWeekday(settings.weekdayPresets, day.weekday, presetId) });
    }
  };

  const addPlan = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Plan a fast"
      onPress={() => router.push('/plan/new')}
      style={({ pressed }) => [
        styles.headerBtn,
        { backgroundColor: c.primary },
        pressed && { opacity: 0.75 },
      ]}
    >
      <Icon name="plus" color={c.onPrimary} />
    </Pressable>
  );

  return (
    <Screen title="Plan" right={addPlan}>
      {next ? (
        <Card tone={isDue(next, now) ? 'accent' : 'plain'} style={{ gap: space[3] }}>
          <View style={styles.rowCenter}>
            <Text style={[font.xs, styles.eyebrow, { color: c.textMuted, flex: 1 }]}>
              {isDue(next, now) ? 'PLANNED FOR NOW' : 'UP NEXT'}
            </Text>
            {next.remind ? <Icon name="bell" size={16} color={c.textMuted} /> : null}
          </View>
          <View style={{ gap: 2 }}>
            <Text style={[font['2xl'], strong, { color: c.text }]}>{planName(next, presets)}</Text>
            <Text style={[font.md, { color: c.textMuted }]}>{dayAndTime(next.at)}</Text>
          </View>
          <View style={[styles.pill, { backgroundColor: isDue(next, now) ? c.surface : c.accentSubtle }]}>
            <Text style={[font.sm, bold, tabular, { color: c.text }]}>
              Starts {countdownLabel(next, now)}
            </Text>
          </View>
          <View style={styles.buttons}>
            {running ? (
              <Body muted style={[font.sm, { flex: 1 }]}>
                Your current fast is still running. This plan waits.
              </Body>
            ) : (
              <Button
                label={isDue(next, now) ? 'Start now' : 'Start early'}
                variant={isDue(next, now) ? 'primary' : 'secondary'}
                size="sm"
                onPress={() => void start(next.goal, next.presetId, next)}
              />
            )}
            <Button label="Edit" size="sm" variant="ghost" onPress={() => router.push(`/plan/${next.id}`)} />
          </View>
        </Card>
      ) : (
        <Card style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: c.accentSubtle }]}>
            <Icon name="calendar" size={26} color={c.text} />
          </View>
          <Text style={[font.lg, strong, { color: c.text, textAlign: 'center' }]}>Nothing planned</Text>
          <Body muted style={{ textAlign: 'center', maxWidth: 290 }}>
            Put a long fast on the calendar, like 72 h from Friday evening. Nothing starts without you.
          </Body>
          <Button
            label="Plan a fast"
            variant="secondary"
            icon="plus"
            onPress={() => router.push('/plan/new')}
          />
        </Card>
      )}

      <SectionHeader>This week</SectionHeader>
      <Card style={{ gap: space[4] }}>
        <View style={styles.week} accessibilityRole="tablist">
          {week.map((d, i) => {
            const on = i === picked;
            return (
              <Pressable
                key={d.start}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${weekdayLong(d.start)}${d.preset ? `, ${d.preset.name}` : ''}${d.plans.length ? `, ${d.plans.length} planned` : ''}`}
                onPress={() => {
                  tick();
                  setPicked(i);
                }}
                style={[
                  styles.dayCell,
                  { backgroundColor: on ? c.primary : d.isToday ? c.accentSubtle : c.surface2 },
                ]}
              >
                <Text
                  style={[
                    font.xs,
                    { color: on ? c.onPrimary : c.textMuted, fontWeight: '600', fontSize: 11 },
                  ]}
                >
                  {weekdayShort(d.start)}
                </Text>
                <Text style={[font.md, bold, tabular, { color: on ? c.onPrimary : c.text }]}>
                  {new Date(d.start).getDate()}
                </Text>
                <View style={styles.marks}>
                  {d.preset ? (
                    <View style={[styles.dot, { backgroundColor: on ? c.onPrimary : c.accentStrong }]} />
                  ) : null}
                  {d.plans.length ? (
                    <View style={[styles.ringDot, { borderColor: on ? c.onPrimary : c.text }]} />
                  ) : null}
                  {!d.preset && !d.plans.length ? <View style={styles.dotSpace} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={{ gap: space[2] }}>
          <Text style={[font.md, bold, { color: c.text }]}>
            {day.isToday ? 'Today' : weekdayLong(day.start)}
          </Text>
          {day.plans.map((p) => (
            <Pressable
              key={p.id}
              accessibilityRole="button"
              onPress={() => router.push(`/plan/${p.id}`)}
              style={styles.rowCenter}
            >
              <View style={[styles.ringDot, { borderColor: c.text }]} />
              <Text style={[font.sm, { color: c.text, flex: 1 }]}>
                {planName(p, presets)} from {time(p.at)}
              </Text>
              <Icon name="chevron" size={16} color={c.textFaint} />
            </Pressable>
          ))}
          <Text style={[font.sm, { color: c.textMuted }]}>
            {presets.length === 0
              ? 'Save a preset to give each weekday its own fast. It is then picked for you on the Fast screen.'
              : `Every ${weekdayLong(day.start)}, the Fast screen picks:`}
          </Text>
          {presets.length > 0 && (
            <View style={styles.chips} accessibilityRole="radiogroup">
              <Chip label="Nothing" compact selected={!day.preset} onPress={() => setRhythm(null)} />
              {presets.map((p) => (
                <Chip
                  key={p.id}
                  label={p.name}
                  compact
                  selected={day.preset?.id === p.id}
                  onPress={() => setRhythm(p.id)}
                />
              ))}
            </View>
          )}
        </View>
        <View style={[styles.legend, { borderTopColor: c.border }]}>
          <View style={styles.rowCenter}>
            <View style={[styles.dot, { backgroundColor: c.accentStrong }]} />
            <Text style={[font.xs, { color: c.textMuted }]}>Weekly rhythm</Text>
          </View>
          <View style={styles.rowCenter}>
            <View style={[styles.ringDot, { borderColor: c.text }]} />
            <Text style={[font.xs, { color: c.textMuted }]}>Planned fast</Text>
          </View>
        </View>
      </Card>

      {later.length > 0 && (
        <>
          <SectionHeader>Later</SectionHeader>
          <ListGroup>
            {later.map((p) => (
              <ListRow
                key={p.id}
                icon={p.remind ? 'bell' : 'calendar'}
                label={planName(p, presets)}
                detail={shortDayAndTime(p.at)}
                value={countdownLabel(p, now)}
                chevron
                onPress={() => router.push(`/plan/${p.id}`)}
              />
            ))}
          </ListGroup>
        </>
      )}

      {presets.length > 0 && (
        <>
          <SectionHeader>Your presets</SectionHeader>
          <ListGroup footer={running ? 'Start is back once your current fast ends.' : undefined}>
            {presets.map((p) => (
              <ListRow
                key={p.id}
                label={p.name}
                detail={goalLabel(p.goal)}
                right={
                  <View style={styles.presetButtons}>
                    <Button
                      label="Plan"
                      size="sm"
                      variant="quiet"
                      accessibilityLabel={`Plan ${p.name}`}
                      onPress={() => router.push(`/plan/new?preset=${p.id}`)}
                    />
                    {!running && (
                      <Button
                        label="Start"
                        size="sm"
                        accessibilityLabel={`Start ${p.name} now`}
                        onPress={() => void start(p.goal, p.id)}
                      />
                    )}
                  </View>
                }
              />
            ))}
          </ListGroup>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  eyebrow: { fontWeight: '600', letterSpacing: 0.6 },
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: radius.xs,
    paddingHorizontal: space[3],
    paddingVertical: 6,
  },
  buttons: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  empty: { alignItems: 'center', paddingVertical: space[8], gap: space[3] },
  emptyIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  week: { flexDirection: 'row', gap: 6 },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: space[2],
    borderRadius: radius.md,
    minHeight: 72,
  },
  marks: { flexDirection: 'row', gap: 3, height: 8, alignItems: 'center', marginTop: 2 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  ringDot: { width: 8, height: 8, borderRadius: 4, borderWidth: 1.5 },
  dotSpace: { width: 7, height: 7 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  legend: {
    flexDirection: 'row',
    gap: space[4],
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: space[3],
  },
  presetButtons: { flexDirection: 'row', gap: space[2] },
});
