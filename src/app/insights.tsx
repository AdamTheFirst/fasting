import { type ReactNode, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { BodySignals } from '../components/BodySignals';
import { BarChart, DayGrid, hoursTick, LineChart } from '../components/charts';
import { Icon } from '../components/Icon';
import { Badge, Body, Card, GroupLabel, Segmented } from '../components/ui';
import {
  averageHours,
  bmi,
  fastLengths,
  HEALTHY_BMI,
  hoursByDay,
  hoursPerWeek,
  startHours,
} from '../domain/stats';
import { DAY, formatDuration, formatShort } from '../domain/time';
import { useStore } from '../state/store';
import { useNow } from '../state/useNow';
import { bold, font, layout, space, tabular, useColors } from '../theme';

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
          <GroupLabel>Body signals</GroupLabel>
          <BodySignals fasts={fasts} now={now} />
        </>
      )}
    </ScrollView>
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

const styles = StyleSheet.create({
  page: { padding: layout.gutter, gap: space[4], paddingBottom: space[12] },
  chartHead: { flexDirection: 'row', alignItems: 'flex-start', gap: space[2] },
  cta: { flexDirection: 'row', alignItems: 'center', gap: space[3], paddingVertical: space[2] },
});
