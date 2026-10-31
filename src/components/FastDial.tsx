import { type ReactNode, useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { useColors } from '../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedG = Animated.createAnimatedComponent(G);

export interface DialMark {
  /** Where the mark sits, 0 to 1 round the dial from the top. */
  at: number;
  passed: boolean;
}

/**
 * The hero of the Fast screen: a thick track that fills clockwise from the top, with a dot per
 * milestone and whatever the screen puts in the middle. The ring is the goal, or one day when the
 * fast is open-ended, so long fasts simply go round again.
 */
export function FastDial({
  progress,
  marks = [],
  size = 288,
  stroke = 22,
  children,
}: {
  /** 0 to 1, or null before a fast starts. */
  progress: number | null;
  marks?: readonly DialMark[];
  size?: number;
  stroke?: number;
  children?: ReactNode;
}) {
  const c = useColors();
  const r = (size - stroke) / 2;
  const mid = size / 2;
  const circ = 2 * Math.PI * r;
  const p = progress === null ? 0 : Math.min(1, Math.max(0, progress));
  const point = (t: number) => ({
    x: mid + r * Math.sin(t * 2 * Math.PI),
    y: mid - r * Math.cos(t * 2 * Math.PI),
  });
  const head = point(p);
  // The ring sweeps in once when the screen opens; minute ticks after that just move.
  const [sweep] = useState(() => new Animated.Value(0));
  useEffect(() => {
    let live = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (!live) return;
      if (reduce) sweep.setValue(1);
      else
        Animated.timing(sweep, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }).start();
    });
    return () => {
      live = false;
    };
  }, [sweep]);

  return (
    <View style={{ width: size, height: size, alignSelf: 'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={mid} cy={mid} r={r} stroke={c.surface2} strokeWidth={stroke} fill="none" />
        {p > 0 && (
          <G rotation={-90} origin={`${mid}, ${mid}`}>
            <AnimatedCircle
              cx={mid}
              cy={mid}
              r={r}
              stroke={c.accentStrong}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${circ} ${circ}`}
              strokeDashoffset={sweep.interpolate({
                inputRange: [0, 1],
                outputRange: [circ, circ * (1 - p)],
              })}
              fill="none"
            />
          </G>
        )}
        <AnimatedG opacity={sweep.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0, 0, 1] })}>
          {marks.map((m, i) => {
            const q = point(m.at);
            return (
              <Circle
                key={i}
                cx={q.x}
                cy={q.y}
                r={3}
                fill={m.passed ? c.onAccent : c.textFaint}
                opacity={m.passed ? 0.45 : 0.6}
              />
            );
          })}
          {progress !== null && (
            <Circle
              cx={head.x}
              cy={head.y}
              r={stroke / 2 - 4}
              fill={c.surface}
              stroke={c.primary}
              strokeWidth={2.5}
            />
          )}
        </AnimatedG>
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center, { padding: stroke + 18 }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});
