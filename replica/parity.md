# Fast me vs the major fasting apps

Fast me is judged here by its spec (v0.1, native, features 1 to 11), not a build, because nothing is built yet. So this covers features and pricing only. The layout and behaviour diffs from the replica-diff method need screenshots of a running app, and they come after v0.1.

## Verdict

- **On paper, Fast me covers every must-have.** Timer, any length, editing, history, your own presets and Health weight sync are all in v0.1.
- **Feature score: 75% (24 of 32 weighted points).** That is just under the 80% "shippable" bar. The gaps are the Watch app, the home-screen widget, water tracking and per-fast notes. Adding the widget alone brings it to 81%.
- **Where it really differs:** no quiz, no cap, editing and full history all free, quiet by default, honest pricing, and a long-fast safety card. No big app does all six.
- **Where it is only at parity:** editing fasts (Zero does this free), Health weight sync (Zero, Fastic), milestone stages (all three big apps). Only the free, opt-in and sourced framing is new.
- **"No cap" on its own is not unique.** MyFast, Suavita and LIFE already allow long fasts. The edge is having no cap together with no quiz and free tracking. Zero's 7-day cap only makes it the headline against the biggest app.

## Main matrix

Legend: **D** = Fast me differs (better for our user). **P** = parity. **B** = Fast me behind. **—** = left out on purpose. "?" = not verified (needs a hands-on check).

| Area | Zero | Fastic | BodyFast | Simple | Fast me (spec) | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| Onboarding | Plus offer screens on launch, "continue free" hidden on the last screen | 68-step onboarding, ~6 min quiz, paywall at the end, spin-the-wheel discount if you close it | 20 steps, ends with a signed "commitment contract", then a paywall | Asks for a weight-loss target, builds a plan | One tap to a running fast. No account, no quiz | D |
| Longest fast | Custom fasts up to 7 days (168 h) | Preset schedules 12:12 to 23:1, intermittent only | Plan-based. OMAD reported as paid | 24 h and 36 h windows are premium | No cap. Shown in days, goal optional or "until a date" | D |
| Custom fasts / presets | Plus only (was free before 2021) | Preset schedules ? | Create your own plan: Coach only | Personal programs: paid | Free saved presets plus a per-weekday rhythm | D |
| Edit a fast | Free: start, end, edit | ? | ? | ? | Edit start/end of any fast, running or past. Add past fasts, delete | P (vs Zero) |
| History and charts | Free shows one rolling week. Monthly/yearly charts are Plus | Advanced analytics: Plus | Weight tracking free | ? | Full history plus six charts, all free, tap to edit | D |
| Health sync | Apple Health weight, plus Fitbit/Oura/Google Fit (older help page). Reported as clashing with manual entries | Apple Health, free | ? | Health-app integration | Read and write weight and height, Apple Health and Health Connect | P (narrower than Zero) |
| Milestones / body stages | Fasting Zones (Plus on Play listing) | "Body status" with ketosis phases | Fasting stages, free | ? | Opt-in milestones at 12/24/48/72 h, each sourced. Says plainly that human autophagy timing is unknown | P on feature, D on honesty |
| Notifications by default | Upsell and MyFitnessPal prompts reported | Frequent pushes after install, purchase pop-ups | Contextual paywalls | ? | Nothing fires on a fresh install | D |
| Long-fast safety | None screens for risk | None | "Fasting SOS" for hunger | Doesn't ask about restrictive eating | One skippable card at 72 h: electrolytes, refeeding, who should see a doctor | D |
| Apple Watch | Free app (since Aug 2026) | ? | ? | ? | v0.2+ (complication) | B |
| Home-screen widget | ? | ? | ? | ? | v0.2 (top r/fasting request) | B |
| Water tracking | Plus | Free | Free | ? | Not planned | B |
| Notes / journal | Mood journal: Plus | ? | ? | ? | v0.2: free-text notes per fast | B |
| Export / import | ? | ? | ? | ? | CSV export and import in v0.1 | D ? |
| Food, recipes, coaching, social | Meal logging, Protein Score, articles, challenges | AI food scanner, chatbot, 4,500 recipes, challenges, buddies | Daily coaching, recipes, AI food scanner, challenges, Joker Day | AI coach, recipes | None, by design | — |
| Price (US) | $9.99/mo, $69.99/yr | $12.99 to $14.99/mo, $79.99/yr | $11.99 to $16.99/mo, $34.99 to $69.99/yr | $14.99/mo, $99.99/yr | Tracking free forever. Maybe a one-time supporter unlock later | D |
| Trial and renewal | 7-day trial, yearly plan only, converts to $69.99 | No trial; 14-day refund. German consumer action over a "0 €" button that started a €99/yr contract | Intro prices renew higher. Web trial converts to monthly. Web refund needs 2 weeks of fasting plus 80% of coaching read | Promo year, then a silent $99.99 renewal | No trial, nothing converts | D |

