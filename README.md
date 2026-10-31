# Fastaway

A fasting tracker for people who already know how they fast. It opens to a Start button, runs any fast for as long as you choose, lets you edit every fast, and never charges you to track one.

The name lives in [`identity.json`](identity.json) and nowhere else. "Fast me" was the working title.

- Research and spec: [docs/FINDINGS.md](docs/FINDINGS.md) and [docs/SPEC.md](docs/SPEC.md)
- Raw research (reviews, scout scripts, design tokens, brand, competitor matrix): [`replica/`](replica/)

## Stack

| Need                              | Choice                                                                                   |
| --------------------------------- | ---------------------------------------------------------------------------------------- |
| iOS and Android from one codebase | Expo SDK 58 (React Native 0.88), TypeScript, Expo Router                                 |
| Apple Health (weight, height)     | `@kingstinct/react-native-healthkit`                                                     |
| Health Connect (weight, height)   | `react-native-health-connect` (needs Android 8+)                                         |
| Milestone alerts                  | `expo-notifications`, local notifications scheduled at fixed dates from the fast's start |
| Charts                            | `react-native-gifted-charts` on `react-native-svg`                                       |
| Storage                           | `expo-sqlite`, on the phone only, no account                                             |
| CSV export and import             | `expo-file-system`, `expo-sharing`, `expo-document-picker`                               |

HealthKit and Health Connect are native modules, so the app runs in a **development build**, not Expo Go.

## Run it

Needs Node 22 and, for local builds, Android Studio (Android) or Xcode on a Mac (iOS).

```bash
npm install
cp .env.example .env

# Android emulator or USB phone (Windows, macOS or Linux)
npm run android        # expo run:android: generates android/, builds and installs the dev build

# iOS simulator (macOS only)
npm run ios

# After the dev build is installed, day-to-day work only needs the bundler:
npm start
```

Health Connect on an emulator: use a Google Play system image with API 34 or later (Health Connect is built in), then add a weight in the Health Connect app to see it appear in the weight chart.

### Building on Windows

The native build fails with `Filename longer than 260 characters` from ninja, because the CMake 3.22.1 that Android Studio installs by default ships ninja 1.10, which can't handle long paths. Install a newer CMake once and point the project at it:

```bash
sdkmanager "cmake;3.31.6"
echo cmake.dir=C\:/Users/<you>/AppData/Local/Android/Sdk/cmake/3.31.6 >> android/local.properties
```

`android/` is generated, so run `npm run android` once first to create it, add the line, then run it again. Keep the line if you regenerate with `expo prebuild --clean`. The repo's `.gitattributes` forces LF line endings so Prettier passes on Windows checkouts.

Health Connect also works on a plain Google APIs image (API 34+); we tested on `system-images;android-35;google_apis;x86_64`.

No Mac? Build iOS in the cloud with EAS: `npx eas-cli build --profile development --platform ios` (needs an Apple Developer account, $99/yr, for a device build).

## Checks

```bash
npm run lint         # ESLint (eslint-config-expo + prettier)
npm run format       # Prettier
npm run typecheck    # tsc --noEmit
npm test             # Jest (jest-expo); domain logic is fully unit-tested
npm run check        # all three
```

CI (`.github/workflows/ci.yml`) runs lint, format, typecheck, tests and `expo config` on every PR.

## Layout

```
identity.json          the app's name, slug, scheme and bundle id
app.config.ts          Expo config: permissions, Health and notification plugins
src/app/               screens (Expo Router): Fast, History, Settings, fast/[id] edit sheet
src/domain/            pure logic, no React: time formats, fasts, milestones, safety card, stats, CSV
src/data/db.ts         SQLite schema and migrations
src/services/health/   index.ios.ts (HealthKit), index.android.ts (Health Connect), index.ts (fallback)
src/services/          notifications, CSV files
src/state/             app store, clock hook, Health sync on open
src/theme/             design tokens (plum on oat)
replica/               research from the scouting, brand, design and comparison threads
```

## Rules the code keeps

- **No quiz.** First launch is the Start screen. Health and notification permissions are asked only when you turn the feature on.
- **No cap.** Any length, shown in days (`13d 22h 05m`), never auto-stopped.
- **Edit everything.** Start, end, notes, delete, add a past fast.
- **Free tracking.** No paywall anywhere in the code.
- **Honest milestones.** Off by default, each links a source, "likely" not "you are now in", and no autophagy timer.
- **72 h safety card.** Once per fast, one tap to dismiss, can be turned off.
- **Time is derived, never counted.** Elapsed time comes from the stored UTC start, so a 9-day fast survives restarts, time zones and DST.

## Environment

See [`.env.example`](.env.example). `APP_VARIANT` (development, preview, production) suffixes the bundle id and name so a dev build and the store build can live side by side. Only `EXPO_PUBLIC_*` values reach the app bundle; never put secrets there.
