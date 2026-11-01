import { DEFAULT_SETTINGS } from '../settings';
import { effectiveTheme, isThemeFree, ownsPlus, PLUS_PRODUCT_ID } from '../plus';

describe('owning Plus', () => {
  it('needs the Plus product, bought', () => {
    expect(ownsPlus([{ productId: PLUS_PRODUCT_ID, purchaseState: 'purchased' }])).toBe(true);
  });

  it('is not unlocked by a pending purchase or another product', () => {
    expect(ownsPlus([{ productId: PLUS_PRODUCT_ID, purchaseState: 'pending' }])).toBe(false);
    expect(ownsPlus([{ productId: 'something.else', purchaseState: 'purchased' }])).toBe(false);
    expect(ownsPlus([])).toBe(false);
  });

  it('starts locked on a fresh install', () => {
    expect(DEFAULT_SETTINGS.plusOwned).toBe(false);
  });
});

describe('themes', () => {
  it('keeps Butter free and the rest with Plus', () => {
    expect(isThemeFree('butter')).toBe(true);
    expect(isThemeFree('sage')).toBe(false);
    expect(isThemeFree('powder')).toBe(false);
  });

  it('draws a Plus theme only with Plus, and falls back to Butter without', () => {
    expect(effectiveTheme('sage', true)).toBe('sage');
    expect(effectiveTheme('sage', false)).toBe('butter');
    expect(effectiveTheme('butter', false)).toBe('butter');
  });
});

/**
 * The promise: anything that tracks, edits or protects a fast never checks Plus. These files are
 * that promise. If one of them starts reading `plus`, `plusOwned` or importing the Plus code, this
 * fails, and the change needs a second look.
 */
const FREE_FOREVER = [
  'src/domain/fast.ts',
  'src/domain/time.ts',
  'src/domain/stats.ts',
  'src/domain/plan.ts',
  'src/domain/notes.ts',
  'src/domain/journal.ts',
  'src/domain/milestones.ts',
  'src/domain/safety.ts',
  'src/domain/csv.ts',
  'src/domain/importers.ts',
  'src/services/notifications.ts',
  'src/components/SafetyCard.tsx',
  'src/app/(tabs)/index.tsx',
  'src/app/(tabs)/plan.tsx',
  'src/app/fast/[id].tsx',
  'src/app/plan/[id].tsx',
  'src/app/action/[verb].tsx',
  'src/app/shortcuts.tsx',
  'src/app/settings/preset/[id].tsx',
  'src/app/settings/reminders.tsx',
  'src/app/settings/data.tsx',
];

// Jest runs under Node; the app's tsconfig has no Node types, so the two calls used are typed here.
declare const require: (id: 'fs') => { readFileSync(path: string, encoding: 'utf8'): string };
declare const __dirname: string;

describe('free forever', () => {
  const root = `${__dirname}/../../../`;
  it.each(FREE_FOREVER)('%s never checks Plus', (file) => {
    const source = require('fs').readFileSync(root + file, 'utf8');
    // The Plus modules, the saved flag, `store.plus`, or `{ plus }` taken from the store.
    expect(source).not.toMatch(/domain\/plus|components\/Plus|services\/purchases/);
    expect(source).not.toMatch(/\bplusOwned\b|\.plus\b|[{,]\s*plus\s*[,}]/);
  });
});
