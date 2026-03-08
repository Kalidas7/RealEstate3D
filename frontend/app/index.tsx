import React from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import LoginScreen from '../screens/Login';

/**
 * app/index.tsx — entry point that reacts to auth state.
 *
 * isLoading=true  → show black splash (AsyncStorage not yet read)
 * isLoggedIn=true → Redirect to tabs (user is authenticated)
 * isLoggedIn=false → render Login form
 *
 * No imperative router calls. No loops.
 * AuthContext owns the state; this screen just reacts.
 */
export default function IndexScreen() {
  const { isLoggedIn, isLoading } = useAuth();

  // While AuthContext reads AsyncStorage — show black splash, no flash
  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: '#0a0a0a' }} />;
  }

  // Logged in — redirect to tabs (Redirect component handles correct root navigation)
  if (isLoggedIn) {
    console.log('[IndexScreen] isLoggedIn=true → redirecting to (tabs)');
    return <Redirect href="/(tabs)" />;
  }

  // Not logged in — show login form
  console.log('[IndexScreen] isLoggedIn=false → showing login');
  return <LoginScreen />;
}