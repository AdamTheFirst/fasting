import { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';

import type { PhaseKey } from '../domain/phases';
import { type Appearance, type ColorRoles, type ThemeId, themes } from './tokens';

export * from './tokens';

export const ThemeContext = createContext<{ theme: ThemeId; appearance: Appearance }>({
  theme: 'butter',
  appearance: 'system',
});

export function useIsDark(): boolean {
  const { appearance } = useContext(ThemeContext);
  const system = useColorScheme();
  return appearance === 'system' ? system === 'dark' : appearance === 'dark';
}

export function useColors(): ColorRoles {
  const { theme } = useContext(ThemeContext);
  const dark = useIsDark();
  const t = themes[theme] ?? themes.butter;
  return dark ? t.dark : t.light;
}

export function phaseColor(c: ColorRoles, key: PhaseKey): string {
  return {
    settling: c.phaseSettling,
    insulin: c.phaseInsulin,
    glycogen: c.phaseGlycogen,
    ketones: c.phaseKetones,
    deep: c.phaseDeep,
  }[key];
}
