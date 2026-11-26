import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { AppState, View } from 'react-native';

import { getGateState } from '@/src/features/privacy/appGate';
import { bootstrapApp, onAppForeground } from '@/src/features/privacy/bootstrap';
import { useGate } from '@/src/features/privacy/useGate';
import { colors } from '@/src/theme/tokens';

// Keep the splash screen visible until we know where to start.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const gate = useGate();
  const started = useRef(false);

  // Cold start: open DB, check permission (no prompt), pick start route, scan.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    bootstrapApp().catch(() => {
      // Never leave the splash up forever.
    });
  }, []);

  useEffect(() => {
    if (gate.status === 'ready') SplashScreen.hideAsync();
  }, [gate.status]);

  // Foreground return: re-check permission and import new screenshots (FR-2.2).
  useEffect(() => {
    let prev = AppState.currentState;
    const sub = AppState.addEventListener('change', (next) => {
      if (prev !== 'active' && next === 'active') {
        const g = getGateState();
        if (g.status === 'ready') void onAppForeground(g.route);
      }
      prev = next;
    });
    return () => sub.remove();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '700', color: colors.text },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
      </Stack>
    </View>
  );
}
