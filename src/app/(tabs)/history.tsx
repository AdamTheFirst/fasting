import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { BarChart, LineChart } from 'react-native-gifted-charts';

import { MonthCalendar } from '../../components/MonthCalendar';
import { Body, Card, Chip, SectionHeader } from '../../components/ui';
import { elapsedMs } from '../../domain/fast';
import { bmi, fastLengths, HEALTHY_BMI, hoursByDay, hoursPerWeek, records } from '../../domain/stats';
import { formatDuration } from '../../domain/time';
import { useStore } from '../../state/store';
import { useNow } from '../../state/useNow';
import { font, layout, space, useColors } from '../../theme';

const shortDate = (t: number) =>
  new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

export default function HistoryScreen() {
  const { fasts, weights, heights, settings } = useStore();
  const c = useColors();
  const now = useNow(60_000);
  const [range, setRange] = useState<30 | 90>(30);
  // Months back from the current one: 0 is this month.
  const [monthOffset, setMonthOffset] = useState(0);
  const shownMonth = new Date(new Date(now).getFullYear(), new Date(now).getMonth() - monthOffset, 1);

  const byDay = useMemo(() => hoursByDay(fasts, now), [fasts, now]);
  const lengths = useMemo(() => fastLengths(fasts, range, now), [fasts, range, now]);
  const weeks = useMemo(() => hoursPerWeek(fasts, 8, now), [fasts, now]);
  const recs = useMemo(
    () => records(fasts, settings.streakMinHours, now),
    [fasts, settings.streakMinHours, now],
  );
  const height = heights.at(-1)?.m ?? null;

  if (fasts.length === 0) {
    return (
      <View style={styles.screen}>
        <Body muted>Nothing here yet. Your fasts will show up as days on this calendar.</Body>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <MonthCalendar
        month={shownMonth}
        hoursByDay={byDay}
        onChangeMonth={(delta) => setMonthOffset((m) => Math.max(0, m - delta))}
        canGoForward={monthOffset > 0}
      />

      <SectionHeader>Records</SectionHeader>
      <View style={styles.records}>
        <View style={styles.record}>
          <Card>
            <Body muted style={font.xs}>
              Longest fast
            </Body>
            <Body style={font.lg}>{recs.longest ? formatDuration(elapsedMs(recs.longest, now)) : '-'}</Body>
          </Card>
        </View>
        <View style={styles.record}>
          <Card>
            <Body muted style={font.xs}>
              Longest streak
            </Body>
            <Body style={font.lg}>{recs.longestStreakDays}d</Body>
          </Card>
        </View>
        <View style={styles.record}>
          <Card>
            <Body muted style={font.xs}>
              This month
            </Body>
            <Body style={font.lg}>{Math.round(recs.hoursThisMonth)}h</Body>
          </Card>
        </View>
        <View style={styles.record}>
          <Card>
            <Body muted style={font.xs}>
              This year
            </Body>
            <Body style={font.lg}>{Math.round(recs.hoursThisYear)}h</Body>
          </Card>
        </View>
      </View>

      <SectionHeader>Fast lengths</SectionHeader>
      <View style={styles.row}>
        <Chip label="30 days" selected={range === 30} onPress={() => setRange(30)} />
        <Chip label="90 days" selected={range === 90} onPress={() => setRange(90)} />
      </View>
      <BarChart
        data={lengths.map((l) => ({
          value: l.hours,
          label: shortDate(l.start),
          frontColor: l.goalHours !== null && l.hours >= l.goalHours ? c.accent : c.textMuted,
          onPress: () => router.push(`/fast/${l.id}`),
        }))}
        barWidth={18}
        spacing={10}
        noOfSections={4}
        yAxisLabelSuffix="h"
        yAxisTextStyle={{ color: c.textMuted }}
        xAxisLabelTextStyle={{ color: c.textMuted, fontSize: 10 }}
        rulesColor={c.border}
        xAxisColor={c.border}
        yAxisColor={c.border}
      />

      <SectionHeader>Hours per week</SectionHeader>
      <BarChart
        data={weeks.map((w) => ({ value: w.hours, label: shortDate(w.weekStart), frontColor: c.accent }))}
        barWidth={22}
        spacing={12}
        noOfSections={4}
        yAxisTextStyle={{ color: c.textMuted }}
        xAxisLabelTextStyle={{ color: c.textMuted, fontSize: 10 }}
        rulesColor={c.border}
        xAxisColor={c.border}
        yAxisColor={c.border}
      />

      <SectionHeader>Weight</SectionHeader>
      {weights.length === 0 ? (
        <Pressable onPress={() => router.push('/settings')}>
          <Body muted>Add a weight in Settings, or turn on Health sync, to see this chart.</Body>
        </Pressable>
      ) : (
        <LineChart
          data={weights.map((w) => ({ value: w.kg, label: shortDate(w.at) }))}
          color={c.accent}
          dataPointsColor={c.accent}
          yAxisLabelSuffix="kg"
          yAxisTextStyle={{ color: c.textMuted }}
          xAxisLabelTextStyle={{ color: c.textMuted, fontSize: 10 }}
          rulesColor={c.border}
          xAxisColor={c.border}
          yAxisColor={c.border}
          yAxisOffset={Math.floor(Math.min(...weights.map((w) => w.kg)) - 2)}
        />
      )}

      {settings.showBmi && height && weights.length > 0 && (
        <>
          <SectionHeader>BMI</SectionHeader>
          <LineChart
            data={weights.map((w) => ({ value: bmi(w.kg, height) ?? 0, label: shortDate(w.at) }))}
            color={c.accent}
            showReferenceLine1
            referenceLine1Position={HEALTHY_BMI.min}
            showReferenceLine2
            referenceLine2Position={HEALTHY_BMI.max}
            yAxisTextStyle={{ color: c.textMuted }}
            xAxisLabelTextStyle={{ color: c.textMuted, fontSize: 10 }}
          />
        </>
      )}

      <SectionHeader>All fasts</SectionHeader>
      {fasts.map((f) => (
        <Pressable
          key={f.id}
          accessibilityRole="button"
          onPress={() => router.push(`/fast/${f.id}`)}
          style={[styles.fastRow, { borderBottomColor: c.border }]}
        >
          <Body style={font.sm}>
            {shortDate(f.start)}
            {f.end ? ` to ${shortDate(f.end)}` : ' · Running'}
          </Body>
          <Body style={[font.lg, { fontWeight: '600', fontVariant: ['tabular-nums'] }]}>
            {formatDuration(elapsedMs(f, now))}
          </Body>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: layout.gutter, gap: space[3] },
  row: { flexDirection: 'row', gap: space[2], flexWrap: 'wrap' },
  records: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  record: { flexBasis: '45%', flexGrow: 1 },
  fastRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
