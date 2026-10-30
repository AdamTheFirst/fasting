import { Platform } from 'react-native';

/**
 * Role tokens from the design system (replica/design/tokens.json) with the
 * brand palette from brand.md ("plum on oat") swapped in for the placeholder teal.
 * Components use role names only, never raw hex values.
 */
export const colors = {
  light: {
    bg: '#F6F2EA',
    surface: '#FFFFFF',
    surface2: '#EDE7DC',
    border: '#E2DACD',
    borderInput: '#857C70',
    text: '#1F1C19',
    textMuted: '#5E5850',
    textFaint: '#8C8478',
    accent: '#5E3A6E',
    accentSubtle: '#EADFF0',
    accentSoft: '#B79CC4',
    onAccent: '#FFFFFF',
    hero: '#4A2D57',
    onHero: '#F6F2EA',
    onHeroMuted: '#D9C9E0',
    onHeroMilestone: '#E0B25C',
    milestone: '#8A5A00',
    milestoneSubtle: '#F4E8D0',
    success: '#2F6B43',
    danger: '#A3302A',
    onDanger: '#FFFFFF',
    ringTrack: '#E6DFD3',
    switchThumbOff: '#FFFFFF',
  },
  dark: {
    bg: '#16141A',
    surface: '#211E26',
    surface2: '#2B2731',
    border: '#332E3A',
    borderInput: '#7D7586',
    text: '#F1ECE4',
    textMuted: '#B3ABA0',
    textFaint: '#857E75',
    accent: '#C8A6D8',
    accentSubtle: '#3A2B44',
    accentSoft: '#6F5880',
    onAccent: '#24152B',
    hero: '#2E2236',
    onHero: '#F1ECE4',
    onHeroMuted: '#C6B5CF',
    onHeroMilestone: '#E0B25C',
    milestone: '#E0B25C',
    milestoneSubtle: '#3A2E17',
    success: '#8FCB9F',
    danger: '#F08A80',
    onDanger: '#2A0603',
    ringTrack: '#2E2A34',
    switchThumbOff: '#B3ABA0',
  },
} as const;

export type ColorRoles = { [K in keyof (typeof colors)['light']]: string };

export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48 } as const;
export const radius = { sm: 8, md: 12, lg: 20, xl: 28, full: 9999 } as const;
export const font = {
  xs: { fontSize: 12, lineHeight: 16 },
  sm: { fontSize: 14, lineHeight: 20 },
  md: { fontSize: 16, lineHeight: 24 },
  lg: { fontSize: 20, lineHeight: 28 },
  xl: { fontSize: 28, lineHeight: 34 },
  '2xl': { fontSize: 40, lineHeight: 46 },
  display: { fontSize: 56, lineHeight: 62 },
} as const;

/**
 * The brand's soft serif for titles, the wordmark and big numbers. System fonts only
 * (Georgia on iOS, Noto Serif on Android), so nothing extra ships in the app.
 */
export const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' });

/** Numbers that tick or line up in columns. */
export const tabular = { fontVariant: ['tabular-nums' as const] };

export const layout = { gutter: 20, minTapTarget: 44 } as const;
