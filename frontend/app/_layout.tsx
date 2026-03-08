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

  // Boot — reads AsyncStorage ONCE, seeds in-memory auth state
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
        if (!cancelled) setTimeout(() => setIsBooting(false), 150);
      }
    };
    checkOnBoot();
    return () => { cancelled = true; };
  }, []);

  // Redirect guard — fires when auth state or route changes
  useEffect(() => {
    if (isBooting) return;
    const inTabs = segments?.[0] === '(tabs)';
    if (!isLoggedIn && inTabs) {
      router.replace('/');
    }
  }, [isLoggedIn, segments, isBooting]);

  const inTabs = segments?.[0] === '(tabs)';

  return (
    <View style={{ flex: 1 }}>
      {/* ChatGPT hard-block: if not logged in AND in tabs, render black wall.
          Protected screens never render even for one frame after logout. */}
      {!isLoggedIn && inTabs ? (
        <View style={{ flex: 1, backgroundColor: '#0a0a0a' }} />
      ) : children}
      {/* Splash cover during boot so we don't flash login screen to logged-in users */}
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
