# Fastaway: purpose and v0.1 spec

Updated 2026-10-30. This is the repo copy of the [live spec doc](https://claude.ai/artifact/DNu6GL8DaCBZmaB2JBh6n7), with the chosen name, the native-first decision and the comparison gaps folded in. The research behind it is in [FINDINGS.md](FINDINGS.md).

**A fasting tracker for people who already know how they fast.** It opens to a Start button, runs any fast for as long as you choose, lets you edit every fast, and never charges you to track one.

**Who it's for:** experienced fasters, especially people who do 24 h to multi-day fasts, change their rhythm day to day, and were put off by quizzes, caps and surprise renewals. The founder is the first user.

**Success:** the founder is fasting on it again within a month, and an extended faster can start, finish and fix a 5-day fast without fighting the app.

## Principles

1. **The user decides.** No plan is pushed on you. Defaults are suggestions you can ignore.
2. **Zero friction to start.** No account, no quiz, no paywall before Start.
3. **No ceiling.** No length cap, no paywalled durations, days shown as days.
4. **Honest.** Tracking is free forever. No trials that convert.
5. **Quiet.** Nothing pings you that you did not turn on.
6. **Your data.** On the device first, exportable, deletable.

## Platform

Native iPhone and Android from v0.1, one codebase: Expo SDK 58 / React Native with a development build. A web app can't reach Apple Health or Health Connect, and iPhone web apps get unreliable notifications. See the [README](../README.md) for the stack.

## v0.1 scope

The status column shows what the scaffold in this repo covers. "Scaffolded" means the logic is unit-tested and the screen exists. The dev build runs on an Android 15 emulator (30 Oct); nothing has run on an iPhone yet.

| #   | Feature                                                                                                                                     | Acceptance check                                                                              | Status                                                                                                                                                     |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Start screen.** First launch shows a Start button, nothing else required.                                                                 | Fresh install to a running fast in one tap, no sign-in.                                       | Scaffolded                                                                                                                                                 |
| 2   | **Any length.** Open-ended by default. Optional goal in hours, days, or "until a date and time".                                            | A 14-day fast runs, shows as `13d 22h 05m`, and is never capped or auto-stopped.              | Scaffolded, with custom goals typed in hours or days. The "until" goal is in the data model; its picker is still to do                                     |
| 3   | **Edit everything.** Change the start and end of any fast, past or running; delete; add a past fast by hand.                                | Edit a 3-day-old fast's start; history and totals update.                                     | Scaffolded, with overlap and future-time checks                                                                                                            |
| 4   | **Your own presets.** Save e.g. "72 h monthly", "20:4", "OMAD". Optional per-weekday rhythm.                                                | Save a preset in under 3 taps from the end of a fast.                                         | Save a custom goal or a just-ended fast as a preset; manage presets in Settings. Optional weekly rhythm: pick days per preset and Start preselects today's |
| 5   | **History.** Calendar, list, longest fast, hours this month, streaks you define.                                                            | After 10 fasts, the calendar and longest-fast record are correct.                             | Scaffolded. The streak threshold is a setting (16 h default) with no UI yet                                                                                |
| 6   | **Long-fast safety card.** One skippable card past 72 h: electrolytes, refeed slowly, warning signs, who should see a doctor. Never blocks. | Shows at 72 h, dismisses in one tap, can be turned off.                                       | Scaffolded                                                                                                                                                 |
| 7   | **Alerts you choose.** Off by default; turn on any milestone.                                                                               | No notification ever fires on a fresh install.                                                | Scaffolded (unit-tested)                                                                                                                                   |
| 8   | **Export and import.** CSV of all fasts.                                                                                                    | Export then import gives identical history.                                                   | Scaffolded (round-trip tested)                                                                                                                             |
| 9   | **Milestone notifications.** 12 h, 24 h, 48 h, 72 h, goal and your own records, each with a sourced line; your own custom milestones too.   | Turn on 24 h; it fires at hour 24 with the phone locked, even if you edited the start time.   | Scaffolded. Alerts are scheduled at fixed dates and rescheduled on every edit. Your own milestones are added in Settings                                   |
| 10  | **Charts.** Fast calendar, fast lengths, hours per week, weight and fasts, BMI trend (hidden by default), records.                          | After 10 fasts and 5 weights, every chart draws and tapping a bar opens that fast.            | Done. Fasts are shaded behind the weight line                                                                                                              |
| 11  | **Health sync.** Read and write weight and height with Apple Health and Health Connect; manual entry always works.                          | A weight logged in Apple Health shows on the weight chart within a minute of opening the app. | Scaffolded: syncs on open, asks permission only when you turn it on                                                                                        |

## Milestones and the science

Milestones fire at fixed hours after the start. Each carries one line about what is likely happening and links its source. **There is no human data on when autophagy starts**, so the app says that plainly instead of showing a made-up timer. Stages are "likely", never "you are now in". Every milestone is opt-in and off by default. The table is in [FINDINGS.md §6](FINDINGS.md#6-the-science-behind-milestones); the code is in `src/domain/milestones.ts`.

## Health data

Weight and height only, in both directions. Health Connect has `WeightRecord` and `HeightRecord` but no fasting record, so fasts stay in the app and the CSV. Permission is asked the first time you turn sync on, never at install. A Health reading within a minute of a manual entry with the same value is treated as the same reading, so nothing is counted twice.

## Next, after v0.1 (ranked)

1. **Home-screen widget** with a live timer: the most-asked feature, and it takes the comparison score from 75% to 81%.
2. **Apple Watch app or complication.** Zero's has been free since August 2026.
3. **Import from Zero**, because its users are the most likely to switch.
4. **Free-text notes per fast** (energy, mood, ketone readings). There's a note field on the edit screen already; it needs to show in History.
5. Body fat from Health on the weight chart.
6. Optional encrypted sync across devices.

Water tracking stays out unless dogfooding asks for it.

## Non-goals

- An onboarding questionnaire, quiz, body-type profile or "personal plan".
- Calorie counting, meal plans, recipes, coaching, or an AI coach.
- A social feed, community, leaderboards or challenges.
- Ads, or a subscription needed to track any fast of any length.
- Medical claims: no "fat-burning stage" timers shown as fact, no diagnosis or treatment advice.
- Anything for under-18s, or marketing it for weight loss.

**Money: Fastaway Plus**, one payment of $9.99 (store regional pricing), no subscription, no trial, Family Sharing on. Plus holds the widget and Live Activity, Insights, Apple Health / Health Connect sync and body signals, the Sage and Powder themes, and extras added later. Everything that tracks, edits or protects a fast stays free: any length, editing, presets, the plan, history (calendar, list, longest fast, totals, streaks), notes, alerts, the safety card, Siri shortcuts, and CSV export and import. Plus is only sold from its own sheet, opened by a Plus tag or the Settings row, never by itself. `src/domain/__tests__/plus.test.ts` fails if a free file starts checking Plus.

## What we need to do

1. ~~Decide native vs web~~ (native, 30 Oct). ~~Pick a name~~ (Fastaway, 30 Oct). Run the name checks.
2. ~~Run on an Android emulator~~ (30 Oct). Run on an iPhone, then finish the "still to do" items above (about two weeks).
3. The founder uses it for 2 to 4 weeks and notes what annoys them.
4. Widen the research with `replica/scout.py` on an open network, aiming for 300+ rows.
5. A clinician reads the milestone and safety text before public launch.
6. Apple Developer Program, privacy policy, Play Health apps and Health Connect declarations.
