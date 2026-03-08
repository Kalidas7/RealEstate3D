import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from '../screens/Login';

export default function IndexScreen() {
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    let done = false;
    AsyncStorage.getItem('user').then(raw => {
      if (done) return;
      if (raw) {
        // User exists — navigate to tabs via setTimeout to avoid
        // Expo Router's synchronous render loop with router.replace
        setTimeout(() => router.replace('/(tabs)'), 0);
      } else {
        setShowLogin(true);
      }
    }).catch(() => {
      if (!done) setShowLogin(true);
    });
    return () => { done = true; };
  }, []);

  if (showLogin) return <LoginScreen />;

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#5B8DEF" />
    </View>
  );
}