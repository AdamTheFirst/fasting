import { APP_NAME } from './identity';

/**
 * The privacy policy, shown in the app and published as docs/PRIVACY.md for the store listings.
 * Keep the two in step, and update both before adding anything that sends data off the phone.
 */
export const PRIVACY_UPDATED = '1 November 2026';

export const PRIVACY_SECTIONS: { title: string; body: string }[] = [
  {
    title: 'The short version',
    body: `${APP_NAME} keeps everything on your phone. There is no account, no server, no analytics, no ads and no tracking. We never see your fasts, notes or health data.`,
  },
  {
    title: 'What the app stores',
    body: 'Your fasts (start, end, goal, notes), presets, weight and height entries, and your settings. They are stored in a database on your phone. If your phone makes device backups (iCloud Backup or Google backup), the database can be part of them, under your own account.',
  },
  {
    title: 'Apple Health and Health Connect',
    body: 'Only if you turn on Health sync: the app reads and writes weight and height. Only if you turn on body signals: it reads sleep, resting heart rate and heart rate variability to draw them next to your fasts. It reads nothing else, writes nothing else, and never sends this data anywhere. Health data is never used for advertising.',
  },
  {
    title: 'Widget and lock screen',
    body: 'The widget and lock screen show how long your current fast has run. They read it from the phone. Discreet mode hides the word "fast".',
  },
  {
    title: 'Buying Plus',
    body: `${APP_NAME} Plus is a one-time purchase through the App Store or Google Play. Apple or Google handle the payment and keep the receipt under your store account; we never see your card or your name. To know whether Plus is unlocked, the app asks the store on your phone. No fasts, notes or health data are sent with it.`,
  },
  {
    title: 'Sharing and export',
    body: 'Nothing leaves the phone unless you choose to share it: a CSV export, or an image you share yourself through the share sheet. Where it goes then is up to you.',
  },
  {
    title: 'Deleting your data',
    body: 'Settings → Delete everything removes every fast, note, preset, weight and setting from the phone. Deleting the app does the same. Data you wrote to Apple Health or Health Connect stays there until you delete it in that app.',
  },
  {
    title: 'Children',
    body: `${APP_NAME} is for adults (18 and over).`,
  },
  {
    title: 'Changes and contact',
    body: 'If this policy changes, the new version will be in the app and on the website, with a new date. Questions: the contact address on the store listing.',
  },
];
