import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import LoginScreen from '../screens/Login';

/**
 * app/index.tsx — auth entry point.
 *
 * isLoading=true   → black splash while AuthContext reads AsyncStorage
 * isLoggedIn=true  → navigate to tabs (runs once via useEffect)
 * isLoggedIn=false → render login form
 *
 * On LOGOUT: Profile clears storage → reloads the app → AuthContext reads
 *            empty storage → isLoggedIn=false → this screen shows login form.
 *            No Redirect loops. App is fully reset.
 */
export default function IndexScreen() {
  const { isLoggedIn, isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && isLoggedIn) {
      router.replace('/(tabs)');
    }
  }, [isLoading, isLoggedIn]);

  // While loading or navigating away — black splash
  if (isLoading || isLoggedIn) {
    return <View style={{ flex: 1, backgroundColor: '#0a0a0a' }} />;
  }

  // Not logged in — show login form
  return <LoginScreen />;
}