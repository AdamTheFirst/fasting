import {
  endConnection,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  isUserCancelledError,
  type Purchase,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  restorePurchases,
} from 'expo-iap';
import { Platform } from 'react-native';

import { ownsPlus, PLUS_PRODUCT_ID } from '../domain/plus';

/**
 * The one-time Plus purchase, through the App Store or Google Play. No server of ours: the store
 * keeps the receipt, and the phone asks the store what you own. Nothing about your fasts goes with it.
 */
const enabled = Platform.OS === 'ios' || Platform.OS === 'android';

let connected: Promise<boolean> | null = null;

function connect(): Promise<boolean> {
  if (!enabled) return Promise.resolve(false);
  connected ??= initConnection()
    .then(() => true)
    .catch(() => {
      connected = null;
      return false;
    });
  return connected;
}

/** The local price ("€9,99", "$9.99"), or null when the store can't be reached. */
export async function plusPrice(): Promise<string | null> {
  if (!(await connect())) return null;
  try {
    const products = await fetchProducts({ skus: [PLUS_PRODUCT_ID], type: 'in-app' });
    const plus = (products ?? []).find((p) => p.id === PLUS_PRODUCT_ID);
    return plus?.displayPrice ?? null;
  } catch {
    return null;
  }
}

/** Asks the store whether Plus is owned. Null when it can't tell (offline, no store account). */
export async function checkPlus(): Promise<boolean | null> {
  if (!(await connect())) return null;
  try {
    return ownsPlus(await getAvailablePurchases());
  } catch {
    return null;
  }
}

/** Restore: sync with the store, then check. */
export async function restorePlus(): Promise<boolean | null> {
  if (!(await connect())) return null;
  try {
    await restorePurchases();
  } catch {
    // Some stores refuse a sync without a signed-in account; the check below still answers.
  }
  return checkPlus();
}

/** Opens the store's own payment sheet. The answer arrives through `listenForPlus`. */
export async function buyPlus(): Promise<void> {
  if (!(await connect())) throw new Error('The store is not available on this phone.');
  await requestPurchase({
    request: { apple: { sku: PLUS_PRODUCT_ID }, google: { skus: [PLUS_PRODUCT_ID] } },
    type: 'in-app',
  });
}

/**
 * Calls `onOwned` when a Plus purchase goes through (now, or one the store replays at launch), and
 * `onError` with a plain message when it fails. Cancelling is not an error. Returns an unsubscribe.
 */
export function listenForPlus(onOwned: () => void, onError: (message: string) => void): () => void {
  if (!enabled) return () => {};
  void connect();
  const updated = purchaseUpdatedListener((purchase: Purchase) => {
    if (purchase.productId !== PLUS_PRODUCT_ID || purchase.purchaseState !== 'purchased') return;
    onOwned();
    // A one-time purchase: not consumable. Finishing tells the store we delivered it.
    void finishTransaction({ purchase, isConsumable: false }).catch(() => {});
  });
  const failed = purchaseErrorListener((error) => {
    if (isUserCancelledError(error)) return;
    onError(error.message || 'The purchase did not go through.');
  });
  return () => {
    updated.remove();
    failed.remove();
  };
}

export function closeStore(): void {
  if (!connected) return;
  connected = null;
  void endConnection().catch(() => {});
}
