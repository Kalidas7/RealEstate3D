import React, { useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import LoginScreen from '../screens/Login';

export default function IndexScreen() {
  const { isLoggedIn, isLoading } = useAuth();
  const router = useRouter();
  const hasNavigated = useRef(false);

  React.useEffect(() => {
    // Only navigate ONCE — prevents the infinite re-render loop
    if (!isLoading && isLoggedIn && !hasNavigated.current) {
      hasNavigated.current = true;
      router.replace('/(tabs)');
    }
  }, [isLoading, isLoggedIn]);

  if (isLoading || isLoggedIn) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#5B8DEF" />
      </View>
    );
  }

  return <LoginScreen />;
}