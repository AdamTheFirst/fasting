import { ProgressView, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  font,
  foregroundStyle,
  kerning,
  labelsHidden,
  lineLimit,
  monospacedDigit,
  progressViewStyle,
  textCase,
  tint,
} from '@expo/ui/swift-ui/modifiers';
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
  /** Without Plus: the widget says where to unlock it instead of showing the fast. */
  locked?: boolean;
}

/**
 * Home screen and lock screen widget. The elapsed time is drawn by the system ("2 days, 4 hours")
 * from the start date, so it stays right with the app closed and shows days as days.
 */
// An arrow function in a const, not `export default function FastWidget`: the widgets Babel plugin
// turns the function into a string, and in development React Refresh still registers the
// function's name, which then no longer exists and crashes the app on launch.
// Colours are written inline: the plugin moves the function body into the widget on its own, so it
// can't see anything else in this file. Gold is the app's accent; the bar fills toward the goal.
const FastWidget = (props: FastWidgetProps, env: WidgetEnvironment) => {
  'widget';
  const family = env.widgetFamily;
  const tiny = family === 'accessoryInline' || family === 'accessoryCircular';
  const label = [
    font({ size: 11, weight: 'semibold' }),
    kerning(0.8),
    textCase('uppercase'),
    foregroundStyle({ type: 'hierarchical', style: 'secondary' }),
  ];
  if (props.locked) {
    return (
      <VStack alignment="leading" spacing={4}>
        {!tiny && <Text modifiers={label}>{props.discreet ? 'Timer' : 'Fastaway'}</Text>}
        <Text modifiers={[font({ size: tiny ? 12 : 15, weight: 'semibold', design: 'rounded' })]}>
          {tiny ? 'Plus' : 'Comes with Plus. Open the app to unlock.'}
        </Text>
      </VStack>
    );
  }
  if (props.start === undefined) {
    return (
      <VStack alignment="leading" spacing={4}>
        {!tiny && <Text modifiers={label}>{props.discreet ? 'Timer' : 'Fastaway'}</Text>}
        <Text modifiers={[font({ size: tiny ? 12 : 17, weight: 'semibold', design: 'rounded' })]}>
          {props.discreet ? '–' : 'Not fasting'}
        </Text>
      </VStack>
    );
  }
  const start = new Date(props.start);
  if (tiny) {
    return (
      <Text
        date={start}
        dateStyle="relative"
        modifiers={[font({ size: 13, weight: 'semibold', design: 'rounded' }), monospacedDigit()]}
      />
    );
  }
  const reached = props.goalAt !== undefined && props.goalAt <= Date.now();
  return (
    <VStack alignment="leading" spacing={6}>
      <Text modifiers={label}>{props.discreet ? 'Since' : reached ? 'Goal reached' : 'Fasting'}</Text>
      <Text
        date={start}
        dateStyle="relative"
        modifiers={[font({ size: 24, weight: 'bold', design: 'rounded' }), monospacedDigit(), lineLimit(2)]}
      />
      <Spacer />
      {props.goalAt !== undefined && !reached && (
        <VStack alignment="leading" spacing={4}>
          <ProgressView
            timerInterval={{ lower: start, upper: new Date(props.goalAt) }}
            countsDown={false}
            modifiers={[progressViewStyle('linear'), tint('#E3BC52'), labelsHidden()]}
          />
          <Text
            modifiers={[font({ size: 12 }), foregroundStyle({ type: 'hierarchical', style: 'secondary' })]}
          >
            {`Goal ${props.goalText ?? ''}`}
          </Text>
        </VStack>
      )}
    </VStack>
  );
};

export default FastWidget;
