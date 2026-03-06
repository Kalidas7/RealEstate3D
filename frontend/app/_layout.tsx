import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { LikedViewedProvider } from '@/contexts/LikedViewedContext';

export default function RootLayout() {
  const colorScheme = useColorScheme(); // Detect system theme

  return (
    <LikedViewedProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="+not-found" />
        </Stack>

        {/* Status bar adapts too */}
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </ThemeProvider>
    </LikedViewedProvider>
  );
}
