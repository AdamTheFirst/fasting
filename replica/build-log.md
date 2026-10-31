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
