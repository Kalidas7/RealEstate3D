import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { LikedViewedProvider } from '@/contexts/LikedViewedContext';
import { AuthProvider } from '@/contexts/AuthContext';

/**
 * ROOT LAYOUT — intentionally has NO auth logic.
 *
 * HOW AUTH WORKS (Expo Router recommended pattern):
 *
 * app/index.tsx is the entry point. It:
 *   1. Reads AsyncStorage ONCE on mount
 *   2. If user found  → router.replace('/(tabs)')   [go home]
 *   3. If no user     → renders the Login form
 *
 * On LOGIN success:
 *   - Login screen saves user to AsyncStorage, then router.replace('/(tabs)')
 *
 * On LOGOUT:
 *   - Profile screen calls logout() (clears AsyncStorage, clears AuthContext)
 *   - Then router.replace('/') → back to index → no user → shows Login form
 *
 * No guards, no circular redirects, no re-mount loops.
 */
export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <LikedViewedProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="light" backgroundColor="#0a0a0a" />
        </ThemeProvider>
      </LikedViewedProvider>
    </AuthProvider>
  );
}
