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
    border: '#DDD5C8',
    borderInput: '#857C70',
    text: '#1F1C19',
    textMuted: '#5E5850',
    accent: '#5E3A6E',
    accentSubtle: '#EADFF0',
    onAccent: '#FFFFFF',
    milestone: '#8A5A00',
    danger: '#A3302A',
    onDanger: '#FFFFFF',
    ringTrack: '#E6DFD3',
  },
  dark: {
    bg: '#16141A',
    surface: '#211E26',
    surface2: '#2B2731',
    border: '#38333F',
    borderInput: '#7D7586',
    text: '#F1ECE4',
    textMuted: '#B3ABA0',
    accent: '#C8A6D8',
    accentSubtle: '#3A2B44',
    onAccent: '#24152B',
    milestone: '#E0B25C',
    danger: '#F08A80',
    onDanger: '#2A0603',
    ringTrack: '#2E2A34',
  },
} as const;

export type ColorRoles = { [K in keyof (typeof colors)['light']]: string };

export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48 } as const;
export const radius = { sm: 8, md: 12, lg: 20, full: 9999 } as const;
export const font = {
  xs: { fontSize: 12, lineHeight: 16 },
  sm: { fontSize: 14, lineHeight: 20 },
  md: { fontSize: 16, lineHeight: 24 },
  lg: { fontSize: 20, lineHeight: 28 },
  xl: { fontSize: 28, lineHeight: 34 },
  display: { fontSize: 56, lineHeight: 60 },
} as const;
export const layout = { gutter: 16, minTapTarget: 44, ringDiameter: 264, ringStroke: 14 } as const;
