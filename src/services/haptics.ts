import * as Haptics from 'expo-haptics';

// Small taps that make choices feel physical. Failures are ignored: haptics are a nicety.
const safe = (p: Promise<void>) => void p.catch(() => undefined);

/** Picking one of a few options. */
export const tick = () => safe(Haptics.selectionAsync());

/** Pressing a main button. */
export const press = () => safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
