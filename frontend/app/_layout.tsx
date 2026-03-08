import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useSegments, Redirect } from 'expo-router';
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
  const { isLoggedIn, setLoggedIn } = useAuth();
  const [isBooting, setIsBooting] = useState(true);

  // Boot — reads AsyncStorage ONCE, seeds in-memory auth flag
  useEffect(() => {
    let cancelled = false;
    const checkOnBoot = async () => {
      try {
        const raw = await AsyncStorage.getItem('user');
        if (cancelled) return;
        const loggedIn = !!raw;
        console.log(`[AuthGuard Boot] user found=${loggedIn}`);
        setLoggedIn(loggedIn);
      } catch (err) {
        console.error('[AuthGuard Boot Error]:', err);
        setLoggedIn(false);
      } finally {
        if (!cancelled) setIsBooting(false);
      }
    };
    checkOnBoot();
    return () => { cancelled = true; };
  }, []);

  const inTabs = segments?.[0] === '(tabs)';

  // While booting — cover with black splash so neither screen flashes
  if (isBooting) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
        {children}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#0a0a0a' }} />
      </View>
    );
  }

  // After boot — if user is not authenticated but inside tabs, use
  // Expo Router's <Redirect> component. This is the CORRECT way to
  // navigate from within a nested navigator — router.replace('/') fails
  // because the tabs navigator interprets '/' as its OWN index tab.
  if (!isLoggedIn && inTabs) {
    console.log('[AuthGuard] Not logged in inside tabs → redirecting to login');
    return <Redirect href="/" />;
  }

  return <>{children}</>;
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
