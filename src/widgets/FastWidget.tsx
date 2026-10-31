import { Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, monospacedDigit } from '@expo/ui/swift-ui/modifiers';
import type { WidgetEnvironment } from 'expo-widgets';

/**
 * What the widget and lock screen show. Times are epoch milliseconds; a missing `start` means no
 * fast is running. Missing, not null: iOS stores these in UserDefaults, which can't hold null.
 */
export interface FastWidgetProps {
  start?: number;
  goalAt?: number;
  /** The goal time in words, with the weekday when it isn't today: "Mon 06:34". */
  goalText?: string;
  /** Discreet mode: only the time, never the word "fast". */
  discreet: boolean;
}

/**
 * Home screen and lock screen widget. The elapsed time is drawn by the system ("2 days, 4 hours")
 * from the start date, so it stays right with the app closed and shows days as days.
 */
// An arrow function in a const, not `export default function FastWidget`: the widgets Babel plugin
// turns the function into a string, and in development React Refresh still registers the
// function's name, which then no longer exists and crashes the app on launch.
const FastWidget = (props: FastWidgetProps, env: WidgetEnvironment) => {
  'widget';
  const small = env.widgetFamily === 'accessoryInline' || env.widgetFamily === 'accessoryCircular';
  if (props.start === undefined) {
    return (
      <VStack>
        <Text modifiers={[font({ size: small ? 12 : 15, weight: 'semibold' })]}>
          {props.discreet ? '–' : 'Not fasting'}
        </Text>
      </VStack>
    );
  }
  const start = new Date(props.start);
  return (
    <VStack alignment="leading" spacing={2}>
      {!small && (
        <Text
          modifiers={[
            font({ size: 12, weight: 'semibold' }),
            foregroundStyle({ type: 'hierarchical', style: 'secondary' }),
          ]}
        >
          {props.discreet ? 'Since' : 'Fasting for'}
        </Text>
      )}
      <Text
        date={start}
        dateStyle="relative"
        modifiers={[font({ size: small ? 13 : 22, weight: 'bold', design: 'rounded' }), monospacedDigit()]}
      />
      {!small && props.goalAt !== undefined && (
        <Text modifiers={[font({ size: 12 }), foregroundStyle({ type: 'hierarchical', style: 'secondary' })]}>
          {props.goalAt > Date.now() ? 'Goal ' : 'Goal reached '}
          {props.goalText ?? ''}
        </Text>
      )}
    </VStack>
  );
};

export default FastWidget;
