import type { ConfigContext, ExpoConfig } from 'expo/config';

import identity from './identity.json';

// APP_VARIANT lets a dev build sit next to a release build on the same phone.
const variant = process.env.APP_VARIANT ?? 'development';
const isRelease = variant === 'production';
const suffix = isRelease ? '' : `.${variant}`;
const displayName = isRelease ? identity.name : `${identity.name} (${variant})`;

const healthReadWhy = `${identity.name} reads your weight and height to draw your weight and BMI charts. It never reads anything else.`;
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
      backgroundColor: '#F6F2EA',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    permissions: [
      'android.permission.health.READ_WEIGHT',
      'android.permission.health.WRITE_WEIGHT',
      'android.permission.health.READ_HEIGHT',
      'android.permission.health.WRITE_HEIGHT',
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
        color: '#5E3A6E',
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
