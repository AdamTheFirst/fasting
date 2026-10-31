import { Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, monospacedDigit } from '@expo/ui/swift-ui/modifiers';
import type { WidgetEnvironment } from 'expo-widgets';

/** What the widget and lock screen show. Times are epoch milliseconds; null means no fast is running. */
export interface FastWidgetProps {
  start: number | null;
  goalAt: number | null;
  /** Discreet mode: only the time, never the word "fast". */
  discreet: boolean;
}

/**
 * Home screen and lock screen widget. The elapsed time is drawn by the system ("2 days, 4 hours")
 * from the start date, so it stays right with the app closed and shows days as days.
 */
export default function FastWidget(props: FastWidgetProps, env: WidgetEnvironment) {
  'widget';
  const small = env.widgetFamily === 'accessoryInline' || env.widgetFamily === 'accessoryCircular';
  if (props.start === null) {
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
      {!small && props.goalAt !== null && (
        <Text modifiers={[font({ size: 12 }), foregroundStyle({ type: 'hierarchical', style: 'secondary' })]}>
          {props.goalAt > Date.now() ? 'Goal ' : 'Goal reached '}
          <Text date={new Date(props.goalAt)} dateStyle="time" />
        </Text>
      )}
    </VStack>
  );
}
