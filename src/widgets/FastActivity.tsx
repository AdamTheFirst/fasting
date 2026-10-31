import { HStack, Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, monospacedDigit, padding } from '@expo/ui/swift-ui/modifiers';
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
const FastActivity = (props: FastActivityProps): LiveActivityLayout => {
  'widget';
  const start = new Date(props.start);
  const elapsed = (
    <Text
      date={start}
      dateStyle="relative"
      modifiers={[font({ size: 17, weight: 'bold', design: 'rounded' }), monospacedDigit()]}
    />
  );
  return {
    banner: (
      <HStack modifiers={[padding({ all: 16 })]}>
        <VStack alignment="leading" spacing={2}>
          <Text
            modifiers={[
              font({ size: 13, weight: 'semibold' }),
              foregroundStyle({ type: 'hierarchical', style: 'secondary' }),
            ]}
          >
            {props.discreet ? 'Since' : 'Fasting for'}
          </Text>
          {elapsed}
        </VStack>
        {props.goalAt !== undefined && (
          <VStack alignment="trailing" spacing={2}>
            <Text
              modifiers={[font({ size: 13 }), foregroundStyle({ type: 'hierarchical', style: 'secondary' })]}
            >
              Goal
            </Text>
            <Text modifiers={[font({ size: 17, weight: 'semibold' })]}>{props.goalText ?? ''}</Text>
          </VStack>
        )}
      </HStack>
    ),
    compactLeading: (
      <Text modifiers={[font({ size: 13, weight: 'bold' })]}>{props.discreet ? '·' : 'Fast'}</Text>
    ),
    compactTrailing: (
      <Text date={start} dateStyle="timer" modifiers={[font({ size: 13 }), monospacedDigit()]} />
    ),
    minimal: <Text modifiers={[font({ size: 12, weight: 'bold' })]}>·</Text>,
    expandedCenter: elapsed,
  };
};

export default FastActivity;
