import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { LikedViewedProvider } from '@/contexts/LikedViewedContext';

/**
 * HOW AUTH WORKS:
 *
 * 1. App starts → _layout.tsx mounts → AuthGuard runs once ([] dependency).
 * 2. It reads AsyncStorage for 'user':
 *    - Found?  → router.replace('/(tabs)')  [home]
 *    - Missing? → router.replace('/')       [login]
 * 3. While checking, a black screen is shown (isReady = false).
 * 4. After the check, the chosen screen renders.
 *
 * Login: app/index.tsx — just shows the form, does NO routing on mount.
 *        After successful login API call, it calls router.replace('/(tabs)').
 *
 * Logout: profile.tsx — calls AsyncStorage.multiRemove then router.replace('/').
 *         This causes segments to change → the segment guard below kicks in
 *         and confirms no 'user' → stays on login (no redirect back to tabs).
 *
 * IMPORTANT: app/index.tsx must NOT call router.replace on mount. That would
 * create a race condition with AsyncStorage that bounces the user back to home.
 */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const segments = useSegments();
  const router = useRouter();
  const [isBooting, setIsBooting] = useState(true);

  // Boot check — runs once when the app first opens
  useEffect(() => {
    let cancelled = false;

    const checkOnBoot = async () => {
      try {
        const user = await AsyncStorage.getItem('user');
        if (cancelled) return;

        if (user) {
          // Wrap in slight timeout to ensure React Navigation context is totally stabilized
          setTimeout(() => {
            router.replace('/(tabs)');
          }, 0);
        } else {
          router.replace('/');
        }
      } catch (err) {
        console.error('[AuthGuard Boot Error]:', err);
      } finally {
        if (!cancelled) {
          // Give navigation time to trigger before uncovering the screen
          setTimeout(() => setIsBooting(false), 200);
        }
      }
    };

    checkOnBoot();
    return () => { cancelled = true; };
  }, []);

  // Segment guard — runs whenever the current route changes.
  // ONLY acts after boot is done, and ONLY kicks unauthenticated
  // users out of the (tabs) group. Does NOT touch the login screen.
  useEffect(() => {
    if (isBooting) return;

    const guard = async () => {
      const user = await AsyncStorage.getItem('user');
      const inTabs = segments?.[0] === '(tabs)';

      if (!user && inTabs) {
        router.replace('/');
      }
    };

    guard();
  }, [segments, isBooting]);

  return (
    <View style={{ flex: 1 }}>
      {children}
      {/* Cover the screen while booting so we don't flash the login UI to logged-in users */}
      {isBooting && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#0a0a0a', zIndex: 999 }} />
      )}
    </View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <LikedViewedProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthGuard>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="+not-found" />
          </Stack>
        </AuthGuard>
        <StatusBar style="light" backgroundColor="#0a0a0a" />
      </ThemeProvider>
    </LikedViewedProvider>
  );
}
