import { type ReactNode, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { BodySignals } from '../components/BodySignals';
import { BarChart, DayGrid, hoursTick, LineChart } from '../components/charts';
import { Icon } from '../components/Icon';
import { Body, Card, GroupLabel, Segmented } from '../components/ui';
import {
  averageHours,
  bmi,
  dayKey,
  fastLengths,
  HEALTHY_BMI,
  hoursByDay,
  hoursPerWeek,
  startHours,
} from '../domain/stats';
import { DAY, formatDuration, formatShort } from '../domain/time';
import { useStore } from '../state/store';
import { useNow } from '../state/useNow';
import { font, layout, space, strong, tabular, useColors } from '../theme';

const shortDate = (t: number) =>
  new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

type Range = 30 | 90 | 365;

/** Every chart, one tap in from History, so History itself stays a calendar and a list. */
export default function Insights() {
  const { fasts, weights, heights, settings } = useStore();
  const c = useColors();
  const now = useNow(60_000);
  const [range, setRange] = useState<Range>(30);
  const byDay = useMemo(() => hoursByDay(fasts, now), [fasts, now]);
  const lengths = useMemo(() => fastLengths(fasts, range, now), [fasts, range, now]);
  const weeks = useMemo(() => hoursPerWeek(fasts, 12, now), [fasts, now]);
  const starts = useMemo(() => startHours(fasts, now - range * DAY), [fasts, range, now]);
  const avg = averageHours(fasts, now - range * DAY);
  const height = heights.at(-1)?.m ?? null;
  const latestWeight = weights.at(-1);
  const firstWeight = weights[0];
  const thisWeek = weeks.at(-1)?.hours ?? 0;
  const weekAvg = weeks.length ? weeks.reduce((n, w) => n + w.hours, 0) / weeks.length : 0;
  const busiest = starts.reduce((best, n, h) => (n > (starts[best] ?? 0) ? h : best), 0);
  const fastedDays = Array.from({ length: 30 }, (_, i) => byDay.get(dayKey(now - i * DAY)) ?? 0).filter(
    (h) => h > 0,
  ).length;
  const rangeWords = range === 365 ? 'the last year' : `the last ${range} days`;
  const weightChange =
    latestWeight && firstWeight && firstWeight !== latestWeight ? latestWeight.kg - firstWeight.kg : null;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={styles.page}>
      <Segmented<Range>
        value={range}
        onChange={setRange}
        options={[
          { value: 30, label: '30 days' },
          { value: 90, label: '90 days' },
          { value: 365, label: 'Year' },
        ]}
      />

      <ChartCard
        label="Fast length"
        headline={avg ? formatShort(avg * 3_600_000) : '–'}
        caption={`Average over ${rangeWords}`}
      >
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

      <ChartCard
        label="Hours per week"
        headline={`${Math.round(thisWeek)}h`}
        caption={`This week · ${Math.round(weekAvg)}h a week over 12 weeks`}
      >
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

      <ChartCard
        label="Rhythm"
        headline={`${fastedDays} of 30 days`}
        caption="Days with a fast this past month · one square per day"
      >
        <DayGrid hoursByDay={byDay} now={now} />
      </ChartCard>

      <ChartCard
        label="Start time"
        headline={starts.some((n) => n > 0) ? `Around ${String(busiest).padStart(2, '0')}:00` : '–'}
        caption={`When most fasts began in ${rangeWords}`}
      >
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
        label="Weight"
        headline={latestWeight ? `${latestWeight.kg.toFixed(1)} kg` : '–'}
        caption={
          weightChange !== null
            ? `${weightChange >= 0 ? '+' : ''}${weightChange.toFixed(1)} kg since ${shortDate(firstWeight!.at)}`
            : 'Shaded areas are your fasts'
        }
      >
        {weights.length === 0 ? (
          <Pressable onPress={() => router.push('/settings/health')} style={styles.cta}>
            <Icon name="heart" color={c.text} />
            <Body style={[font.sm, { flex: 1 }]}>
              Add a weight, or turn on Health sync, to see this chart.
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
          label="BMI"
          headline={(bmi(latestWeight!.kg, height) ?? 0).toFixed(1)}
          caption={`At ${Math.round(height * 100)} cm`}
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
          <GroupLabel>Body signals</GroupLabel>
          <BodySignals fasts={fasts} now={now} />
        </>
      )}
    </ScrollView>
  );
}

/** A label, the one number that matters, a plain line under it, then the chart. */
function ChartCard({
  label,
  headline,
  caption,
  children,
}: {
  label: string;
  headline: string;
  caption?: string;
  children: ReactNode;
}) {
  const c = useColors();
  return (
    <Card>
      <View accessible accessibilityLabel={`${label}: ${headline}. ${caption ?? ''}`} style={{ gap: 2 }}>
        <Text style={[font.xs, styles.label, { color: c.textMuted }]}>{label.toUpperCase()}</Text>
        <Text accessibilityRole="header" style={[font['2xl'], strong, tabular, { color: c.text }]}>
          {headline}
        </Text>
        {caption ? <Text style={[font.sm, { color: c.textMuted }]}>{caption}</Text> : null}
      </View>
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  page: { padding: layout.gutter, gap: space[4], paddingBottom: space[12] },
  label: { fontWeight: '600', letterSpacing: 0.6 },
  cta: { flexDirection: 'row', alignItems: 'center', gap: space[3], paddingVertical: space[2] },
});
