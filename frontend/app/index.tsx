import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from '../screens/Login';

/**
 * app/index.tsx — THE single auth entry point.
 *
 * LOGIC:
 *   1. Renders a black splash while checking AsyncStorage (checked=false).
 *   2. If user exists in storage → router.replace('/(tabs)') — go home.
 *   3. If no user           → render the Login form (checked=true, loggedIn=false).
 *
 * ON LOGIN  → LoginScreen saves user to AsyncStorage, calls router.replace('/(tabs)').
 * ON LOGOUT → Profile calls logout() (clears storage), calls router.replace('/').
 *             This screen mounts again, sees no user, shows Login form. Done.
 *
 * No circular redirects. No re-mount loops. No segment guards.
 */
export default function IndexScreen() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      try {
        const user = await AsyncStorage.getItem('user');
        console.log('[IndexScreen] user in storage:', !!user);

        if (cancelled) return;

        if (user) {
          // Logged in — go straight to tabs, no login screen shown
          console.log('[IndexScreen] → navigating to (tabs)');
          router.replace('/(tabs)');
          // Don't set ready=true; we're navigating away anyway
        } else {
          // Not logged in — show login form
          console.log('[IndexScreen] → showing login form');
          setReady(true);
        }
      } catch (e) {
        console.error('[IndexScreen] AsyncStorage error:', e);
        if (!cancelled) setReady(true); // Show login form on error
      }
    };

    checkAuth();
    return () => { cancelled = true; };
  }, []);

  // While checking: show black splash, no flash
  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: '#0a0a0a' }} />;
  }

  return <LoginScreen />;
}