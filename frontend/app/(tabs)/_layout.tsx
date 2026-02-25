import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View, Dimensions, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

function AnimatedTabIcon({ name, color, focused }) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: focused ? 1.1 : 1,
      useNativeDriver: true,
      tension: 100,
      friction: 5,
    }).start();
  }, [focused]);

  return (
    <View style={iconStyles.container}>
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
        }}>
        <Ionicons name={name} size={22} color={color} />
      </Animated.View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#5B8DEF',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.4)',
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          position: 'absolute',
          bottom: 50,
          left: 0,
          right: 0,
          marginHorizontal: (width - 300) / 2,
          width: 300,
          height: 60,
          backgroundColor: 'transparent',
          borderRadius: 30,
          borderWidth: 0,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.3,
          shadowRadius: 25,
        },
        tabBarItemStyle: {
          height: 60,
          paddingTop: 4,
          paddingBottom: 6,
          paddingHorizontal: 0,
        },
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '500',
          marginTop: 0,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={60}
            tint="dark"
            style={{
              ...StyleSheet.absoluteFillObject,
              borderRadius: 30,
              backgroundColor: 'rgba(18, 18, 25, 0.85)',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.12)',
              overflow: 'hidden',
            }}
          />
        ),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon name="home-outline" color={color} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon name="calendar-outline" color={color} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon name="person-outline" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const iconStyles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});