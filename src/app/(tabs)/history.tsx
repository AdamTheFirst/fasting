import { router } from 'expo-router';
import { type ReactNode, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { BodySignals } from '../../components/BodySignals';
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
  hoursInRange,
  hoursPerWeek,
  records,
  startHours,
  streaks,
} from '../../domain/stats';
import { DAY, formatDuration, formatShort, HOUR } from '../../domain/time';
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
  const prevMonth = new Date(new Date(now).getFullYear(), new Date(now).getMonth() - 1, 1);
  const fastsThisMonth = fasts.filter((f) => f.start >= monthStart).length;
  const hoursLastMonth = hoursInRange(fasts, prevMonth.getTime(), monthStart, now);
  const avg30 = averageHours(fasts, now - 30 * DAY);

  // Tapping a day opens the longest fast that touched it.
  const openDay = (key: string) => {
    const [y, m, d] = key.split('-').map(Number);
    const from = new Date(y!, m! - 1, d!).getTime();
    const to = new Date(y!, m! - 1, d! + 1).getTime();
    const hit = fasts
      .filter((f) => f.start < to && (f.end ?? now) > from)
      .sort((a, b) => elapsedMs(b, now) - elapsedMs(a, now))[0];
    if (hit) router.push(`/fast/${hit.id}`);
  };

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
          <BrandMark size={64} color={c.text} accent={c.accentStrong} />
          <Title size="xl" style={{ textAlign: 'center', marginTop: space[2] }}>
            Your fasts gather here
          </Title>
          <Body muted style={{ textAlign: 'center', maxWidth: 300 }}>
            Each day gets a ring that fills with the hours you fasted. Charts appear once there are a few.
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
      <Summary
        hours={recs.hoursThisMonth}
        fastCount={fastsThisMonth}
        lastMonthHours={hoursLastMonth}
        lastMonthName={prevMonth.toLocaleDateString(undefined, { month: 'long' })}
        stats={[
          { label: 'Average', value: avg30 ? formatShort(avg30 * HOUR) : '–', hint: 'Last 30 days' },
          {
            label: 'Longest',
            value: recs.longest ? formatShort(elapsedMs(recs.longest, now)) : '–',
            hint: recs.longest ? shortDate(recs.longest.start) : undefined,
          },
          {
            label: 'Streak',
            value: `${streak} ${streak === 1 ? 'day' : 'days'}`,
            hint: `Best ${recs.longestStreakDays}`,
          },
        ]}
      />

      <Card>
        <MonthCalendar
          month={shownMonth}
          hoursByDay={byDay}
          onPressDay={openDay}
          onChangeMonth={(delta) => setMonthOffset((m) => Math.max(0, m - delta))}
          canGoForward={monthOffset > 0}
          now={now}
        />
        <View style={[styles.legend, { borderTopColor: c.border }]}>
          <LegendRing p={0.5} label="12 hours" />
          <LegendRing p={1} label="Whole day" />
          <Text style={[font.xs, { color: c.textMuted, flex: 1, textAlign: 'right' }]}>Tap a day to open it</Text>
        </View>
      </Card>

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
          averageLabel="Average · hatched bars ended before their goal"
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

      {settings.healthSignals && (
        <>
          <SectionHeader>Body signals</SectionHeader>
          <BodySignals fasts={fasts} now={now} />
        </>
      )}

      <SectionHeader>All fasts</SectionHeader>
      {[...groups].map(([month, list]) => (
        <View key={month} style={{ gap: space[2] }}>
          <Text style={[font.xs, styles.eyebrow, { color: c.textMuted, paddingHorizontal: space[1] }]}>
            {month.toUpperCase()}
          </Text>
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
          <Text accessibilityRole="header" style={[font.md, bold, { color: c.text, letterSpacing: -0.2 }]}>
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
      accessibilityLabel={`${formatDuration(elapsedMs(fast, now))}, started ${dayTime(fast.start)}${running ? ', running' : met ? ', goal met' : ''}`}
      onPress={() => router.push(`/fast/${fast.id}`)}
      style={({ pressed }) => [
        styles.row,
        !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
        pressed && { backgroundColor: c.surface2 },
      ]}
    >
      <View
        style={[
          styles.dateBlock,
          { backgroundColor: running ? c.primary : met ? c.accentSubtle : c.surface2 },
        ]}
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
      {running ? (
        <Badge label="Running" />
      ) : met ? (
        <View accessibilityLabel="Goal met" style={[styles.met, { backgroundColor: c.accentStrong }]}>
          <Icon name="check" size={14} color={c.onAccent} />
        </View>
      ) : null}
      <Icon name="chevron" size={16} color={c.textFaint} />
    </Pressable>
  );
}

function Summary({
  hours,
  fastCount,
  lastMonthHours,
  lastMonthName,
  stats,
}: {
  hours: number;
  fastCount: number;
  lastMonthHours: number;
  lastMonthName: string;
  stats: { label: string; value: string; hint?: string }[];
}) {
  const c = useColors();
  const diff = Math.round(hours - lastMonthHours);
  const compare =
    lastMonthHours <= 0
      ? null
      : diff === 0
        ? `Level with ${lastMonthName}`
        : `${Math.abs(diff)}h ${diff > 0 ? 'more' : 'less'} than ${lastMonthName}`;
  const fastsLine = `${fastCount} ${fastCount === 1 ? 'fast' : 'fasts'}`;
  return (
    <Card style={{ gap: space[4] }}>
      <View
        accessible
        accessibilityLabel={`This month: ${Math.round(hours)} hours fasted, ${fastsLine}${compare ? `. ${compare}` : ''}`}
        style={{ gap: 2 }}
      >
        <Text style={[font.xs, styles.eyebrow, { color: c.textMuted }]}>THIS MONTH</Text>
        <Text style={[font.display, strong, tabular, { color: c.text, letterSpacing: -1.2 }]}>
          {Math.round(hours)}
          <Text style={[font.lg, { color: c.textMuted, fontWeight: '600', letterSpacing: 0 }]}> hours</Text>
        </Text>
        <View style={styles.summaryLine}>
          <Text style={[font.sm, { color: c.textMuted }]}>{fastsLine}</Text>
          {compare ? (
            <View style={[styles.pill, { backgroundColor: diff >= 0 ? c.accentSubtle : c.surface2 }]}>
              <Text style={[font.xs, tabular, { color: c.text, fontWeight: '600' }]}>{compare}</Text>
            </View>
          ) : null}
        </View>
      </View>
      <View style={[styles.statRow, { borderTopColor: c.border }]}>
        {stats.map((st, i) => (
          <View
            key={st.label}
            accessible
            accessibilityLabel={`${st.label}: ${st.value}${st.hint ? `. ${st.hint}` : ''}`}
            style={[
              styles.statCell,
              i === 0 && { paddingLeft: 0 },
              i > 0 && { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: c.border },
            ]}
          >
            <Text style={[font.xs, { color: c.textMuted, fontWeight: '600' }]}>{st.label}</Text>
            <Text numberOfLines={1} adjustsFontSizeToFit style={[font.xl, strong, tabular, { color: c.text }]}>
              {st.value}
            </Text>
            {st.hint ? (
              <Text numberOfLines={1} style={[font.xs, { color: c.textMuted }]}>
                {st.hint}
              </Text>
            ) : null}
          </View>
        ))}
      </View>
    </Card>
  );
}

function LegendRing({ p, label }: { p: number; label: string }) {
  const c = useColors();
  const size = 16;
  const stroke = 2.5;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <View style={styles.legendItem}>
      <Svg width={size} height={size}>
        {p >= 1 ? (
          <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={c.accentStrong} />
        ) : (
          <>
            <Circle cx={size / 2} cy={size / 2} r={r} stroke={c.surface2} strokeWidth={stroke} fill="none" />
            <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke={c.accentStrong}
                strokeWidth={stroke}
                strokeDasharray={`${circ * p} ${circ}`}
                fill="none"
              />
            </G>
          </>
        )}
      </Svg>
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
  eyebrow: { fontWeight: '600', letterSpacing: 0.6 },
  summaryLine: { flexDirection: 'row', alignItems: 'center', gap: space[2], flexWrap: 'wrap', marginTop: 2 },
  pill: { borderRadius: radius.full, paddingHorizontal: space[2], paddingVertical: 3 },
  statRow: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: space[4],
  },
  statCell: { flex: 1, paddingHorizontal: space[3], gap: 2 },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: space[3],
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  empty: { alignItems: 'center', paddingVertical: space[10], gap: space[3] },
  chartHead: { flexDirection: 'row', alignItems: 'flex-start', gap: space[2] },
  cta: { flexDirection: 'row', alignItems: 'center', gap: space[3], paddingVertical: space[2] },
  list: { borderRadius: radius.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: space[3], padding: space[3], minHeight: 68 },
  met: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  dateBlock: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
