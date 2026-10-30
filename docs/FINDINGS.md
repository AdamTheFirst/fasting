# Fastaway: research findings

Merged on 2026-10-30 from five research threads: review scouting, the product spec, brand, design recon, and the competitor comparison. Raw material is in [`../replica/`](../replica/). The spec that came out of it is [SPEC.md](SPEC.md).

## TL;DR

- **The gap is real:** the big fasting apps are built for 16:8 beginners. They quiz you (BodyFast takes 20 steps, Fastic about 75, the category average is 19.3), cap or paywall long fasts (Zero stops at 7 days, Fastic at 23:1, Simple paywalls 24 h and 36 h), and trap people in renewals. Billing is the loudest complaint by far.
- **Our angle:** _for people who already know how they fast._ The app opens to a Start button, never limits how long a fast runs, lets you edit every fast, and never charges to track one. "No cap" is the headline proof, but it is not unique on its own: MyFast, Suavita and LIFE allow long fasts too. What no app does is combine all of it: no quiz, no cap, free full history, quiet by default, honest milestones, and a long-fast safety card.
- **Name:** **Fastaway**, store title "Fastaway: Fasting Tracker", picked by Salih. Trademark, store and domain checks are still open.
- **Look:** plum on oat, an instrument rather than a coach. No mascot, no confetti, large tabular numbers, days rather than a 16 h ring.
- **Build:** native from v0.1, one React Native (Expo) codebase. This is needed for Apple Health, Health Connect and reliable milestone alerts. The scaffold is in this repo.
- **Feature score against the big apps: 75%** (24 of 32 weighted points). The gaps are a widget, a Watch app, water tracking and notes. A widget alone would take it to 81%.

## 1. What users hate (review scouting)

79 review rows from 6 source types, 13 pages and 14 apps ([feedback.md](../replica/feedback.md), [fixes.md](../replica/fixes.md), raw rows in [reviews.csv](../replica/reviews.csv)).

| #   | Theme                                     | Rows | Sample                                                                                                      |
| --- | ----------------------------------------- | ---- | ----------------------------------------------------------------------------------------------------------- |
| 1   | Billing traps and hard cancellation       | 24   | "Do not do it. You don't even realize you are giving them permission to charge you" (DoFasting, Trustpilot) |
| 2   | The app decides the fast, not you         | 20   | "The fact that I can't edit End Date and End Time ruins it for me." (Cronometer forum)                      |
| 3   | Clunky to do the one basic thing          | 10   | "Starting a fast seems harder than it should be" (Cronometer forum)                                         |
| 4   | Nags, ads, feeds, bloat (one source only) | 7    | "Update! Upgrade! Here's a tip u didn't ask for!" (about Zero, r/fasting)                                   |

**What's missing:** open-ended and multi-day fasts; goals in days or "until a moment"; history tied to weight; and, from one r/fasting thread, a home-screen widget (about 8 people asked), a Watch app, a calendar, backup and import from Zero.

**Unsolved:** extended fasters are an afterthought; people who already know how they fast get a beginner funnel; and schedules that change day to day aren't supported (Yazio's request for this got 283 votes).

## 2. Market facts

| App      | Long fasts                                       | Price (US)                     | Onboarding                                                              |
| -------- | ------------------------------------------------ | ------------------------------ | ----------------------------------------------------------------------- |
| Zero     | Capped at 7 days (168 h); custom fasts need Plus | $9.99/mo, $69.99/yr            | Plus offer on launch                                                    |
| Fastic   | Up to 23:1, intermittent only                    | $79.99/yr                      | about 75 steps, prize wheel; German consumer action over a "0 €" button |
| BodyFast | Plan-based                                       | up to $69.99/yr                | 20 steps ending in a signed "commitment contract"                       |
| Simple   | 24 h and 36 h behind a paywall                   | $99.99/yr after the promo year | Weight-loss quiz                                                        |
| LIFE     | Warns after 6 days, allows it                    | $39.99/yr                      | Short                                                                   |
| Suavita  | Built for 2, 3 and 5+ day fasts                  | $29.99 to $69.99/yr            | Short                                                                   |
| MyFast   | "Unlimited fast lengths"                         | One-off purchases              | Short                                                                   |

Full matrix: [parity.md](../replica/parity.md).

## 3. Competitor comparison

|          | Where Fastaway differs                                                                                  | Where it's only at parity                                                                                    | Where it's behind                          |
| -------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------ |
| Features | No quiz; no cap; full history and charts free; quiet by default; no trial; 72 h safety card; CSV export | Editing fasts (Zero has this free), Health weight sync, milestones (only the sourced, opt-in framing is new) | Widget, Apple Watch, water tracking, notes |

