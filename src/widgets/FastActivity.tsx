import { HStack, Image, ProgressView, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  activityBackgroundTint,
  font,
  foregroundStyle,
  kerning,
  labelsHidden,
  lineLimit,
  minimumScaleFactor,
  monospacedDigit,
  padding,
  progressViewStyle,
  textCase,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import type { LiveActivityLayout } from 'expo-widgets';

export interface FastActivityProps {
  start: number;
  goalAt?: number;
  goalText?: string;
  discreet: boolean;
}

/**
 * Lock screen and Dynamic Island while a fast runs. iOS ends Live Activities after about
 * 8 to 12 hours, so for multi-day fasts the widget is the dependable surface; opening the app
 * starts the activity again.
 */
// An arrow function in a const, not `export default function FastActivity`: the widgets Babel plugin
// turns the function into a string, and in development React Refresh still registers the
// function's name, which then no longer exists and crashes the app on launch.
// Colours are inline for the same reason as in FastWidget: the body runs on its own in the widget.
// Ink background, white type and a gold bar toward the goal, like the app icon.
const FastActivity = (props: FastActivityProps): LiveActivityLayout => {
  'widget';
  const start = new Date(props.start);
  const goal = props.goalAt !== undefined ? new Date(props.goalAt) : undefined;
  const label = [
    font({ size: 11, weight: 'semibold' }),
    kerning(0.8),
    textCase('uppercase'),
    foregroundStyle('#9DA5B5'),
  ];
  const elapsed = (size: number) => (
    <Text
      date={start}
      dateStyle="timer"
      modifiers={[
        font({ size, weight: 'bold', design: 'rounded' }),
        monospacedDigit(),
        lineLimit(1),
        minimumScaleFactor(0.6),
        foregroundStyle('#FFFFFF'),
      ]}
    />
  );
  const bar =
    goal !== undefined ? (
      <ProgressView
        timerInterval={{ lower: start, upper: goal }}
        countsDown={false}
        modifiers={[progressViewStyle('linear'), tint('#E3BC52'), labelsHidden()]}
      />
    ) : null;
  return {
    banner: (
      <VStack
        alignment="leading"
        spacing={8}
        modifiers={[padding({ horizontal: 20, vertical: 18 }), activityBackgroundTint('#1B2029')]}
      >
        <HStack alignment="top">
          <VStack alignment="leading" spacing={2}>
            <Text modifiers={label}>{props.discreet ? 'Since' : 'Fasting'}</Text>
            {elapsed(28)}
          </VStack>
          <Spacer />
          {props.goalText !== undefined && (
            <VStack alignment="trailing" spacing={2}>
              <Text modifiers={label}>Goal</Text>
              <Text modifiers={[font({ size: 17, weight: 'semibold' }), foregroundStyle('#FFFFFF')]}>
                {props.goalText}
              </Text>
            </VStack>
          )}
        </HStack>
        {bar}
      </VStack>
    ),
    compactLeading: (
      <Image systemName={props.discreet ? 'circle' : 'circle.dashed'} color="#E3BC52" size={14} />
    ),
    compactTrailing: (
      <Text
        date={start}
        dateStyle="timer"
        modifiers={[
          font({ size: 13, weight: 'semibold', design: 'rounded' }),
          monospacedDigit(),
          foregroundStyle('#E3BC52'),
        ]}
      />
    ),
    minimal: <Image systemName="circle.dashed" color="#E3BC52" size={12} />,
    expandedLeading: (
      <VStack alignment="leading" spacing={2} modifiers={[padding({ leading: 6 })]}>
        <Text modifiers={label}>{props.discreet ? 'Since' : 'Fasting'}</Text>
        {elapsed(22)}
      </VStack>
    ),
    expandedTrailing:
      props.goalText !== undefined ? (
        <VStack alignment="trailing" spacing={2} modifiers={[padding({ trailing: 6 })]}>
          <Text modifiers={label}>Goal</Text>
          <Text modifiers={[font({ size: 15, weight: 'semibold' }), foregroundStyle('#FFFFFF')]}>
            {props.goalText}
          </Text>
        </VStack>
      ) : undefined,
    expandedBottom: bar ? <VStack modifiers={[padding({ horizontal: 6, top: 4 })]}>{bar}</VStack> : undefined,
  };
};

export default FastActivity;
