import { router } from 'expo-router';
import { type ReactNode, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BarChart, DayGrid, hoursTick, LineChart } from '../../components/charts';
import { BrandMark, Icon } from '../../components/Icon';
import { MonthCalendar } from '../../components/MonthCalendar';
import { Badge, Body, Button, Card, Screen, SectionHeader, Segmented, Title } from '../../components/ui';
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
import { bold, elevation, font, radius, space, strong, tabular, useColors } from '../../theme';

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
      style={({ pressed }) => [
        styles.headerBtn,
        { backgroundColor: c.primary },
        pressed && { opacity: 0.75 },
      ]}
    >
      <Icon name="plus" color={c.onPrimary} />
    </Pressable>
  );

  if (fasts.length === 0) {
    return (
      <Screen title="History" right={addPast}>
        <Card style={styles.empty}>
          <BrandMark size={40} color={c.textMuted} />
          <Title size="lg" style={{ textAlign: 'center' }}>
            Nothing here yet
          </Title>
          <Body muted style={{ textAlign: 'center' }}>
            Your fasts will show up as days on a calendar, with charts once there are a few.
          </Body>
          <Button label="Add a past fast" variant="secondary" onPress={() => router.push('/fast/new')} />
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
      <View style={styles.tiles}>
        <Tile
          label="This month"
          value={`${Math.round(recs.hoursThisMonth)}`}
          unit="hours"
          hint={`${fastsThisMonth} ${fastsThisMonth === 1 ? 'fast' : 'fasts'}`}
        />
        <Tile
          label="Average fast"
          value={avg ? formatShort(avg * 3_600_000) : '–'}
          hint={`Last ${range === 365 ? 'year' : `${range} days`}`}
        />
        <Tile
          label="Longest ever"
          value={recs.longest ? formatShort(elapsedMs(recs.longest, now)) : '–'}
          hint={recs.longest ? shortDate(recs.longest.start) : undefined}
        />
        <Tile
          label="Streak"
          value={`${streak}`}
          unit={streak === 1 ? 'day' : 'days'}
          hint={`Best ${recs.longestStreakDays}, at ${settings.streakMinHours}h or more`}
        />
      </View>

      <Card>
        <MonthCalendar
          month={shownMonth}
          hoursByDay={byDay}
          onChangeMonth={(delta) => setMonthOffset((m) => Math.max(0, m - delta))}
          canGoForward={monthOffset > 0}
          now={now}
        />
      </Card>

      <View style={styles.legend}>
        <LegendCell color={c.accentStrong} label="12h or more" />
        <LegendCell color={c.accentSubtle} label="Shorter" />
        <LegendCell color="transparent" label="No fast" />
      </View>

      <SectionHeader>Insights</SectionHeader>
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
          averageLabel="Dashed line: average. Hatched bars ended before their goal."
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
            <Icon name="heart" color={c.text} />
            <Body style={[font.sm, { flex: 1 }]}>
              Add a weight in Settings, or turn on Health sync, to see this chart.
            </Body>
            <Icon name="chevron" size={18} color={c.text} />
          </Pressable>
        ) : (
          <LineChart
            points={weights.map((w) => ({ t: w.at, v: w.kg }))}
            spans={fasts.map((f) => ({ start: f.start, end: f.end ?? now }))}
            spansLabel="Shaded: when you were fasting"
          />
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
          <Text style={[font.sm, { color: c.textMuted, paddingHorizontal: space[1] }]}>{month}</Text>
          <View style={[styles.list, { backgroundColor: c.surface, shadowColor: c.shadow, ...elevation }]}>
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
          <Text accessibilityRole="header" style={[font.lg, strong, { color: c.text }]}>
            {title}
          </Text>
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
      <View
        style={[styles.dateBlock, running ? { backgroundColor: c.primary } : { backgroundColor: c.surface2 }]}
      >
        <Text style={[font.md, bold, tabular, { color: running ? c.onPrimary : c.text }]}>{d.getDate()}</Text>
        <Text style={[font.xs, { color: running ? c.onPrimary : c.textMuted, fontSize: 11 }]}>
          {d.toLocaleDateString(undefined, { weekday: 'short' })}
        </Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[font.md, bold, tabular, { color: c.text }]}>
          {formatDuration(elapsedMs(fast, now))}
        </Text>
        <Text numberOfLines={1} style={[font.xs, { color: c.textMuted }]}>
          {dayTime(fast.start)} → {running ? 'now' : dayTime(fast.end!)}
          {fast.note ? ` · ${fast.note}` : ''}
        </Text>
      </View>
      {running ? <Badge label="Running" /> : met ? <Badge label="Goal met" tone="muted" /> : null}
      <Icon name="chevron" size={16} color={c.textFaint} />
    </Pressable>
  );
}

function Tile({ label, value, unit, hint }: { label: string; value: string; unit?: string; hint?: string }) {
  const c = useColors();
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}${unit ? ` ${unit}` : ''}${hint ? `. ${hint}` : ''}`}
      style={[styles.tile, { backgroundColor: c.surface, shadowColor: c.shadow, ...elevation }]}
    >
      <Text style={[font.xs, { color: c.textMuted, fontWeight: '600' }]}>{label}</Text>
      <Text numberOfLines={1} adjustsFontSizeToFit style={[font['2xl'], strong, tabular, { color: c.text }]}>
        {value}
        {unit ? <Text style={[font.md, { color: c.textMuted, fontWeight: '600' }]}> {unit}</Text> : null}
      </Text>
      {hint ? <Text style={[font.xs, { color: c.textMuted }]}>{hint}</Text> : null}
    </View>
  );
}

function LegendCell({ color, label }: { color: string; label: string }) {
  const c = useColors();
  return (
    <View style={styles.legendItem}>
      <View
        style={[
          styles.legendSwatch,
          { backgroundColor: color, borderWidth: StyleSheet.hairlineWidth, borderColor: c.borderInput },
        ]}
      />
      <Text style={[font.xs, { color: c.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: space[3] },
  tile: {
    flexGrow: 1,
    flexBasis: '45%',
    borderRadius: radius.lg,
    padding: space[4],
    gap: 2,
  },
  legend: { flexDirection: 'row', gap: space[4], paddingHorizontal: space[1] },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendSwatch: { width: 14, height: 14, borderRadius: 7 },
  empty: { alignItems: 'center', paddingVertical: space[10], gap: space[3] },
  chartHead: { flexDirection: 'row', alignItems: 'flex-start', gap: space[2] },
  cta: { flexDirection: 'row', alignItems: 'center', gap: space[3], paddingVertical: space[2] },
  list: { borderRadius: radius.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: space[3], padding: space[3], minHeight: 68 },
  dateBlock: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
