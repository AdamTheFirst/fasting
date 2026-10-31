import { HStack, Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, monospacedDigit, padding } from '@expo/ui/swift-ui/modifiers';
import type { LiveActivityLayout } from 'expo-widgets';

export interface FastActivityProps {
  start: number;
  goalAt: number | null;
  discreet: boolean;
}

/**
 * Lock screen and Dynamic Island while a fast runs. iOS ends Live Activities after about
 * 8 to 12 hours, so for multi-day fasts the widget is the dependable surface; opening the app
 * starts the activity again.
 */
export default function FastActivity(props: FastActivityProps): LiveActivityLayout {
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
        {props.goalAt !== null && (
          <VStack alignment="trailing" spacing={2}>
            <Text
              modifiers={[font({ size: 13 }), foregroundStyle({ type: 'hierarchical', style: 'secondary' })]}
            >
              Goal
            </Text>
            <Text
              date={new Date(props.goalAt)}
              dateStyle="time"
              modifiers={[font({ size: 17, weight: 'semibold' })]}
            />
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
}