## The long-fast niche

These are the real rivals for the "no ceiling" promise.

| | LIFE | Suavita | MyFast | Fast me |
| --- | --- | --- | --- | --- |
| Long fasts | Warns past 6 days but allows it | Built for 2, 3 and 5+ day fasts, with prep and refeed days | "Unlimited fast lengths" | No cap |
| Price | $4.99/mo, $39.99/yr. Most generous free tier | Subscription, $29.99 to $69.99/yr | One-off in-app purchases | Free |
| Extras | Community Circles, Watch app | Prep and refeed plans | Simple tracker | Presets, charts, Health sync, milestones |
| Where Fast me differs | No community, quieter, free charts | Free, any rhythm instead of set programs | Health sync, charts, milestones, newer | — |

Suavita's prep and refeed days are worth studying: our 72 h safety card covers refeeding as text, while Suavita turns it into a planned day.

## Feature score (replica-diff weighting)

Must 3, should 2, could 1. "Skip" rows are left out.

| Weight | Feature | Fast me |
| --- | --- | --- |
| Must | Start/stop timer | yes |
| Must | Long fasts | yes |
| Must | Edit fasts | yes |
| Must | History | yes |
| Must | Custom presets | yes |
| Must | Health weight sync | yes |
| Should | Milestones / stages | yes |
| Should | Notifications | yes |
| Should | Export | yes |
| Should | Watch app | no (v0.2+) |
| Should | Home-screen widget | no (v0.2) |
| Should | Water tracking | no |
| Could | Notes / journal | no (v0.2) |
| Could | Fitbit / Oura sync | no |
| Skip | Food logging, recipes, coaching, social | out of scope on purpose |

**18 of 18 must points, 6 of 12 should, 0 of 2 could: 24 of 32 = 75%.**

## Top five to build next

1. **Home-screen widget with a live timer.** It is the most-asked feature, it is now possible because v0.1 is native, and it lifts the score to 81%.
2. **Apple Watch app or complication.** Zero made its Watch app free in August 2026, so a Zero user switching over will expect one.
3. **Import from Zero.** Zero is the biggest app and caps at 7 days. Its users are the most likely switchers, and losing their history is what stops them.
4. **Free-text notes per fast.** Zero charges for its journal, and this is cheap to build.
5. **Hands-on check of every "?" cell.** Install Fastic, BodyFast and Simple and check editing, widgets, export and the free-tier history limits. Then run the layout and behaviour diffs once v0.1 runs.

Water tracking stays out unless dogfooding asks for it. It is parity with the big apps, not part of the angle.

## Limits of this comparison

- Most pricing and tier details come from NutriScan and Unstar blog posts. Both run competing or sponsored products, so their framing may be slanted. Zero's App Store page (7-day cap, Watch, Health weight) and the ScreensDesign teardowns (onboarding steps) are first-hand.
- The App Store and Play Store review pages are blocked from this sandbox, so no in-app checks were possible. Every "?" means not verified, not "missing".
- Prices are US and change with promotions.

## Sources

- [Zero App Store listing](https://apps.apple.com/app/zero-fasting-tracker/id1168348542)
- [Zero free vs Plus, 2026 (NutriScan)](https://nutriscan.app/blog/posts/is-zero-app-free-2026-zero-plus-pricing-bb793eebac)
- [Fastic free vs Plus, 2026 (NutriScan)](https://nutriscan.app/blog/posts/fastic-pricing-2026-free-vs-plus-trial-refund-e13d2834f0)
- [BodyFast free vs Coach, 2026 (NutriScan)](https://nutriscan.app/blog/posts/is-bodyfast-free-2026-bodyfast-coach-pricing-129876bac6)
- [Five fasting apps ranked, 2026 (Unstar)](https://unstar.app/blog/zero-simple-fastic-life-fasting-bodyfast-intermittent-fasting-apps-ranked-2026)
- [Fastic onboarding teardown (ScreensDesign)](https://screensdesign.com/showcase/fastic-ai-food-calorie-scanner)
- [BodyFast onboarding teardown (ScreensDesign)](https://screensdesign.com/showcase/bodyfast-intermittent-fasting)
- [r/fasting wiki: fasting apps](https://redlib.groet-infra.nl/r/fasting/wiki/fasting_apps)
- [heise: Fastic "0 €" button](https://www.heise.de/en/news/Weight-loss-app-Fastic-could-also-unknowingly-slim-down-your-wallet-10509156.html?view=print)
- [Suavita App Store](https://apps.apple.com/us/app/-/id1568443548), [MyFast App Store](https://apps.apple.com/app/id1218416683)
- Fast me spec: https://claude.ai/artifact/DNu6GL8DaCBZmaB2JBh6n7
