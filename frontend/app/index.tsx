import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

/**
 * app/index.tsx — Entry point redirector.
 *
 * This screen never renders UI. The root _layout.tsx InnerLayout
 * handles all auth-based routing via <Redirect>.
 * This file exists because Expo Router requires a root index route.
 */
export default function IndexScreen() {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#5B8DEF" />
      </View>
    );
  }

  if (isLoggedIn) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
