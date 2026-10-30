import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';

import { StoreProvider, useStore } from '../state/store';
import { useHealthSync } from '../state/useHealthSync';
import { strong, ThemeContext, useColors, useIsDark } from '../theme';

function Root() {
  const c = useColors();
  const dark = useIsDark();
  useHealthSync();
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(c.bg);
  }, [c.bg]);
  return (
    <>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: c.bg },
          headerTintColor: c.text,
          headerTitleStyle: { color: c.text, ...strong },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: c.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="fast/[id]" options={{ presentation: 'modal', title: 'Edit fast' }} />
      </Stack>
    </>
  );
}

function Themed() {
  const { settings } = useStore();
  return (
    <ThemeContext.Provider value={{ theme: settings.theme, appearance: settings.appearance }}>
      <Root />
    </ThemeContext.Provider>
  );
}

export default function RootLayout() {
  return (
    <StoreProvider>
      <Themed />
    </StoreProvider>
  );
}
