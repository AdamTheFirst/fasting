# Fast me: purpose and MVP spec

Snapshot of 2026-10-30 morning. The live, updated spec (charts, Health sync, milestone alerts, native-first) is the Claude doc: https://claude.ai/artifact/DNu6GL8DaCBZmaB2JBh6n7

## Purpose

**A fasting tracker for people who already know how they fast.** It opens to a Start button, runs any fast for as long as you choose, lets you edit every fast after the fact, and never charges you to track one.

Who it is for: experienced fasters, especially people who do 24 h to multi-day fasts, change their rhythm day to day, and have been put off by quizzes, caps and surprise renewals. The founder is the first user: they fast a lot, lost the habit over the last six months, and deleted the last app after a 15-minute questionnaire.

What success looks like: the founder is fasting again on it within a month, and an extended faster can start, finish and fix a 5-day fast without fighting the app.

## Principles

1. **The user decides.** No plan is pushed on you. Defaults are suggestions you can ignore.
2. **Zero friction to start.** No account, no quiz, no paywall in the path to Start.
3. **No ceiling.** No length cap, no paywalled durations, days shown as days.
4. **Honest.** Tracking is free forever. No trials that convert. No dark patterns.
5. **Quiet.** Nothing pings you that you did not turn on.
6. **Your data.** On device first, exportable, deletable.

## MVP scope (v0.1)

| # | Feature | Acceptance check |
| --- | --- | --- |
| 1 | **Start screen.** First launch shows a Start button and nothing else required. | Fresh install to a running fast in one tap, no sign-in. |
| 2 | **Any length.** Open-ended by default. Optional goal in hours, days, or "until <date time>". | A 14-day fast runs, displays as `13d 22h 05m`, and nothing caps or auto-stops it. |
| 3 | **Edit everything.** Change start and end time of any fast, past or running; delete a fast; add a past fast by hand. | Edit a 3-day-old fast's start time; history and totals update. |
| 4 | **Presets you make.** Save your own (e.g. "72 h monthly", "20:4", "OMAD"). Optional per-weekday rhythm. | Create a preset in under 3 taps from the end of a fast. |
| 5 | **History.** Calendar of fasts, list view, longest fast, total hours this month, and streaks you define. | After 10 fasts, the calendar and longest-fast record are correct. |
| 6 | **Long-fast safety card.** One skippable card when a goal or running fast passes 72 h: electrolytes, refeeding slowly, warning signs, see a doctor if on insulin, pregnant, under 18, or with an eating-disorder history. Shown once per fast, never blocks. | Card appears at 72 h, dismisses in one tap, can be turned off. |
| 7 | **Alerts you choose.** Off by default; optional milestones (e.g. 24 h, goal reached). | No notification ever fires on a fresh install. |
| 8 | **Export and import.** CSV export and import of all fasts. | Round-trip export then import gives identical history. |

**Platform for v0.1:** a PWA (installable web app, works offline, data in the browser) so the founder can use it on their phone this week without app-store review. Native iOS/Android comes after the PWA proves the loop.

## Next (v0.2 and later, ranked)

1. Home-screen widget with live timer (needs native; most-requested in the r/fasting thread).
2. Apple Health / Health Connect: write fasts, read weight for an optional weight line on the history chart.
3. Apple Watch complication.
4. Optional weight and notes per fast (energy, mood) as free text, not a scored questionnaire.
5. Import from Zero and other apps' exports.
6. Optional encrypted sync across devices.

## Non-goals

- No onboarding questionnaire, quiz, body-type profile or "personal plan".
- No calorie counting, meal plans, recipes, coaching, or AI coach.
- No social feed, community, leaderboards or challenges.
- No ads. No subscription required to track any fast, of any length.
- No medical claims: no "fat burning stage" timers presented as fact, no diagnosis, no treatment advice.
- Not for under-18s, and not marketed for weight loss.

## Money (later, not MVP)

If it ever earns money: a one-time "supporter" unlock for extras like themes or sync, never for fast length or editing. No free trial that turns into a charge. Cancellation, if any subscription ever exists, takes one tap.

## Limitations

### Of this research

