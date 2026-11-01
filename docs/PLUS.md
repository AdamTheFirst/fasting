# Fastaway Plus: store setup

Plus is one non-consumable in-app purchase, $9.99, no subscription. The code is ready; the stores need
the product before a real purchase can go through. Until then, a development build has an
"Unlock without paying" button on the Plus sheet for testing.

Product ID on both stores: **`com.adamthefirst.fastaway.plus`** (the bundle id from `identity.json` plus
`.plus`, see `src/domain/plus.ts`). Dev builds use a `.development` bundle id, so test purchases need
the product on that app record too, or a release-variant build.

## App Store Connect

1. Agreements, Tax and Banking: sign the Paid Apps agreement and add bank and tax details.
2. Enrol in the App Store Small Business Program (15% commission instead of 30%).
3. Your app → Monetization → In-App Purchases → **+** → Type **Non-Consumable**.
   Reference name "Fastaway Plus", Product ID as above.
4. Price: the $9.99 tier (Apple fills in local prices). Turn on **Family Sharing**.
5. Add a display name and description ("One payment for the widget, Insights, Health sync and more
   colours. No subscription."), and a review screenshot of the Plus sheet.
6. Submit the purchase with the next app version.
7. Test with a Sandbox account (Users and Access → Sandbox) or a StoreKit configuration file.

## Google Play Console

1. Set up a payments profile (Setup → Payments profile) and enrol in the 15% service fee tier.
2. Upload a build that includes `expo-iap` to a testing track first (Play only shows products for an
   app that has a billing-enabled build).
3. Monetize → Products → In-app products → **Create product**: Product ID as above, name
   "Fastaway Plus", price $9.99 (Play converts local prices). Activate it.
4. Add license testers (Setup → License testing) to buy without being charged.

## How the app decides

- Bought or restored: the store says so, the app saves `plusOwned` on the phone.
- At launch the app asks the store once. Only a "yes" changes anything, so an offline phone never
  loses Plus. Refunds are not taken away automatically.
- Delete everything keeps Plus, since it was paid for.
- `src/domain/__tests__/plus.test.ts` fails if any tracking, editing, safety or export file starts
  checking Plus.
