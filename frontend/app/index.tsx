import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import LoginScreen from '../screens/Login';

export default function IndexScreen() {
  const { isLoggedIn, isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && isLoggedIn) {
      router.replace('/(tabs)');
    }
  }, [isLoading, isLoggedIn]);

  // While loading or navigating away — styled splash (not a bare black screen)
  if (isLoading || isLoggedIn) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#5B8DEF" />
      </View>
    );
  }

  // Not logged in — show login form
  return <LoginScreen />;
}