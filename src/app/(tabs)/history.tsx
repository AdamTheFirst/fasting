import { router } from 'expo-router';
import { type ReactNode, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BarChart, DayGrid, hoursTick, LineChart } from '../../components/charts';
import { BrandMark, Icon } from '../../components/Icon';
import { MonthCalendar } from '../../components/MonthCalendar';
import {
  Badge,
  Body,
  Button,
  Card,
  Screen,
  SectionHeader,
  Segmented,
  Stat,
  Title,
} from '../../components/ui';
import { elapsedMs, type Fast, goalReachedAt } from '../../domain/fast';
import {
  averageHours,
  bmi,
  fastLengths,
  HEALTHY_BMI,
  hoursByDay,
  hoursPerWeek,
  records,
  startHours,
  streaks,
} from '../../domain/stats';
import { DAY, formatDuration, formatShort } from '../../domain/time';
import { useStore } from '../../state/store';
import { useNow } from '../../state/useNow';
import { font, radius, serif, space, tabular, useColors } from '../../theme';

const shortDate = (t: number) =>
  new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
const dayTime = (t: number) =>
  new Date(t).toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' });

type Range = 30 | 90 | 365;

export default function HistoryScreen() {
  const { fasts, weights, heights, settings } = useStore();
  const c = useColors();
  const now = useNow(60_000);
  const [range, setRange] = useState<Range>(30);
  // Months back from the current one: 0 is this month.
  const [monthOffset, setMonthOffset] = useState(0);
  const shownMonth = new Date(new Date(now).getFullYear(), new Date(now).getMonth() - monthOffset, 1);

  const byDay = useMemo(() => hoursByDay(fasts, now), [fasts, now]);
  const lengths = useMemo(() => fastLengths(fasts, range, now), [fasts, range, now]);
  const weeks = useMemo(() => hoursPerWeek(fasts, 12, now), [fasts, now]);
  const starts = useMemo(() => startHours(fasts, now - range * DAY), [fasts, range, now]);
  const avg = averageHours(fasts, now - range * DAY);
  const recs = useMemo(
    () => records(fasts, settings.streakMinHours, now),
    [fasts, settings.streakMinHours, now],
  );
  const streak = streaks(fasts, settings.streakMinHours, now).current;
  const height = heights.at(-1)?.m ?? null;
  const latestWeight = weights.at(-1);
  const firstWeight = weights[0];
  const monthStart = new Date(new Date(now).getFullYear(), new Date(now).getMonth(), 1).getTime();
  const fastsThisMonth = fasts.filter((f) => f.start >= monthStart).length;

  const addPast = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Add a past fast"
      onPress={() => router.push('/fast/new')}
      style={[styles.headerBtn, { backgroundColor: c.accentSubtle }]}
    >
      <Icon name="plus" color={c.accent} />
    </Pressable>
  );

  if (fasts.length === 0) {
    return (
      <Screen title="History" right={addPast}>
        <Card style={styles.empty}>
          <BrandMark size={40} color={c.accentSoft} />
          <Title size="lg" style={{ textAlign: 'center' }}>
            Nothing here yet
          </Title>
          <Body muted style={{ textAlign: 'center' }}>
            Your fasts will show up as days on a calendar, with charts once there are a few.
          </Body>
          <Button
            label="Add a past fast"
            icon="plus"
            variant="quiet"
            onPress={() => router.push('/fast/new')}
          />
        </Card>
      </Screen>
    );
  }

  // Newest first, grouped by month.
  const groups = new Map<string, Fast[]>();
  for (const f of [...fasts].sort((a, b) => b.start - a.start)) {
    const k = new Date(f.start).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    groups.set(k, [...(groups.get(k) ?? []), f]);
  }

  return (
    <Screen title="History" right={addPast}>
      <Card tone="hero" style={{ gap: space[4] }}>
        <View>
          <Text style={[font.xs, { color: c.onHeroMuted, fontWeight: '700', letterSpacing: 0.8 }]}>
            THIS MONTH
          </Text>
          <Text style={[font.display, tabular, { color: c.onHero, fontFamily: serif, fontWeight: '600' }]}>
            {Math.round(recs.hoursThisMonth)}
            <Text style={[font.lg, { color: c.onHeroMuted }]}> hours fasted</Text>
          </Text>
        </View>
        <View style={styles.statRow}>
          <Stat label="Fasts" value={`${fastsThisMonth}`} color={c.onHero} mutedColor={c.onHeroMuted} />
          <Stat
            label="Longest ever"
            value={recs.longest ? formatShort(elapsedMs(recs.longest, now)) : '–'}
            color={c.onHero}
            mutedColor={c.onHeroMuted}
          />
          <Stat
            label="Streak"
            value={`${streak}d`}
            hint={`best ${recs.longestStreakDays}d`}
            color={c.onHero}
            mutedColor={c.onHeroMuted}
          />
        </View>
        <Text style={[font.xs, { color: c.onHeroMuted }]}>
          {Math.round(recs.hoursThisYear)} hours this year. A day counts toward a streak after{' '}
          {settings.streakMinHours}h.
        </Text>
      </Card>

      <Card>
        <MonthCalendar
          month={shownMonth}
          hoursByDay={byDay}
          onChangeMonth={(delta) => setMonthOffset((m) => Math.max(0, m - delta))}
          canGoForward={monthOffset > 0}
          now={now}
        />
      </Card>

      <SectionHeader>Charts</SectionHeader>
      <Segmented<Range>
        value={range}
        onChange={setRange}
        options={[
          { value: 30, label: '30 days' },
          { value: 90, label: '90 days' },
          { value: 365, label: 'Year' },
        ]}
      />

      <ChartCard title="Fast lengths" subtitle={avg ? `Average ${formatShort(avg * 3_600_000)}` : undefined}>
        <BarChart
          bars={lengths.map((l) => ({
            key: l.id,
            value: l.hours,
            label: shortDate(l.start),
            strong: l.goalHours === null || l.hours >= l.goalHours,
            detail: `${shortDate(l.start)} · ${formatDuration(l.hours * 3_600_000)}${
              l.goalHours !== null ? (l.hours >= l.goalHours ? ' · goal met' : ' · ended before goal') : ''
            }`,
          }))}
          tick={hoursTick}
          dayAxis
          average={avg}
          averageLabel="Average length. Soft bars ended before their goal."
          maxBarWidth={22}
        />
      </ChartCard>

      <ChartCard title="Hours per week" subtitle="Last 12 weeks">
        <BarChart
          bars={weeks.map((w) => ({
            key: String(w.weekStart),
            value: w.hours,
            label: shortDate(w.weekStart),
            detail: `Week of ${shortDate(w.weekStart)} · ${Math.round(w.hours)}h`,
          }))}
          tick={(v) => `${Math.round(v)}h`}
        />
      </ChartCard>

      <ChartCard title="Your rhythm" subtitle="Last 26 weeks, one square per day">
        <DayGrid hoursByDay={byDay} now={now} />
      </ChartCard>

      <ChartCard title="When you start" subtitle="Fasts started, by hour of day">
        <BarChart
          bars={starts.map((n, h) => ({
            key: String(h),
            value: n,
            label: h % 6 === 0 ? `${String(h).padStart(2, '0')}:00` : undefined,
            detail: `${String(h).padStart(2, '0')}:00 to ${String(h).padStart(2, '0')}:59 · ${n} ${n === 1 ? 'fast' : 'fasts'}`,
          }))}
          tick={(v) => `${Math.round(v)}`}
          integer
          height={110}
        />
      </ChartCard>

      <ChartCard
        title="Weight"
        subtitle={
          latestWeight
            ? `${latestWeight.kg.toFixed(1)} kg${
                firstWeight && firstWeight !== latestWeight
                  ? ` · ${latestWeight.kg - firstWeight.kg >= 0 ? '+' : ''}${(latestWeight.kg - firstWeight.kg).toFixed(1)} since ${shortDate(firstWeight.at)}`
                  : ''
              }`
            : undefined
        }
        right={settings.healthSyncEnabled ? <Badge label="Health sync on" /> : undefined}
      >
        {weights.length === 0 ? (
          <Pressable onPress={() => router.push('/settings')} style={styles.cta}>
            <Icon name="heart" color={c.accent} />
            <Body style={[font.sm, { flex: 1 }]}>
              Add a weight in Settings, or turn on Health sync, to see this chart.
            </Body>
            <Icon name="chevron" size={18} color={c.textFaint} />
          </Pressable>
        ) : (
          <LineChart points={weights.map((w) => ({ t: w.at, v: w.kg }))} />
        )}
      </ChartCard>

      {settings.showBmi && height && weights.length > 0 && (
        <ChartCard
          title="BMI"
          subtitle={`${(bmi(latestWeight!.kg, height) ?? 0).toFixed(1)} now · height ${Math.round(height * 100)} cm`}
        >
          <LineChart
            points={weights.map((w) => ({ t: w.at, v: bmi(w.kg, height) ?? 0 }))}
            format={(v) => v.toFixed(1)}
            band={HEALTHY_BMI}
            bandLabel={`${HEALTHY_BMI.min} to ${HEALTHY_BMI.max}, the usual adult range`}
          />
        </ChartCard>
      )}

      <SectionHeader>All fasts</SectionHeader>
      {[...groups].map(([month, list]) => (
        <View key={month} style={{ gap: space[2] }}>
          <Text style={[font.sm, { color: c.textMuted, fontWeight: '600', paddingHorizontal: space[1] }]}>
            {month}
          </Text>
          <View style={[styles.list, { backgroundColor: c.surface, borderColor: c.border }]}>
            {list.map((f, i) => (
              <FastRow key={f.id} fast={f} now={now} first={i === 0} />
            ))}
          </View>
        </View>
      ))}
    </Screen>
  );
}

