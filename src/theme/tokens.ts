/**
 * Fastaway's colour roles, taken from the Periodiary design kit: three themes (Butter, Sage,
 * Powder blue), each with a light and a dark mode. Pastels are fills only; text and icons are
 * always `text` or `textMuted`, and anything on a pastel fill uses the matching `on…` role.
 * Components use role names only, never raw hex values.
 */
export type ThemeId = 'butter' | 'sage' | 'powder';
export type Appearance = 'system' | 'light' | 'dark';

interface Base {
  bg: string;
  surface: string;
  ink: string;
  muted: string;
  accent: string;
  period: string;
  rule: string;
  hatch: string;
}

/** The fasting phases share one pastel set in every theme, so a phase always reads the same. */
const phasesLight = {
  phaseSettling: '#E7E4DC',
  phaseInsulin: '#F3E3A6',
  phaseGlycogen: '#F1D3BC',
  phaseKetones: '#CFE3D3',
  phaseDeep: '#C9DDF2',
};
const phasesDark = {
  phaseSettling: '#4A4F59',
  phaseInsulin: '#D4C590',
  phaseGlycogen: '#D3B49C',
  phaseKetones: '#B8C9BB',
  phaseDeep: '#B6C7DA',
};

/** Mixes two #RRGGBB colours; `t` is the share of `b`. */
function mix(a: string, b: string, t: number): string {
  const p = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  const out = [0, 1, 2].map((i) => Math.round(p(a, i) * (1 - t) + p(b, i) * t));
  return `#${out.map((v) => v.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

function roles(b: Base, dark: boolean) {
  return {
    bg: b.bg,
    surface: b.surface,
    /** Inputs, inactive tiles and the empty part of tracks. */
    surface2: dark ? mix(b.surface, b.ink, 0.06) : mix(b.bg, b.ink, 0.03),
    border: b.rule,
    borderInput: dark ? mix(b.surface, b.ink, 0.28) : mix(b.surface, b.muted, 0.45),
    text: b.ink,
    textMuted: b.muted,
    textFaint: mix(b.muted, b.surface, dark ? 0.25 : 0.2),
    accent: b.accent,
    accentSubtle: mix(b.surface, b.accent, dark ? 0.22 : 0.45),
    onAccent: dark ? b.bg : b.ink,
    period: b.period,
    periodSubtle: mix(b.surface, b.period, dark ? 0.25 : 0.16),
    onPeriod: dark ? b.bg : b.ink,
    hatch: b.hatch,
    danger: dark ? '#E79A93' : '#A3392F',
    onDanger: dark ? b.bg : '#FFFFFF',
    switchThumbOff: dark ? b.muted : '#FFFFFF',
    ...(dark ? phasesDark : phasesLight),
  };
}

const base: Record<ThemeId, { light: Base; dark: Base }> = {
  butter: {
    light: {
      bg: '#F6F4EE',
      surface: '#FFFFFF',
      ink: '#1B2029',
      muted: '#596170',
      accent: '#F3E3A6',
      period: '#B17B8E',
      rule: '#E4E4E5',
      hatch: '#BDC0C6',
    },
    dark: {
      bg: '#151920',
      surface: '#222730',
      ink: '#EBE9E4',
      muted: '#9DA5B5',
      accent: '#D4C590',
      period: '#B1798D',
      rule: '#3A3E46',
      hatch: '#535965',
    },
  },
  sage: {
    light: {
      bg: '#EFF3EE',
      surface: '#FFFFFF',
      ink: '#141D18',
      muted: '#55645B',
      accent: '#CFE3D3',
      period: '#B77672',
      rule: '#E3E4E3',
      hatch: '#BBC1BD',
    },
    dark: {
      bg: '#111A15',
      surface: '#1F2923',
      ink: '#E7EAE6',
      muted: '#97A89E',
      accent: '#B8C9BB',
      period: '#BA7671',
      rule: '#37403A',
      hatch: '#4F5C54',
    },
  },
  powder: {
    light: {
      bg: '#EEF2F7',
      surface: '#FFFFFF',
      ink: '#16202C',
      muted: '#576171',
      accent: '#C9DDF2',
      period: '#B57C5C',
      rule: '#E3E4E6',
      hatch: '#BCC0C6',
    },
    dark: {
      bg: '#131921',
      surface: '#212831',
      ink: '#E6EAEF',
      muted: '#9BA6B7',
      accent: '#B6C7DA',
      period: '#B67B59',
      rule: '#393F48',
      hatch: '#525A66',
    },
  },
};

export type ColorRoles = ReturnType<typeof roles>;

export const themes: Record<ThemeId, { name: string; light: ColorRoles; dark: ColorRoles }> = {
  butter: { name: 'Butter', light: roles(base.butter.light, false), dark: roles(base.butter.dark, true) },
  sage: { name: 'Sage', light: roles(base.sage.light, false), dark: roles(base.sage.dark, true) },
  powder: {
    name: 'Powder blue',
    light: roles(base.powder.light, false),
    dark: roles(base.powder.dark, true),
  },
};

/** Kept for code that only needs the default theme. */
export const colors = themes.butter;

export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48 } as const;
export const radius = { sm: 8, md: 12, lg: 16, xl: 20, full: 9999 } as const;

/** The Periodiary type scale: 13/16, 15/20, 17/24, 22/28, 28/36, 40/44, plus 20/26 for card titles. */
export const font = {
  xs: { fontSize: 13, lineHeight: 16 },
  sm: { fontSize: 15, lineHeight: 20 },
  md: { fontSize: 17, lineHeight: 24 },
  lg: { fontSize: 20, lineHeight: 26 },
  xl: { fontSize: 22, lineHeight: 28 },
  '2xl': { fontSize: 28, lineHeight: 36 },
  display: { fontSize: 40, lineHeight: 44 },
} as const;

/** Weights stop at 600. Titles and big numbers get a slightly tighter track. */
export const strong = { fontWeight: '600' as const, letterSpacing: -0.4 };
export const bold = { fontWeight: '600' as const };
export const medium = { fontWeight: '500' as const };

/** Numbers that tick or line up in columns. */
export const tabular = { fontVariant: ['tabular-nums' as const] };

/** Periodiary's emphasis border for pastel parts that must stand out. */
export const inkBorder = 2;

export const layout = { gutter: 20, minTapTarget: 44 } as const;
