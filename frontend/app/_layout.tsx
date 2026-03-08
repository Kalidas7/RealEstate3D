import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { LikedViewedProvider } from '@/contexts/LikedViewedContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const segments = useSegments();
  const router = useRouter();
  const { isLoggedIn, setLoggedIn } = useAuth();
  const [isBooting, setIsBooting] = useState(true);

  // Boot check — reads AsyncStorage ONCE to seed in-memory auth state
  useEffect(() => {
    let cancelled = false;

    const checkOnBoot = async () => {
      try {
        const user = await AsyncStorage.getItem('user');
        if (cancelled) return;

        const loggedIn = !!user;
        setLoggedIn(loggedIn);

        if (loggedIn) {
          setTimeout(() => router.replace('/(tabs)'), 0);
        }
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

  // Segment guard — runs whenever auth state OR current route changes.
  // Simple pure check: if not logged in and inside tabs → kick to login.
  // No caching, no skipping — just a clean reactive check.
  useEffect(() => {
    if (isBooting) return;

    const inTabs = segments?.[0] === '(tabs)';

    if (!isLoggedIn && inTabs) {
      router.replace('/');
    }
  }, [isLoggedIn, segments, isBooting]);

  return (
    <View style={{ flex: 1 }}>
      {children}
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
