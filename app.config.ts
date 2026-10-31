import type { ConfigContext, ExpoConfig } from 'expo/config';

import identity from './identity.json';

// APP_VARIANT lets a dev build sit next to a release build on the same phone.
const variant = process.env.APP_VARIANT ?? 'development';
const isRelease = variant === 'production';
const suffix = isRelease ? '' : `.${variant}`;
const displayName = isRelease ? identity.name : `${identity.name} (${variant})`;

const healthReadWhy = `${identity.name} reads your weight and height to draw your weight and BMI charts. If you turn on body signals, it also reads sleep, resting heart rate and heart rate variability to draw them next to your fasts. Nothing leaves your phone.`;
// The iOS widget and Live Activity add a widget extension target. FASTAWAY_WIDGETS=0 builds without
// it, for a quick local build without an Apple team set up for app groups.
const withWidgets = process.env.FASTAWAY_WIDGETS !== '0';

const healthWriteWhy = `${identity.name} saves the weight and height you enter so other health apps can use them.`;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: displayName,
  slug: identity.slug,
  scheme: identity.scheme,
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: `${identity.bundleId}${suffix}`,
    supportsTablet: false,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: `${identity.bundleId}${suffix}`.replace(/-/g, '_'),
    adaptiveIcon: {
      backgroundColor: '#F6F4EE',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    permissions: [
      'android.permission.health.READ_WEIGHT',
      'android.permission.health.WRITE_WEIGHT',
      'android.permission.health.READ_HEIGHT',
      'android.permission.health.WRITE_HEIGHT',
      'android.permission.health.READ_RESTING_HEART_RATE',
      'android.permission.health.READ_HEART_RATE_VARIABILITY',
      'android.permission.health.READ_SLEEP',
      'android.permission.POST_NOTIFICATIONS',
      'android.permission.SCHEDULE_EXACT_ALARM',
    ],
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-sqlite',
    'expo-sharing',
    '@react-native-community/datetimepicker',
    [
      'expo-notifications',
      {
        color: '#1B2029',
        icon: './assets/notification-icon.png',
      },
    ],
    [
      '@kingstinct/react-native-healthkit',
      {
        NSHealthShareUsageDescription: healthReadWhy,
        NSHealthUpdateUsageDescription: healthWriteWhy,
        background: false,
      },
    ],
    'react-native-health-connect',
    ...(withWidgets
      ? [
          [
            'expo-widgets',
            {
              widgets: [
                {
                  name: 'FastWidget',
                  displayName: 'Fast timer',
                  description: 'How long your current fast has been running.',
                  supportedFamilies: [
                    'systemSmall',
                    'accessoryRectangular',
                    'accessoryInline',
                    'accessoryCircular',
                  ],
                },
              ],
            },
          ] as [string, unknown],
        ]
      : []),
    [
      'expo-build-properties',
      {
        // Health Connect needs Android 8 (API 26) or later.
        android: { minSdkVersion: 26 },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    variant,
    privacyPolicyUrl: process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL ?? '',
  },
});
