# Build log

## 2026-10-31 · First run on a Mac, redesign

- Built the dev client for the iOS Simulator (iPhone 18 Pro Max, iOS 27) for the first time. CocoaPods needs a UTF-8 locale (`LANG=en_US.UTF-8`) or `pod install` crashes. Metro must run without `CI=1`, or it stops watching files and edits never reach the app.
- Weight chart: fasts are now shaded behind the weight line, so you can see weight move around them.
- Redesign, after feedback that the outlined pastel look didn't feel premium:
  - Design system: one soft card shadow instead of ink outlines, iOS large titles (34 pt bold) with a small caps eyebrow, solid ink pill for the main action, raised white pill for the second one, a deeper accent per theme (`accentStrong`) for rings, bars and calendar days, radii 10/14/20/24, 56 pt minimum tap target.
  - Fast screen: a ring dial that fills toward the goal (or goes round once a day when open-ended) with a dot per milestone; goal tiles (big number, small unit); week as seven bars; start/goal facts row.
  - History: stat tiles, calendar discs, charts in the accent with dashed grid lines.
  - Settings: theme swatches, filled inputs, check-style radio.
  - Haptics (`expo-haptics`): a selection tick on choices and a light tap on main buttons. Needs a native rebuild.
- Decision: kept Butter, Sage and Powder blue; moved "fasting" from the period colour to the theme's accent so one colour means "fasted" everywhere.
- Self-score from Simulator screenshots: Fast 8.5, running fast 8.5, History 8, Settings 8. Dark mode checked.

## 2026-10-31 · Minimal, premium pass

- Feedback: Settings and the icon looked bad and every screen was cluttered. Goal: minimalism, one idea per screen.
- Settings: five rows (Appearance, Fasting, Reminders, Health, Your data), each opening its own page under `src/app/settings/`. Group labels are small caps, as in iOS Settings.
- History: a single summary card (hours this month, comparison with last month, then average, longest and streak), then a ring calendar where each day's ring fills with hours fasted and a whole day becomes a solid disc. Tap a day to open that fast. All charts moved to a separate Insights page, where each chart opens with one plain number.
- Fast: the idle screen is the dial, goal tiles and start button only. The running screen dropped the duplicate start/goal row, the week card and the extra info card. The ring sweeps in when the screen opens, and this is skipped when Reduce Motion is on.
- Icon and splash: one gold ring on ink, with no track or knob; the splash uses the same ring on the light and dark backgrounds (`expo-splash-screen`). The brand mark and the Fast tab glyph are now the ring as well.
- Live Activity and widget: ink banner, a large timer, the goal on the right and a gold progress bar toward the goal (SwiftUI `ProgressView` timer, so it updates with the app closed). Checked on the iPhone 17 lock screen.
- Confirm sheets: centred text, a grabber, and a quiet text button for cancel.
- Decision: kept every feature and moved it one tap deeper instead of deleting it.
- Self-score from Simulator screenshots: Settings 8.5, Fast 8.5, History 8.5, Insights 8, Live Activity 8.5, icon 8. Dark mode checked.

## 2026-11-01 · Contrast, clearer buttons, simpler settings pages

- Feedback: contrast too low, some buttons didn't look like buttons, settings sub-pages were confusing with things buried in them.
- Contrast: secondary text about 7.9:1 (was 6.2), faint text at least 5:1, input and track fills and outlines firmer, accents deeper (butter gold #CC9C24, sage #6A9E79, powder #5B8CC8), cards and lists get a fine edge. Dark mode secondary text brighter.
- Buttons: every action but a dialog's cancel has a visible shape. Second actions are white pills with a 1.5 pt outline. "Change start or goal" is a full-width button with an icon, and goal tiles are outlined.
- Settings sub-pages: one line per row. Presets open their own screen (name, days, delete), streak hours use − / + buttons, weight and height open a screen with one big field, and milestone switches are one line each, with the explanations and sources on an "About milestones" page.
