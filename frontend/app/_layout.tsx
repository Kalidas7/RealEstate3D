import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { LikedViewedProvider } from '@/contexts/LikedViewedContext';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  // Only do initial boot check once — don't re-run on every segment change
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    const checkOnBoot = async () => {
      try {
        const user = await AsyncStorage.getItem('user');
        if (user) {
          // User is logged in — go to the app
          router.replace('/(tabs)');
        } else {
          // No user — go to login
          router.replace('/');
        }
      } catch {
        router.replace('/');
      } finally {
        setIsReady(true);
      }
    };

    checkOnBoot();
  }, []);

  // Also guard against unauthenticated access to (tabs) after boot
  useEffect(() => {
    if (!isReady) return;

    const guardRoute = async () => {
      const user = await AsyncStorage.getItem('user');
      const inTabs = segments?.[0] === '(tabs)';
      if (!user && inTabs) {
        router.replace('/');
      }
    };

    guardRoute();
  }, [segments, isReady]);

  // Show nothing until the initial auth check is done
  if (!isReady) {
    return <View style={{ flex: 1, backgroundColor: '#0a0a0a' }} />;
  }

  return <>{children}</>;
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
