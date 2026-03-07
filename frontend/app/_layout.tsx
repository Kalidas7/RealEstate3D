import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated'; import 'react-native-reanimated';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { LikedViewedProvider } from '@/contexts/LikedViewedContext';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const user = await AsyncStorage.getItem('user');

        // Check if the first segment belongs to the public auth group
        const authRoutes = ['index', '(auth)'];
        // segments can be undefined briefly, or an empty array.
        const currentSegment = (segments && segments.length > 0) ? (segments[0] as string) : '';
        const inAuthGroup = !currentSegment || authRoutes.includes(currentSegment);

        if (!user && !inAuthGroup) {
          // No user, but trying to access a protected route
          console.log("AuthGuard: Unauthenticated user kicked to login");
          router.replace('/');
        } else if (user && inAuthGroup) {
          // Logged in, but trying to access login page
          console.log("AuthGuard: Authenticated user sent to tabs");
          router.replace('/(tabs)');
        }
      } catch (error) {
        console.error("Auth status check failed", error);
      } finally {
        setIsReady(true);
      }
    };

    checkAuthStatus();
  }, [segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme(); // Detect system theme

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
        {/* Status bar adapts too */}
        <StatusBar style="light" backgroundColor="#0a0a0a" />
      </ThemeProvider>
    </LikedViewedProvider>
  );
}
