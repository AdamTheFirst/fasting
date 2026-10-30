import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { type Fast, goalReachedAt } from '../domain/fast';
import { DAY, formatElapsed, formatSpoken } from '../domain/time';
import { font, layout, useColors } from '../theme';

/**
 * Not a countdown. The inner arc fills once per 24 h and the day count steps up,
 * so an open-ended 9-day fast reads as naturally as a 16 h one. The thin outer
 * arc shows goal progress only when a goal exists, and keeps counting past it.
 */
export function DayRing({ fast, now }: { fast: Fast; now: number }) {
  const c = useColors();
  const elapsed = Math.max(0, now - fast.start);
  const size = layout.ringDiameter;
  const stroke = layout.ringStroke;
  const r = (size - stroke) / 2 - 10;
  const circumference = 2 * Math.PI * r;
  const dayFraction = (elapsed % DAY) / DAY;
  const goalAt = goalReachedAt(fast);
  const goalFraction = goalAt ? Math.min(1, elapsed / (goalAt - fast.start)) : null;
  const goalR = r + stroke / 2 + 8;
  const goalC = 2 * Math.PI * goalR;
  const spoken = `Fasting ${formatSpoken(elapsed)}.${
    goalAt ? (now >= goalAt ? ' Goal reached.' : ` ${formatSpoken(goalAt - now)} to goal.`) : ''
  }`;

  return (
    <View accessible accessibilityLabel={spoken} style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={c.ringTrack} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={c.accent}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference * dayFraction} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        {goalFraction !== null && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={goalR}
            stroke={c.accent}
            strokeOpacity={0.5}
            strokeWidth={4}
            fill="none"
            strokeDasharray={`${goalC * goalFraction} ${goalC}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
      </Svg>
      <View style={styles.center}>
        <Text style={[font.xl, styles.number, { color: c.text }]}>{formatElapsed(elapsed)}</Text>
        <Text style={[font.xs, { color: c.textMuted, fontWeight: '500' }]}>
          {elapsed >= DAY ? `Day ${Math.floor(elapsed / DAY) + 1}` : 'Fasting'}
          {goalAt && now >= goalAt ? ' · Goal reached' : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  number: { fontWeight: '600', fontVariant: ['tabular-nums'] },
});
