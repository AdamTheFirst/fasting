import { useState } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import type { TimelineMark } from '../domain/milestones';
import { font, tabular } from '../theme';

const H = 56;
const Y = 26;

/**
 * Days, not rings: the fast as a line running toward the horizon. One tick per day,
 * a dot for each milestone, a flag for the goal, and a bright point for now.
 * The scale grows with the fast, so a 14-day fast fits as well as a 16 h one.
 */
export function HorizonTrack({
  elapsedHours,
  marks,
  line,
  faint,
  milestone,
  now,
}: {
  elapsedHours: number;
  marks: readonly TimelineMark[];
  /** Colours: the line and filled part, the unfilled part, milestone dots, the now dot. */
  line: string;
  faint: string;
  milestone: string;
  now: string;
}) {
  const [width, setWidth] = useState(0);
  const next = marks.find((m) => !m.passed);
  const span = Math.max(24, elapsedHours * 1.12, next ? next.hours * 1.06 : 0);
  // Wide enough for the glow around the now dot at 0h.
  const pad = 13;
  const x = (h: number) => pad + ((width - pad * 2) * Math.min(h, span)) / span;
  const dayStep = span > 24 * 10 ? Math.ceil(span / 24 / 7) * 24 : span > 48 ? 24 : 6;
  const ticks: number[] = [];
  for (let h = dayStep; h < span; h += dayStep) ticks.push(h);
  const tickLabel = (h: number) => (dayStep >= 24 ? `${h / 24}d` : `${h}h`);
  const shown = marks.filter((m) => m.hours <= span);

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{ height: H + 18 }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {width > 0 && (
        <>
          <Svg width={width} height={H}>
            <Line x1={pad} y1={Y} x2={width} y2={Y} stroke={faint} strokeWidth={3} strokeLinecap="round" />
            <Line
              x1={pad}
              y1={Y}
              x2={x(elapsedHours)}
              y2={Y}
              stroke={line}
              strokeWidth={5}
              strokeLinecap="round"
            />
            {ticks.map((h) => (
              <Line key={h} x1={x(h)} y1={Y - 7} x2={x(h)} y2={Y + 7} stroke={faint} strokeWidth={1.5} />
            ))}
            {shown.map((m) =>
              m.kind === 'goal' ? (
                <Path
                  key={m.key}
                  d={`M${x(m.hours)} ${Y + 4} V${Y - 20} h12 l-3 5 l3 5 h-12`}
                  stroke={line}
                  strokeWidth={2}
                  fill={m.passed ? line : 'none'}
                  strokeLinejoin="round"
                />
              ) : (
                <Circle
                  key={m.key}
                  cx={x(m.hours)}
                  cy={Y}
                  r={m.kind === 'best' ? 5 : 4.5}
                  fill={m.passed ? milestone : faint}
                  stroke={m.kind === 'best' ? milestone : 'none'}
                  strokeWidth={2}
                />
              ),
            )}
            <Circle cx={x(elapsedHours)} cy={Y} r={11} fill={now} opacity={0.25} />
            <Circle cx={x(elapsedHours)} cy={Y} r={6.5} fill={now} />
          </Svg>
          <View style={{ height: 18 }}>
            <Text style={[font.xs, tabular, { color: faint, position: 'absolute', left: pad - 3 }]}>0</Text>
            {ticks
              .filter((_, i) => ticks.length <= 8 || i % 2 === 1)
              .map((h) => (
                <Text
                  key={h}
                  style={[
                    font.xs,
                    tabular,
                    { color: faint, position: 'absolute', left: x(h) - 14, width: 28, textAlign: 'center' },
                  ]}
                >
                  {tickLabel(h)}
                </Text>
              ))}
          </View>
        </>
      )}
    </View>
  );
}
