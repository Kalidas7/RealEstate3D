import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect, useState, useRef } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { LikedViewedProvider } from '@/contexts/LikedViewedContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

/**
 * HOW AUTH WORKS (new memory-based approach):
 *
 * 1. App starts → AuthGuard reads AsyncStorage ONCE for 'user'.
 * 2. Result is stored in AuthContext (in-memory, no disk reads needed later).
 * 3. On login → Login screen calls setLoggedIn(true) → guard sees it instantly.
 * 4. On logout → Profile calls logout() from AuthContext:
 *      a. Clears AsyncStorage (all keys)
 *      b. Sets isLoggedIn = false (synchronous in-memory)
 *      c. AuthGuard's segment effect sees isLoggedIn=false → redirects to '/'
 *    No race condition. No stale disk reads.
 */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const segments = useSegments();
  const router = useRouter();
  const { isLoggedIn, setLoggedIn } = useAuth();
  const [isBooting, setIsBooting] = useState(true);
  // Track previous auth state to avoid duplicate navigations
  const prevLoggedIn = useRef<boolean | null>(null);

  // Boot check — reads AsyncStorage ONCE to seed in-memory auth state
  useEffect(() => {
    let cancelled = false;

    const checkOnBoot = async () => {
      try {
        const user = await AsyncStorage.getItem('user');
        if (cancelled) return;

        const loggedIn = !!user;
        setLoggedIn(loggedIn);
        prevLoggedIn.current = loggedIn;

        if (loggedIn) {
          setTimeout(() => router.replace('/(tabs)'), 0);
        }
        // If not logged in, default route (index / login) is shown automatically
      } catch (err) {
        console.error('[AuthGuard Boot Error]:', err);
        setLoggedIn(false);
      } finally {
        if (!cancelled) {
          setTimeout(() => setIsBooting(false), 200);
        }
      }
    };

    checkOnBoot();
    return () => { cancelled = true; };
  }, []);

  // Segment guard — purely memory-based, no AsyncStorage reads
  useEffect(() => {
    if (isBooting) return;
    // Skip if same as last known state (prevents double navigation)
    if (prevLoggedIn.current === isLoggedIn) return;
    prevLoggedIn.current = isLoggedIn;

    const inTabs = segments?.[0] === '(tabs)';

    if (!isLoggedIn && inTabs) {
      // User just logged out while inside tabs → send to login
      router.replace('/');
    }
  }, [isLoggedIn, segments, isBooting]);

  return (
    <View style={{ flex: 1 }}>
      {children}
      {/* Cover the screen during boot to avoid flash of wrong screen */}
      {isBooting && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#0a0a0a', zIndex: 999 }} />
      )}
    </View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
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
    </AuthProvider>
  );
}
