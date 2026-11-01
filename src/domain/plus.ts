import identity from '../../identity.json';
import type { ThemeId } from '../theme/tokens';

/**
 * Fastaway Plus: one payment, once, for the extras. No subscription, no trial.
 *
 * The rule: anything that tracks, edits or protects a fast is free forever. Fast length, editing,
 * presets, the plan, history, notes, alerts, the safety card and export never check Plus. A test
 * (`plus.test.ts`) fails if one of those files starts to.
 */
export const PLUS_PRODUCT_ID = `${identity.bundleId}.plus`;

/** Shown until the store answers with the local price. */
export const PLUS_FALLBACK_PRICE = '$9.99';

/** The one theme everyone has. The rest come with Plus. */
export const FREE_THEME: ThemeId = 'butter';

export const isThemeFree = (id: ThemeId) => id === FREE_THEME;

/** The theme to draw: a Plus theme falls back to the free one without Plus. The choice is kept. */
export const effectiveTheme = (chosen: ThemeId, plus: boolean): ThemeId =>
  plus || isThemeFree(chosen) ? chosen : FREE_THEME;

/** What Plus adds, in the order the Plus sheet lists it. */
export const PLUS_FEATURES: readonly { title: string; detail: string }[] = [
  { title: 'Widget and lock screen', detail: 'Your fast on the home screen and as a Live Activity.' },
  { title: 'Insights', detail: 'Lengths, weekly hours, your rhythm, weight and BMI charts.' },
  {
    title: 'Health sync',
    detail: 'Weight and height from Apple Health or Health Connect, and body signals.',
  },
  { title: 'More colours', detail: 'The Sage and Powder themes, and any added later.' },
  { title: 'Everything added later', detail: 'New extras come with Plus at no extra cost.' },
];

/** What stays free, said once on the Plus sheet so nobody wonders. */
export const ALWAYS_FREE =
  'Fasts of any length, editing, presets, the plan, history, notes, alerts, the safety card and export stay free, always.';

/** The store's answer, reduced to what we need: which product, and whether it went through. */
export interface OwnedPurchase {
  productId: string;
  purchaseState: 'pending' | 'purchased' | 'unknown';
}

/** True when the store lists Plus as bought. A pending purchase (waiting for a parent, say) is not yet. */
export const ownsPlus = (purchases: readonly OwnedPurchase[]) =>
  purchases.some((p) => p.productId === PLUS_PRODUCT_ID && p.purchaseState === 'purchased');