Recommended next five, from parity.md: (1) a home-screen widget, (2) an Apple Watch app (Zero's has been free since August 2026), (3) import from Zero, since its users are the most likely to switch, (4) free-text notes, (5) a hands-on check of every "?" cell.

## 4. Design recon

From written teardowns, because the screenshot hosts were blocked ([recon.md](../replica/recon.md), [components.md](../replica/design/components.md), [tokens.json](../replica/design/tokens.json)).

- **Take:** one big number and one big button; edit start right from the timer; a list grouped by date with undo; one chart, one calendar, one list.
- **Avoid:** quiz funnels, permission prompts on launch, promo cards on the timer, "fat burning" zones shown as fact, bars scaled for 16 h (a 120 h fast must not flatten the rest), streak freezes, levels and confetti.
- **Our timer:** the ring fills once per 24 h and a day counter steps up, so an open-ended 9-day fast reads well. Elapsed time is the hero; goal progress is a thin second track that appears only when there's a goal.
- **Three tabs:** Fast, History, Settings. Dark and light are both first-class.

## 5. Brand

From [brand.md](../replica/brand.md).

- **Category pattern:** everyone sells weight loss, is drifting into nutrition or AI coaching, shouts ("#1", "works!"), and leans on the word "fast".
- **Our space:** a fasting tool rather than a weight-loss product. Quiet confidence, your rules, days not rings, and honest money as a line in the listing.
- **Positioning:** "For people who already know how to fast." Taglines: "Your fast. Your rules. No ceiling." / "Fast as long as you mean to."
- **Name:** Fastaway. The near mark to watch is **FASTWAY**, a courier company, one letter apart. A lawyer should confirm its classes don't overlap ours (9, 42, 44).
- **Palette (plum on oat), 0 WCAG AA failures:**

| Role              | Light     | Dark      |
| ----------------- | --------- | --------- |
| bg                | `#F6F2EA` | `#16141A` |
| surface           | `#FFFFFF` | `#211E26` |
| text              | `#1F1C19` | `#F1ECE4` |
| muted             | `#5E5850` | `#B3ABA0` |
| primary (plum)    | `#5E3A6E` | `#C8A6D8` |
| milestone (ochre) | `#8A5A00` | `#E0B25C` |
| danger            | `#A3302A` | `#F08A80` |

- **Voice:** plain, steady, trusting. Write "3d 4h", not "You're crushing it! 🔥". Write "Ended. 72h 10m.", not "Congratulations on your journey!". A broken fast is just data.
- **Logo brief:** a horizon line that runs off the frame. No ring, clock, flame or leaf.

## 6. The science behind milestones

Every milestone is off by default and links its source. The wording says what is "likely" happening, never "you are now in".

| Hour      | Message                                                                       | Evidence                                                                                |
| --------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 12 h      | Insulin low, running on liver glycogen                                        | Strong, textbook ([StatPearls](https://www.ncbi.nlm.nih.gov/sites/books/NBK534877/))    |
| 24 h      | Liver glycogen mostly used, shifting to fat                                   | Strong, textbook                                                                        |
| 48 h      | Ketones climbing; growth hormone rising in small studies                      | Moderate, from one study of 6 men ([Ho 1988](https://www.jci.org/articles/view/113450)) |
| 72 h      | Ketones near peak, glucose near its low, plus the safety card                 | Strong ([review, 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12455479/))             |
| Autophagy | **No human data on when it starts.** Shown as an info note, never a countdown | Weak in humans                                                                          |

## 7. Safety and store rules

- **Refeeding** risk rises past about 7 days, small meals are advised after 3 to 5 days, and electrolytes matter. The 72 h card covers this ([NHS Highland](https://rightdecisions.scot.nhs.uk/tam-treatments-and-medicines-nhs-highland/adult-therapeutic-guidelines/gastro-intestinal/refeeding-syndrome-in-adults-guidelines)).
- **Should not fast without a doctor:** people on insulin or sulfonylureas, pregnant people, people with an eating-disorder history, under-18s and underweight people. The card names all of them.
- **Apple 1.4.1:** health apps that give measurements or advice without citations can be rejected. So: no claims in the UI, and every milestone and the card cite sources.
- **Google Play:** the Health apps declaration (category: Nutrition and Weight Management), a separate Health Connect declaration, and a privacy policy.
- **Clinician review** of the milestone and safety text is needed before public launch.

## 8. Limits of this research

- 79 rows is under the 100-row target and skewed toward Trustpilot billing complaints. Two themes rest on a single source.
- The App Store, Google Play, Reddit and the screenshot hosts were blocked from the cloud sandbox, so research went through search and a page reader. Quotes are often truncated, and colours and screens weren't measured.
- Some pricing comes from blogs run by competing products and may be slanted.
- "Hates questionnaires" is mostly Salih's own experience, backed only indirectly by the reviews.
- `replica/scout.py` widens the sample on any machine with open network. A weekly routine is set up but falls back to web search until itunes.apple.com and www.reddit.com are allowed.

## 9. Open items

1. **Name checks:** USPTO, EUIPO, TÜRKPATENT, WIPO, the App Store and Play, `fastaway.app` and `.com`, and social handles. Also get the FASTWAY class check from a lawyer.
2. **Timer shape:** design recon kept a ring that fills once per day, while brand.md argues for "days, not rings". The scaffold uses the day ring because it is in components.md. Decide after dogfooding.
3. **Apple Developer Program** ($99/yr), needed for TestFlight and HealthKit on a real iPhone.
4. **Privacy policy URL** (`EXPO_PUBLIC_PRIVACY_POLICY_URL`), needed by both stores and by Health Connect.
5. **Clinician review** of the milestone and safety text.
6. **Logo and app icon** from the brief. The scaffold still uses Expo's placeholder icons.
