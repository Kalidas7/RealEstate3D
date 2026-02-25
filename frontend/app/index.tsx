import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useColorScheme } from '@/hooks/use-color-scheme';

const API_URL = 'http://192.168.1.6:8000/api';

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [step, setStep] = useState<'email' | 'login' | 'signup'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If we just logged out, don't auto-redirect
    if (params.logout === 'true') {
      // Force clear ALL storage
      AsyncStorage.clear().then(() => {
        console.log('All storage cleared on logout');
      });
      return; // Stay on login screen
    }
    checkUser();
  }, [params.logout]);

  const checkUser = async () => {
    try {
      const user = await AsyncStorage.getItem('user');
      console.log('Stored user data:', user);
      if (user) {
        const parsed = JSON.parse(user);
        console.log('Parsed user:', parsed);
        router.replace('/(tabs)');
      } else {
        console.log('No user found, staying on login');
      }
    } catch (e) {
      console.error('Error checking user:', e);
      // Clear corrupted data
      await AsyncStorage.removeItem('user');
    }
  };

  const handleCheckEmail = async () => {
    if (!email) return Alert.alert('Error', 'Please enter an email');
    setLoading(true);
    try {
      console.log('Attempting email check for:', email);
      console.log('API URL:', `${API_URL}/check-email/`);
      const response = await fetch(`${API_URL}/check-email/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      const responseText = await response.text();
      console.log('Raw response:', responseText.substring(0, 200));

      try {
        const data = JSON.parse(responseText);
        if (response.ok) {
          if (data.exists) {
            setStep('login');
          } else {
            setStep('signup');
          }
        } else {
          Alert.alert('Error', data.error || 'Something went wrong');
        }
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Response was:', responseText);
        Alert.alert('Server Error', 'The server returned an invalid response. Please check if Django is running correctly.');
      }
    } catch (error) {
      console.error('Network error:', error);
      Alert.alert('Error', 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!password) return Alert.alert('Error', 'Please enter password');
    setLoading(true);
    try {
      console.log('Attempting login for:', email);
      console.log('API URL:', `${API_URL}/login/`);
      const response = await fetch(`${API_URL}/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      console.log('Login response status:', response.status);

      const responseText = await response.text();
      console.log('Login raw response:', responseText.substring(0, 200));

      try {
        const data = JSON.parse(responseText);
        console.log('Login response:', data);
        if (response.ok) {
          // Store both user data and JWT tokens
          await AsyncStorage.setItem('user', JSON.stringify(data.user));
          await AsyncStorage.setItem('access_token', data.access);
          await AsyncStorage.setItem('refresh_token', data.refresh);
          console.log('User data and tokens saved, navigating to tabs');
          router.replace('/(tabs)');
        } else {
          Alert.alert('Login Failed', data.error);
        }
      } catch (parseError) {
        console.error('JSON Parse Error on login:', parseError);
        console.error('Full response was:', responseText);
        Alert.alert('Server Error', 'Login endpoint returned invalid response. Check Django logs.');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Failed to connect');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!password || !contactNumber) return Alert.alert('Error', 'Please fill all required fields');
    setLoading(true);

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    formData.append('contact_number', contactNumber);

    if (profilePic) {
      const uri = profilePic;
      const uriParts = uri.split('.');
      const fileType = uriParts[uriParts.length - 1];

      // @ts-ignore
      formData.append('profile_pic', {
        uri: uri,
        name: `photo.${fileType}`,
        type: `image/${fileType}`,
      });
    }

    try {
      const response = await fetch(`${API_URL}/signup/`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        router.replace('/(tabs)');
      } else {
        Alert.alert('Signup Failed', data.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setProfilePic(result.assets[0].uri);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#0a0a0a', '#1a1a2e', '#16213e']}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.logo}>3D Flat</Text>
            <Text style={styles.subtitle}>
              {step === 'email' ? 'Find Your Dream Home' : step === 'login' ? 'Welcome Back' : 'Create Account'}
            </Text>
          </View>

          <BlurView intensity={30} tint="dark" style={styles.card}>
            {step === 'email' && (
              <View style={styles.form}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleCheckEmail}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Continue</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {step === 'login' && (
              <View style={styles.form}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Login</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setStep('email')} style={styles.linkButton}>
                  <Text style={styles.linkText}>Change Email</Text>
                </TouchableOpacity>
              </View>
            )}

            {step === 'signup' && (
              <View style={styles.form}>
                <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
                  {profilePic ? (
                    <Image source={{ uri: profilePic }} style={styles.profileImage} />
                  ) : (
                    <View style={styles.placeholderImage}>
                      <Text style={styles.placeholderText}>📷</Text>
                      <Text style={styles.placeholderSubtext}>Add Photo (Optional)</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Create a password"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />

                <Text style={styles.label}>Contact Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your phone number"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={contactNumber}
                  onChangeText={setContactNumber}
                  keyboardType="phone-pad"
                />

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleSignup}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Sign Up</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setStep('email')} style={styles.linkButton}>
                  <Text style={styles.linkText}>Change Email</Text>
                </TouchableOpacity>
              </View>
            )}
          </BlurView>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 10,
  },
  card: {
    borderRadius: 24,
    padding: 30,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  form: {
    gap: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: -10,
  },
  input: {
    height: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  button: {
    height: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 10,
  },
  linkText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  imagePicker: {
    alignSelf: 'center',
    marginBottom: 10,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 40,
  },
  placeholderSubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginTop: 5,
  },
});