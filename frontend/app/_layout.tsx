import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useSegments, useRootNavigationState } from 'expo-router';
import { Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { LikedViewedProvider } from '@/contexts/LikedViewedContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

/**
 * Inner layout that has access to AuthContext (must be inside AuthProvider).
 *
 * Uses Expo Router's declarative <Redirect> instead of imperative
 * router.replace() — this avoids the "action not handled by any navigator"
 * error that happens when calling router.replace across nested navigators.
 */
function InnerLayout() {
  const colorScheme = useColorScheme();
  const { isLoggedIn, isLoading } = useAuth();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  // Wait until both auth state and navigation are ready
  if (isLoading || !navigationState?.key) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#5B8DEF" />
      </View>
    );
  }

  const inAuthGroup = segments[0] === '(auth)';

  // Not logged in and NOT already on an auth screen → redirect to login
  if (!isLoggedIn && !inAuthGroup) {
    return <Redirect href="/(auth)/login" />;
  }

  // Logged in but still on an auth screen → redirect to tabs
  if (isLoggedIn && inAuthGroup) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" backgroundColor="#0a0a0a" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <LikedViewedProvider>
        <InnerLayout />
      </LikedViewedProvider>
    </AuthProvider>
  );
}
