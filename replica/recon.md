# Design recon: the major fasting apps

Done 2026-10-30 with the replica-design method, for Fast me (native iOS and Android, for experienced fasters).

## How this was gathered, and what it is missing

The skill wants screenshots in `replica/screens/` and colours measured with a picker. **That was not possible here:** this sandbox's network policy blocks the screenshot hosts (media.screensdesign.com, apps.apple.com, play.google.com all return a proxy 403). So this recon is built from written teardowns of each app's flows (ScreensDesign, Lazyweb, a 2026 review roundup) plus the review rows already in `reviews.csv`. Where a visual note comes from general knowledge of the app rather than a source, it is marked *(unsourced)*. No competitor screenshots, icons or copy are stored in this repo, and none should be.

Because nothing could be measured, `design/tokens.json` is **not** a copy of any competitor. It is Fast me's own system, built on the patterns below. That is also what the skill asks for: rebuild the system, never the brand.

Sources: [Zero teardown](https://screensdesign.com/showcase/zero-fasting-health-tracker), [Fastic teardown](https://screensdesign.com/apps/fastic-ai-food-calorie-scanner/), [BodyFast teardown](https://screensdesign.com/showcase/bodyfast-intermittent-fasting), [FastEasy teardown](https://screensdesign.com/showcase/fasteasy-intermittent-fasting), [Zero onboarding on Lazyweb](https://lazyweb.com/canvas/flows/zero/onboarding), [ScreensDesign fasting category](https://screensdesign.com/categories/fasting-apps/), [unstar.app 2026 roundup](https://unstar.app/blog/zero-simple-fastic-life-fasting-bodyfast-intermittent-fasting-apps-ranked-2026).

## At a glance

| App | Steps before first fast | Paywall | Timer | History | Milestones |
| --- | --- | --- | --- | --- | --- |
| Zero | 17 to 27 (sources differ by version) | Hard, inside onboarding, 7-day trial on annual; $69.99/yr | Ring timer with coachmarks; custom windows paid; caps at 168 h | Trends dashboard, reorderable charts; deleting a fast takes several taps | Badges, confetti on first fast, challenges, streaks |
| Fastic | about 75 | Hard-style after "plan ready", discount code, prize wheel, 75% off variants; $39.99/yr | Large ring with remaining time, mood picker, edit start time | List grouped by date with add/edit/delete; weekly and monthly bars; weight line | Stars, flame streaks, streak freezes, levels, item shop, 21-day challenge |
| BodyFast | 20 | Soft, after onboarding and a signed "commitment contract"; contextual paywalls later | Clean ring, fasting vs eating state | Simple bars for weight and water | Trophies for logging water and measurements; stages infographic |
| FastEasy | 26 | Hard, no trial, at end of quiz; 12-month pre-selected "SAVE 75%" | not covered | Projected weight curve before paywall | not covered |
| Simple | quiz, weight target, plan | 24 h and 36 h windows paid; $29.99 first year renews at $99.99 | partly paywalled | biometric integration | AI coach |
| LIFE | short | Generous free tier; $39.99/yr | free | detailed analytics paid | Circles (group fasts) |
| Category | **19.3 average** | Free trial + soft paywall most common | | | |

## 1. Onboarding

**What they do.** Every big app runs a quiz funnel: goal (always "lose weight" first), sex, birthday, height, weight, goal weight, activity, eating habits, then a "building your plan" progress bar, a projected weight-loss curve, and a paywall. Fastic stretches this to about 75 screens with two permission prompts, testimonials and a discount code. BodyFast ends with a signed commitment contract. The category average is 19.3 steps before you can start a fast.

**Why it works for them.** It is a sales funnel. The questions create sunk cost and the curve sells the subscription.

**Why it fails our user.** Salih deleted the last app after 15 minutes of this. An experienced faster already has a plan.

**Take:** nothing from the funnel. Take only the bottom-anchored primary button and the one-question-per-screen layout, for the rare place we ask anything (none in v0.1).
**Avoid:** goal quizzes, body stats before first use, weight-loss projections, commitment contracts, permission prompts on launch, accounts.

**Fast me:** first launch is the Start screen. Health and notification permissions are asked only when the person turns the feature on.

## 2. Timer screen

**What they do.** A big circular ring is the industry default (Zero, Fastic, BodyFast). It shows remaining time against a fixed goal, with a single End button and a card to adjust start time. Zero teaches the screen with coachmarks. Fastic adds a mood selector and a promo card for Plus on the same screen. Zero layers named "fasting zones" on the ring *(unsourced: the zone names and colours are general knowledge)*.

**Take:**
- One dominant number and one dominant button. The ring is understood instantly.
- Editing start time right from the timer (Fastic), not buried in history.
- Coachmarks instead of a tutorial, if we ever need teaching.

**Avoid:**
- A ring that only makes sense with a goal. An open-ended 9-day fast has no "remaining". Our ring shows the current day (it fills once per 24 h and a day counter steps up), and goal progress is a thin second track only when a goal exists.
- Remaining time as the headline. Experienced fasters care about elapsed. Elapsed is the hero; remaining is secondary.
- "Fat burning / ketosis" zones presented as fact. The spec's non-goals rule out medical claims, and Apple 1.4.1 rejects unsourced health measurements.
- Promo cards, mood pickers or tips on the timer.
- Hours-only display. `3d 04h 12m`, never `76:12`.

## 3. History and charts

**What they do.** Fastic: list grouped by date, with add, edit and delete and a toast after each; weekly and monthly bar charts with average duration; weight line with range tabs. Zero: a trends dashboard that plots metrics against each other, reorderable charts, but deleting a fast takes several taps. BodyFast: simple bars.

**Take:**
- Fastic's list grouped by date with Add fast, inline edit and delete, and an undo toast.
- A bar per fast with average duration, and range tabs (week, month, year).
- Weight as an optional line on the same time axis (from Apple Health / Health Connect), which answers the "can't correlate with weight" complaint.

**Avoid:**
- Bars scaled for 16 h. A 120 h fast must not clip or flatten every other bar. Use a y-axis that grows with the longest fast in range, with day gridlines past 48 h.
- A dashboard of ten charts. One chart, one calendar, one list.
- More than two taps to delete or edit a fast.

**Fast me adds:** a month calendar where a multi-day fast is a continuous bar across days, and a "longest fast" record.

## 4. Milestones and gamification

**What they do.** Zero: badges, confetti, challenges, streaks. Fastic: stars, flame streaks, streak freezes, levels, a virtual shop, 21-day challenges with share prompts. Reviewers note streak pressure pushing people to end or extend fasts.

**Take:** the moment itself. Reaching a milestone deserves a small, warm acknowledgement.
**Avoid:** streak penalties, freezes, levels, shops, share prompts, and anything that rewards fasting longer than planned. For a no-cap app this is a safety issue, not just taste.

**Fast me:** milestones are hours you choose (defaults offered: 24 h, 48 h, 72 h, goal). They show as ticks on the timer and an optional notification. Off by default. A "personal best" mark when you pass your longest fast, stated plainly, no confetti. At 72 h the one-time safety card appears.

## 5. Paywall placement

**What they do.** Inside or right after onboarding, before first value (Zero, Fastic, FastEasy). Annual pre-selected with a "save 75%" badge, a trial on the annual plan, discount codes, prize wheels, and contextual paywalls on longer timers (Simple's 24 h and 36 h, Zero's custom windows). Promo first years that renew at two to three times the price drive the most 1-star reviews.

**Take:** nothing in v0.1.
**Avoid:** all of it. Tracking is free forever. If a supporter unlock ever exists, it lives in Settings, is one-time, and never sits between the person and a fast.

## 6. Visual style

| App | Style | Note |
| --- | --- | --- |
| Zero | Dark-leaning, ring-centred, gradient accents *(unsourced)* | Polished timer, strongest widget per the roundup |
| Fastic | White backgrounds, orange mascot, green primary buttons, rounded cards, bottom tabs, lots of illustration | Busy; mascot-led |
| BodyFast | Clean, timer-centred dashboard, simple bars | Clinical tone |
| Simple | Called "the strongest visual design in the category" | Soft, coach-led *(unsourced detail)* |
| LIFE | Plain, utilitarian | Less polished Watch app |

**Shared system (fair to reuse, it is expected):** bottom tab bar with 3 to 4 tabs, a single large ring on Home, rounded cards on a light grey or near-black ground, bottom-anchored full-width primary button, segmented range control on charts, native date and time pickers.

**Fast me direction:** an instrument, not a coach. Dark and light both first-class (people check a fast at night). Neutral greys, one accent, no mascot, no illustration in the core flow. Large tabular numerals carry the screen. Three tabs: Fast, History, Settings.

## 7. Screen list for Fast me (feeds components.md)

| ID | Screen | Components |
| --- | --- | --- |
| S01 | Fast: idle (first launch and between fasts) | Start button, preset chips, last-fast summary |
| S02 | Fast: running | Day ring, elapsed timer, goal track, milestone ticks, End button, Edit start |
| S03 | End fast sheet | Sheet, time picker, Save, Save as preset |
| S04 | Edit fast | Sheet, date-time fields, Delete (danger), validation error |
| S05 | History: list | Fast row, section header, Add fast, undo toast, empty state |
| S06 | History: calendar | Month calendar with multi-day bars |
| S07 | History: chart | Segmented control, bar chart, optional weight line, stat tiles |
| S08 | Settings | List rows, switches, milestone hours, Health connect, export |
| S09 | Long-fast safety card (72 h) | Card, dismiss, "don't show again" |
| S10 | Milestone notification and in-app banner | Banner |
