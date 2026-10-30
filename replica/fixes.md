# Fasting apps: what users hate, what's missing, and our angle

Scouted 2026-10-30 with the replica-entrepreneur method.

**Sample size: 68 verbatim review rows** from 11 pages across 5 source types (Trustpilot, Apple App Store pages, Cronometer community forum, one large r/fasting thread, PissedConsumer), covering 9 apps (Zero, LIFE, Fastic, FastEasy, DoFasting, FitFast, MyFast, Suavita, Cronometer). That is under the skill's 100-row target, so treat the ranking as directional. Raw rows: [reviews.csv](reviews.csv). Ranked themes: [feedback.md](feedback.md).

**What could not be reached, and why.** Apple's official reviews RSS feed and iTunes Search API were blocked from this environment (robots/proxy), Google Play review pages were not reachable, and Reddit was only readable through a mirror. The page reader I used caps quotes at about 125 characters, so many quotes are the opening of a longer review rather than the whole thing. Every row links to its page. Where I only had a paraphrase (most of the Reddit feature requests), it is labelled as a paraphrase below and kept out of `reviews.csv`.

## Market facts (sourced, not reviews)

| App | Long fast limit | Price | Source |
| --- | --- | --- | --- |
| Zero | Caps fasts at 168 h (7 days). Plus is $69.99/yr on the US store. | free + sub | [r/fasting wiki](https://redlib.groet-infra.nl/r/fasting/wiki/fasting_apps), [App Store](https://apps.apple.com/us/app/-/id1168348542) |
| Fastic | Longest protocol is 23:1, intermittent only | free + sub | [r/fasting wiki](https://redlib.groet-infra.nl/r/fasting/wiki/fasting_apps) |
| LIFE | Warns past 6 days but allows it | free + $2.99/mo | [r/fasting wiki](https://redlib.groet-infra.nl/r/fasting/wiki/fasting_apps) |
| Simple | Some 24 h and 36 h fasts are paywalled (per a 2026 review roundup) | $99.99/yr after promo | [unstar.app roundup](https://unstar.app/blog/zero-simple-fastic-life-fasting-bodyfast-intermittent-fasting-apps-ranked-2026) |
| BodyFast | 20 onboarding steps, ending in a signed "commitment contract", then a paywall | sub | [ScreensDesign teardown](https://screensdesign.com/showcase/bodyfast-intermittent-fasting) |
| Suavita | Built for 2, 3, 5+ day fasts with prep and refeed days | sub, $29.99 to $69.99/yr | [App Store](https://apps.apple.com/us/app/-/id1568443548) |
| MyFast | "Unlimited Fast Lengths", one-off unlocks | one-off IAP | [App Store](https://apps.apple.com/app/id1218416683) |

Fastic is also the subject of German consumer-protection action over a "0 €" button that started a €99/yr contract ([heise, 2025](https://www.heise.de/en/news/Weight-loss-app-Fastic-could-also-unknowingly-slim-down-your-wallet-10509156.html?view=print)). Yazio's top fasting request, "change days/rhythms individually", reached 283 votes before it shipped ([Yazio board](https://yazioen.featureupvote.com/suggestions/36405/fasting-change-daysrhythms-individually)).

## 1. What they hate

1. **Billing traps and hard cancellation.** 22 rows, 4 source types. The loudest theme by far, mostly quiz-funnel apps (FastEasy, DoFasting, FitFast) plus Zero's paywall creep.
   - "Do not do it. You don't even realize you are giving them permission to charge you, yet, it happens." ([DoFasting, Trustpilot, 1★, 2026](https://ie.trustpilot.com/review/dofasting.com))
   - "half the features for $80 a year" (about Zero, [r/fasting](https://nyc1.lr.ggtyler.dev/r/fasting/comments/1b779dt/i_made_a_free_weight_loss_fasting_app))
2. **The app decides the fast, not you.** 20 rows, 3 source types. Fixed defaults, fasts that auto-stop, schedules you can't edit.
   - "The fact that I can't edit End Date and End Time ruins it for me." ([Cronometer forum](https://forums.cronometer.com/discussion/comment/18470))
   - "This app is frustrating.It won't let me track water or edit my fasting time." ([FitFast, Trustpilot, 2★, 2025](https://www.trustpilot.com/review/fitfast.com?page=4))
3. **Clunky to do the one basic thing.** 10 rows, 4 source types.
   - "Starting a fast seems harder than it should be" ([Cronometer forum](https://forums.cronometer.com/discussion/3506/changes-to-fasting))
   - "I stopped using it; it was too cumbersome." (same thread)
4. **Nags, ads, social feeds, feature bloat.** 7 rows, **thin: one Reddit thread only.**
   - "Update! Upgrade! Here's a tip u didn't ask for!" (about Zero, [r/fasting](https://nyc1.lr.ggtyler.dev/r/fasting/comments/1b779dt/i_made_a_free_weight_loss_fasting_app))
   - "weighed down by ads and 100+ features" (same thread)

## 2. What is missing

1. **Real long and open-ended fasts.** 8 rows, 2 source types, plus the hard caps in the table above.
   - "Is there a way to do an open ended fast?" ([Cronometer forum](https://forums.cronometer.com/discussion/3506/changes-to-fasting))
   - "can measure fasts longer than 24 hours (why is this even an issue with other apps?)" ([MyFast, App Store](https://apps.apple.com/app/id1218416683))
2. **Duration in days, or "until a moment", not just hours.**
   - "I'd like to be able to edit Duration in Days and Hours (and Minutes) ideally, not just Hours." ([Cronometer forum](https://forums.cronometer.com/discussion/comment/18470))
   - "Sometimes I go until a milestone like a certain meal in the future and I don't want to calculate the hours." (same)
3. **History you can see, tied to weight.** 4 rows, 2 source types.
   - "I don't see any way to correlate it with my weight loss" ([Cronometer forum](https://forums.cronometer.com/discussion/3506/changes-to-fasting))
4. **From the r/fasting thread, paraphrased, one source, so thin:** a home-screen widget (about 8 commenters asked), Apple Watch app and complication (3), a fasting calendar and multi-day planner (2), per-weekday durations (1), backup, import from Zero and a longest-fast record (2), and keep it simple (1). ([thread](https://nyc1.lr.ggtyler.dev/r/fasting/comments/1b779dt/i_made_a_free_weight_loss_fasting_app))

## 3. What is unsolved

1. **Extended fasters are an afterthought.** The big apps are built around 16:8 and cap or warn on long fasts (Zero 7 days, Fastic 23:1). The one app that does serve them gets thanked for it: "I appreciate that this is geared specifically for long fasts which is hard to find" ([Suavita, App Store, 5★](https://apps.apple.com/us/app/-/id1568443548)).
2. **People who already know how they fast.** Quiz funnels (BodyFast's 20 steps) and coaching assume a beginner who needs a plan. Experienced fasters want a tool that gets out of the way. Evidence for this is indirect: the "can't edit / auto-stop / defaults to 16 hours" rows and Salih's own experience, not reviews that name the questionnaire. **Thin.**
3. **People whose schedule changes day to day.** "My fasting schedule changes, day to day. Too cumbersome." ([Cronometer forum](https://forums.cronometer.com/discussion/comment/18470)), plus Yazio's 283-vote request. Two sources.

## 4. Fix plan

| # | What to build | Size | Skill | Evidence |
| --- | --- | --- | --- | --- |
| 1 | **Zero-question start.** First screen is a Start button. No account, no quiz. | S | replica-design | Clunky (10 rows), BodyFast's 20-step funnel |
| 2 | **Open-ended and multi-day fasts with no cap.** Timer counts days:hours. Set a goal in hours, days, or "until Sunday 19:00", or no goal at all. | S | replica-backend | Long fast (8 rows), Zero 168 h cap, Fastic 23:1 |
| 3 | **You own every fast.** Edit start and end after the fact, never auto-stop, no forced names, delete any fast. | S | replica-backend | Rigid (20 rows) |
| 4 | **Custom protocols.** Save your own presets (e.g. 72 h monthly, 20:4 weekdays, OMAD weekends), per-weekday rhythms. | M | replica-design | Rigid, Yazio 283 votes |
| 5 | **Honest pricing.** Everything that tracks a fast is free forever. If there is ever a paid tier, one-time unlock, no trial that converts. | S | /replica-launch | Billing (22 rows, 4 sources) |
| 6 | **History that motivates.** Calendar of fasts, longest-fast record, streaks you set, optional weight line on the same chart. | M | replica-design | History (4 rows), Reddit requests |
| 7 | **Quiet by default.** No tips, feeds, or upgrade nags. Only the milestone alerts you turn on. | S | replica-design | Clutter (thin, 1 source) |
| 8 | **Widget and export.** Home-screen widget with live timer; CSV export and import. | M | replica-backend | Reddit requests (thin) |

Safety note for long fasts: no app reviewed screens anything, and the roundup above flags that as a risk. A short, skippable note on electrolytes and refeeding for fasts over 72 h is cheap and responsible without becoming a questionnaire.

## 5. The angle

**A.** For long fasters who hit a 7-day cap or a 23:1 ceiling, our app runs any fast for as long as you choose, in days, with no limit. Evidence: long_fast_support, 8 rows across 2 sources, plus documented caps in Zero and Fastic.

**B.** For people who already know how they fast and hate being quizzed, coached, and nagged, our app opens to a Start button and lets you edit every fast however you like. Evidence: rigid_schedule_no_control, 20 rows across 3 sources, plus clunky_ux_bugs, 10 rows across 4.

**C.** For anyone burned by surprise renewals, our app keeps everything that tracks a fast free, with no trials that turn into charges. Evidence: billing_dark_patterns, 22 rows across 4 sources.

**Recommendation: B, with A as the headline proof.** B has the broadest evidence and matches why Salih deleted the last app. A is the sharpest single feature to show it ("track a 10-day fast without fighting the app"). C is real but works better as a promise in the store listing than as the identity of the app.

Next step: `/replica-brand` for a name and voice built on angle B. Don't use any competitor's name in our name, ads, or store listing.