- **79 rows is small and skewed.** The skill target is 100+. Most rows come from Trustpilot (billing-heavy, angry customers) and one Cronometer forum; the "nags and clutter" and "integrations" themes rest on a single source each.
- **The main stores were not reachable.** This sandbox's network policy blocks itunes.apple.com, play.google.com, reddit.com and most review APIs (every request returned a proxy 403). Research went through a search engine and page reader instead, which caps quotes and misses most store reviews.
- **No paying-intent or volume data.** We know what people hate, not how many extended fasters exist or what they would pay.
- **The "people who hate questionnaires" angle is mostly the founder's own experience**, backed indirectly by the rigid-schedule rows.

### Technical

- A PWA cannot show a home-screen widget, a Watch complication, or write to Apple Health; those need native code.
- iOS limits background work and local notifications from PWAs, so milestone alerts must be scheduled from start time, not computed by a running timer. The timer itself must be derived from stored start time, never a ticking counter, so multi-day fasts survive the phone restarting.
- Browser storage can be cleared by the OS or the user, which is why CSV export is in the MVP.
- Time zones and DST: a multi-day fast can cross both. Store UTC timestamps; display local.

### Platform and store

- **Apple guideline 1.4.1 (physical harm):** health apps that give health measurements or advice can be rejected without citations or regulatory clearance; one 2026 developer was rejected even with wellness-only disclaimers ([Apple forums](https://developer.apple.com/forums/thread/807508), [another](https://developer.apple.com/forums/thread/696430)). Keep claims out of the UI and cite sources in the safety card.
- **Google Play Health apps declaration:** every app must complete it; ours falls under "Nutrition and Weight Management" ([Play Console help](https://support.google.com/googleplay/android-developer/answer/14738291)). Health Connect access needs its own declaration and a privacy policy.
- Both stores require a privacy policy, account deletion if there are accounts, and accurate privacy labels. Staying on-device with no account keeps this small.

### Health and safety

- Refeeding risk rises past about 7 days and the r/fasting wiki advises small meals after about 3 to 5 days; electrolytes (sodium, potassium, magnesium) matter during long fasts ([r/fasting wiki](https://redlib.groet-infra.nl/r/fasting/wiki/refeeding_syndrome), [NHS Highland guidance](https://rightdecisions.scot.nhs.uk/tam-treatments-and-medicines-nhs-highland/adult-therapeutic-guidelines/gastro-intestinal/refeeding-syndrome-in-adults-guidelines)).
- Groups who should not fast without a doctor: people on insulin or sulfonylureas, pregnant people, people with an eating-disorder history, under-18s, underweight people, and some heart or blood-pressure medications ([summary](https://scienceinsights.org/who-should-not-intermittent-fast-groups-at-risk/)).
- "No limits" is the product's promise, so the app must not become a tool that encourages harm. That is why the safety card exists, why there are no streak penalties or "don't break the chain" pressure, and why it is not marketed for weight loss.
- This is not medical advice and the app must say so once, plainly. Have the safety card text read by a clinician before any public launch.

## What we need to do

1. **Approve this spec** or mark what to change. Decisions open: PWA first (recommended) vs native first; app name.
2. **Build v0.1 as a PWA** (features 1 to 8). Roughly a few days of work.
3. **Founder dogfoods it for 2 to 4 weeks** and logs what annoys them.
4. **Widen the research with the scout script** on a machine with open network (below), aiming for 300+ rows including real App Store reviews.
5. Then decide on native iOS, the widget, and Health integration.

## Recurring scouting (proposal, not yet set up)

`scout.py` collects new App Store reviews (Zero, Suavita, MyFast, Easy Fast across US, UK, DE, TR) and new r/fasting, r/waterfasting and r/intermittentfasting posts mentioning "app" or "tracker", skips rows already in `reviews.csv`, and `reviews.py` re-ranks the themes. Run it with `python3 scout.py reviews.csv && python3 reviews.py reviews.csv`. Edit `apps.json` to add apps.

It cannot run from this cloud sandbox because the network policy blocks those sites. Two ways to make it automatic:

- **Weekly cloud routine** (Monday 08:00): runs the two scripts and opens a PR with new rows and a short "what changed" note. Needs itunes.apple.com and www.reddit.com allowed in the environment's network settings.
- **Run it on your own computer** when you want fresh data, no setup beyond Python 3.
