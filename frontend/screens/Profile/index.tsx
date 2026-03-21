import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Alert, FlatList, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLikedViewed } from '@/contexts/LikedViewedContext';
import { useAuth } from '@/contexts/AuthContext';
import { getAuthHeaders, API_BASE } from '@/utils/api';
import EditProfileModal from './EditProfileModal';
import { styles } from './styles';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface User {
    id: number;
    username: string;
    email: string;
    profile?: {
        contact_number?: string;
        profile_pic?: string;
    };
}

type TabType = 'profile' | 'liked' | 'viewed';

export default function ProfileScreen() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('profile');
    const { likedProperties, refreshLiked, viewedProperties, clearAll } = useLikedViewed();
    const { logout, user: authUser, setUser: setAuthUser } = useAuth();
    const fadeAnim = useRef(new Animated.Value(1)).current;

    // Edit Profile State
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        // Use context user if available (already loaded), otherwise read storage
        if (authUser) {
            setUser(authUser);
        } else {
            loadUser();
        }
    }, [authUser]);

    const handleTabChange = (tab: TabType) => {
        Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }).start(() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setActiveTab(tab);
            if (tab === 'liked') refreshLiked();
            Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
        });
    };


    const loadUser = async () => {
        try {
            const userData = await AsyncStorage.getItem('user');
            if (userData) {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);
                setAuthUser(parsedUser);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleLogout = async () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout', style: 'destructive',
                onPress: async () => {
                    try {
                        clearAll();
                        await logout(); // clears AsyncStorage + sets isLoggedIn=false
                        // No need for router.replace — the root _layout.tsx
                        // Redirect component will automatically navigate to
                        // /(auth)/login when isLoggedIn becomes false.
                    } catch (error) {
                        console.error('[Logout] Error:', error);
                    }
                },
            },
        ]);
    };

    const handlePropertyPress = (property: any) => {
        router.push({
            pathname: '/property/[id]',
            params: { id: property.id, property: JSON.stringify(property) },
        });
    };

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0] && user) {
            handleUploadProfilePic(result.assets[0].uri);
        }
    };

    const handleUploadProfilePic = async (newProfilePicUri: string) => {
        if (!user) return;

        const formData = new FormData();
        const uriParts = newProfilePicUri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        // @ts-ignore
        formData.append('profile_pic', {
            uri: newProfilePicUri,
            name: `photo.${fileType}`,
            type: `image/${fileType}`,
        });

        try {
            const authHeaders = await getAuthHeaders();
            const response = await fetch(`${API_BASE}/api/profile/update/`, {
                method: 'PUT',
                headers: { ...authHeaders },
                body: formData,
            });

            const data = await response.json();
            if (response.ok) {
                console.log('[Profile] Update response user pic:', data.user?.profile?.profile_pic);
                setUser(data.user);
                setAuthUser(data.user);
            } else {
                Alert.alert('Update Failed', data.error || 'Something went wrong.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to connect to the server.');
        }
    };

    const handleUserUpdated = (updatedUser: User) => {
        setUser(updatedUser);
        setAuthUser(updatedUser);
    };

    if (!user) {
        return (
            <View style={styles.container}>
                <Text style={{ color: '#fff', textAlign: 'center', marginTop: 100 }}>Loading...</Text>
            </View>
        );
    }

    // Cache-bust the URL with a timestamp so React Native doesn't serve
    // a cached version from a previous user/session
    const profilePicUrl = user.profile?.profile_pic
        ? (() => {
            const base = user.profile!.profile_pic!.startsWith('http')
                ? user.profile!.profile_pic!
                : `${API_BASE}${user.profile!.profile_pic}`;
            // Strip any existing cache-buster then add a fresh unique timestamp
            const urlWithoutTs = base.split('?')[0];
            return `${urlWithoutTs}?t=${Date.now()}`;
        })()
        : null;

    const renderPropertyItem = ({ item }: { item: any }) => (
        <TouchableOpacity style={styles.propertyCard} onPress={() => handlePropertyPress(item)} activeOpacity={0.8}>
            <Image source={{ uri: item.image }} style={styles.propertyImage} resizeMode="cover" />
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.propertyGradient} />
            <View style={styles.propertyInfo}>
                <Text style={styles.propertyName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.propertyLocation} numberOfLines={1}>📍 {item.location}</Text>
                <View style={styles.propertyFooter}>
                    <Text style={styles.propertyPrice}>{item.price}</Text>
                    <View style={styles.propertyStats}>
                        <Text style={styles.propertyStat}>🛏️ {item.bedrooms}</Text>
                        <Text style={styles.propertyStat}>📐 {item.area}</Text>
                    </View>
                </View>
            </View>
            {item.source && (
                <View style={styles.sourceBadge}>
                    <Ionicons name={item.source === 'sponsored' ? 'star' : 'business'} size={12} color="#fff" />
                </View>
            )}
        </TouchableOpacity>
    );

    const renderEmptyState = (type: 'liked' | 'viewed') => (
        <View style={styles.emptyState}>
            <Ionicons name={type === 'liked' ? 'heart-outline' : 'eye-outline'} size={48} color="rgba(255,255,255,0.3)" />
            <Text style={styles.emptyTitle}>
                {type === 'liked' ? 'No Liked Properties' : 'No Viewed Properties'}
            </Text>
            <Text style={styles.emptySubtitle}>
                {type === 'liked' ? 'Tap the heart icon on properties you love' : 'Properties you view will appear here'}
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Profile</Text>
            </View>

            <View style={styles.profileSection}>
                <TouchableOpacity style={styles.avatarContainer} onPress={handlePickImage} activeOpacity={0.8}>
                    {profilePicUrl ? (
                        <Image source={{ uri: profilePicUrl }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarText}>{user.email.charAt(0).toUpperCase()}</Text>
                        </View>
                    )}
                    <View style={styles.editAvatarBadge}>
                        <Ionicons name="camera" size={12} color="#fff" />
                    </View>
                </TouchableOpacity>
                <Text style={styles.name}>{user.username}</Text>

                <TouchableOpacity style={styles.editProfileBtn} onPress={() => setIsEditing(true)}>
                    <Text style={styles.editProfileBtnText}>Edit Profile</Text>
                </TouchableOpacity>
            </View>

            {/* Tab Selector */}
            <View style={styles.tabBar}>
                {(['profile', 'liked', 'viewed'] as TabType[]).map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && styles.tabActive]}
                        onPress={() => handleTabChange(tab)}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name={tab === 'profile' ? 'person-outline' : tab === 'liked' ? 'heart-outline' : 'eye-outline'}
                            size={15}
                            color={activeTab === tab ? '#fff' : 'rgba(255,255,255,0.45)'}
                        />
                        <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Animated Tab Content */}
            <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
                {activeTab === 'profile' && (
                    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        <View style={styles.infoCard}>
                            <View style={styles.infoRow}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="mail-outline" size={22} color="#667eea" />
                                </View>
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Email</Text>
                                    <Text style={styles.infoValue}>{user.email}</Text>
                                </View>
                            </View>

                            {user.profile?.contact_number && (
                                <View style={styles.infoRow}>
                                    <View style={styles.iconCircle}>
                                        <Ionicons name="call-outline" size={22} color="#667eea" />
                                    </View>
                                    <View style={styles.infoContent}>
                                        <Text style={styles.infoLabel}>Contact</Text>
                                        <Text style={styles.infoValue}>{user.profile.contact_number}</Text>
                                    </View>
                                </View>
                            )}

                            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="finger-print-outline" size={22} color="#667eea" />
                                </View>
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>User ID</Text>
                                    <Text style={styles.infoValue}>#{user.id}</Text>
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.menuButton} onPress={() => router.push('/bookings')}>
                            <View style={styles.menuIconContainer}>
                                <Ionicons name="calendar-outline" size={20} color="#667eea" />
                            </View>
                            <Text style={styles.menuText}>My Bookings</Text>
                            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
                            <View style={styles.logoutContainer}>
                                <Ionicons name="log-out-outline" size={20} color="#ff4b4b" />
                                <Text style={styles.logoutText}>Logout</Text>
                            </View>
                        </TouchableOpacity>
                    </ScrollView>
                )}

                {activeTab === 'liked' && (
                    likedProperties.length > 0 ? (
                        <FlatList
                            data={likedProperties}
                            renderItem={renderPropertyItem}
                            keyExtractor={(item) => `liked-${item.source}-${item.id}`}
                            numColumns={2}
                            columnWrapperStyle={styles.gridRow}
                            contentContainerStyle={styles.gridContent}
                            showsVerticalScrollIndicator={false}
                        />
                    ) : renderEmptyState('liked')
                )}

                {activeTab === 'viewed' && (
                    viewedProperties.length > 0 ? (
                        <FlatList
                            data={viewedProperties}
                            renderItem={renderPropertyItem}
                            keyExtractor={(item, index) => `viewed-${item.source}-${item.id}-${index}`}
                            numColumns={2}
                            columnWrapperStyle={styles.gridRow}
                            contentContainerStyle={styles.gridContent}
                            showsVerticalScrollIndicator={false}
                        />
                    ) : renderEmptyState('viewed')
                )}
            </Animated.View>

            <EditProfileModal
                visible={isEditing}
                user={user}
                onClose={() => setIsEditing(false)}
                onUserUpdated={handleUserUpdated}
            />
        </View>
    );
}