function ChartCard({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  const c = useColors();
  return (
    <Card>
      <View style={styles.chartHead}>
        <View style={{ flex: 1 }}>
          <Title size="lg">{title}</Title>
          {subtitle ? <Text style={[font.sm, tabular, { color: c.textMuted }]}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
      {children}
    </Card>
  );
}

function FastRow({ fast, now, first }: { fast: Fast; now: number; first: boolean }) {
  const c = useColors();
  const goalAt = goalReachedAt(fast);
  const running = fast.end === null;
  const met = goalAt !== null && (fast.end ?? now) >= goalAt;
  const d = new Date(fast.start);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${formatDuration(elapsedMs(fast, now))}, started ${dayTime(fast.start)}${running ? ', running' : ''}`}
      onPress={() => router.push(`/fast/${fast.id}`)}
      style={({ pressed }) => [
        styles.row,
        !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
        pressed && { backgroundColor: c.surface2 },
      ]}
    >
      <View style={[styles.dateBlock, { backgroundColor: running ? c.accent : c.surface2 }]}>
        <Text
          style={[font.lg, { color: running ? c.onAccent : c.text, fontFamily: serif, fontWeight: '700' }]}
        >
          {d.getDate()}
        </Text>
        <Text
          style={[font.xs, { color: running ? c.onAccent : c.textMuted, fontSize: 10, fontWeight: '700' }]}
        >
          {d.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase()}
        </Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[font.lg, tabular, { color: c.text, fontWeight: '600' }]}>
          {formatDuration(elapsedMs(fast, now))}
        </Text>
        <Text numberOfLines={1} style={[font.xs, { color: c.textMuted }]}>
          {dayTime(fast.start)} → {running ? 'now' : dayTime(fast.end!)}
          {fast.note ? ` · ${fast.note}` : ''}
        </Text>
      </View>
      {running ? (
        <Badge label="Running" />
      ) : met ? (
        <View style={[styles.met, { backgroundColor: c.milestoneSubtle }]}>
          <Icon name="check" size={14} color={c.milestone} />
        </View>
      ) : null}
      <Icon name="chevron" size={16} color={c.textFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: space[10], gap: space[3] },
  statRow: { flexDirection: 'row', gap: space[3] },
  chartHead: { flexDirection: 'row', alignItems: 'flex-start', gap: space[2] },
  cta: { flexDirection: 'row', alignItems: 'center', gap: space[3], paddingVertical: space[2] },
  list: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space[3], padding: space[3], minHeight: 68 },
  dateBlock: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  met: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
