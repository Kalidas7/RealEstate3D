import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { LikedViewedProvider } from '@/contexts/LikedViewedContext';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const segments = useSegments();
  const router = useRouter();
  // While true, show nothing — prevents any flash to the wrong screen
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const user = await AsyncStorage.getItem('user');
        const currentSegment = segments?.[0] as string ?? '';
        // Any route that is NOT inside (tabs) is considered an auth route (login)
        const inTabsGroup = currentSegment === '(tabs)';

        if (user && !inTabsGroup) {
          // Logged in, send to app
          router.replace('/(tabs)');
        } else if (!user && inTabsGroup) {
          // Not logged in, kick to login
          router.replace('/');
        }
      } catch (error) {
        console.error('Auth check failed', error);
        router.replace('/');
      } finally {
        setIsChecking(false);
      }
    };

    checkAuthStatus();
  }, [segments]);

  // Show a blank dark screen while checking — never show the wrong screen
  if (isChecking) {
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

