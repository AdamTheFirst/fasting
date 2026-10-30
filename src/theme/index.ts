import { useColorScheme } from 'react-native';

import { type ColorRoles, colors } from './tokens';

export * from './tokens';

export function useColors(): ColorRoles {
  return useColorScheme() === 'dark' ? colors.dark : colors.light;
}
