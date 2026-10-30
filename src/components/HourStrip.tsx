import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Defs, Line, Pattern, Rect } from 'react-native-svg';

import { useColors } from '../theme';

const HEIGHT = 30;
const GAP = 3;

/** Hours per tick, so a fast of any length fits in about three dozen ticks. */
function stepFor(span: number): number {
  if (span <= 36) return 1;
  if (span <= 72) return 2;
  if (span <= 144) return 4;
  return 8;
}

/**
 * The fast as a row of hour ticks, the way Periodiary shows the days of a cycle: done hours
 * are solid, the current hour has an ink ring, and the hour you plan to stop is hatched with a
 * dashed outline because it is a plan, not a fact. With no elapsed time it previews the goal.
 */
export function HourStrip({
  elapsedHours,
  goalHours,
}: {
  elapsedHours: number | null;
  goalHours: number | null;
}) {
  const c = useColors();
  const [width, setWidth] = useState(0);
  const elapsed = elapsedHours ?? 0;
  const span = Math.max(goalHours ?? 0, Math.ceil(elapsed + 0.01), elapsedHours === null ? 16 : 12);
  const step = stepFor(span);
  const count = Math.ceil(span / step);
  const current = elapsedHours === null ? -1 : Math.floor(elapsed / step);
  const goalTick = goalHours ? Math.max(0, Math.ceil(goalHours / step) - 1) : -1;
  const tickW = width > 0 ? (width - GAP * (count - 1)) / count : 0;

  const label =
    elapsedHours === null
      ? `${goalHours ? Math.round(goalHours) : 'Open-ended'} hour plan`
      : `${Math.floor(elapsed)} of ${goalHours ? Math.round(goalHours) : 'open-ended'} hours`;

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{ height: HEIGHT + 4 }}
    >
      {width > 0 && (
        <Svg width={width} height={HEIGHT + 4}>
          <Defs>
            <Pattern
              id="hatch"
              width={7}
              height={7}
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <Line x1={0} y1={0} x2={0} y2={7} stroke={c.hatch} strokeWidth={2} />
            </Pattern>
          </Defs>
          {Array.from({ length: count }, (_, i) => {
            const x = i * (tickW + GAP);
            const done = i < current;
            const isNow = i === current;
            const isGoal = i === goalTick && !done && !isNow;
            const fill = done ? c.period : c.surface2;
            return (
              <Rect
                key={i}
                x={x + (isNow || isGoal ? 1 : 0)}
                y={2 + (isNow || isGoal ? 1 : 0)}
                width={Math.max(1, tickW - (isNow || isGoal ? 2 : 0))}
                height={HEIGHT - (isNow || isGoal ? 2 : 0)}
                rx={Math.min(4, tickW / 2)}
                fill={isGoal ? 'url(#hatch)' : isNow ? c.surface : fill}
                stroke={isNow ? c.text : isGoal ? c.textMuted : 'none'}
                strokeWidth={isNow || isGoal ? 2 : 0}
                strokeDasharray={isGoal ? '3 2' : undefined}
              />
            );
          })}
        </Svg>
      )}
    </View>
  );
}
