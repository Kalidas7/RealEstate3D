import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, Alert, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useLikedViewed } from '@/contexts/LikedViewedContext';
import { useFocusEffect } from '@react-navigation/native';

const API_URL = 'https://realestate3d.onrender.com';

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
    const { likedProperties, refreshLiked, viewedProperties } = useLikedViewed();

    useEffect(() => {
        loadUser();
    }, []);

    // Refresh liked properties when tab is focused or switched to
    useFocusEffect(
        useCallback(() => {
            refreshLiked();
        }, [refreshLiked])
    );

    useEffect(() => {
        if (activeTab === 'liked') {
            refreshLiked();
        }
    }, [activeTab]);

    const loadUser = async () => {
        try {
            const userData = await AsyncStorage.getItem('user');
            if (userData) {
                setUser(JSON.parse(userData));
            } else {
                router.replace('/');
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleLogout = async () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setUser(null);
                            await AsyncStorage.removeItem('user');
                            await AsyncStorage.removeItem('access_token');
                            await AsyncStorage.removeItem('refresh_token');

                            const check = await AsyncStorage.getItem('user');
                            if (check) {
                                console.warn('Logout verify failed, force clearing again');
                                await AsyncStorage.clear();
                            }

                            console.log('Logout complete, verified, navigating to login');
                        } catch (error) {
                            console.error('Logout error:', error);
                            await AsyncStorage.clear();
                        } finally {
                            router.replace({
                                pathname: '/',
                                params: { logout: 'true' }
                            });
                        }
                    },
                },
            ]
        );
    };

    const handlePropertyPress = (property: any) => {
        router.push({
            pathname: '/property/[id]',
            params: { id: property.id, property: JSON.stringify(property) },
        });
    };

    if (!user) {
        return (
            <View style={styles.container}>
                <Text>Loading...</Text>
            </View>
        );
    }

    const profilePicUrl = user.profile?.profile_pic
        ? (user.profile.profile_pic.startsWith('http') ? user.profile.profile_pic : `${API_URL}${user.profile.profile_pic}`)
        : null;

    const renderPropertyItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.propertyCard}
            onPress={() => handlePropertyPress(item)}
            activeOpacity={0.8}
        >
            <Image source={{ uri: item.image }} style={styles.propertyImage} resizeMode="cover" />
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.85)']}
                style={styles.propertyGradient}
            />
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
                    <Text style={styles.sourceBadgeText}>
                        {item.source === 'sponsored' ? '⭐' : '🏢'}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );

    const renderEmptyState = (type: 'liked' | 'viewed') => (
        <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>{type === 'liked' ? '❤️' : '👁️'}</Text>
            <Text style={styles.emptyTitle}>
                {type === 'liked' ? 'No Liked Properties' : 'No Viewed Properties'}
            </Text>
            <Text style={styles.emptySubtitle}>
                {type === 'liked'
                    ? 'Tap the heart icon on properties you love'
                    : 'Properties you view will appear here'}
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Profile</Text>
            </View>

            {/* Profile Header (always visible) */}
            <View style={styles.profileSection}>
                <View style={styles.avatarContainer}>
                    {profilePicUrl ? (
                        <Image source={{ uri: profilePicUrl }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarText}>
                                {user.email.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}
                </View>
                <Text style={styles.name}>{user.username}</Text>
            </View>

            {/* Tab Selector */}
            <View style={styles.tabBar}>
                {(['profile', 'liked', 'viewed'] as TabType[]).map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && styles.tabActive]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabIcon]}>
                            {tab === 'profile' ? '👤' : tab === 'liked' ? '❤️' : '👁️'}
                        </Text>
                        <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Tab Content */}
            {activeTab === 'profile' && (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <View style={styles.iconCircle}>
                                <Text style={styles.infoIcon}>✉️</Text>
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Email</Text>
                                <Text style={styles.infoValue}>{user.email}</Text>
                            </View>
                        </View>

                        {user.profile?.contact_number && (
                            <View style={styles.infoRow}>
                                <View style={styles.iconCircle}>
                                    <Text style={styles.infoIcon}>📱</Text>
                                </View>
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Contact</Text>
                                    <Text style={styles.infoValue}>{user.profile.contact_number}</Text>
                                </View>
                            </View>
                        )}

                        <View style={styles.infoRow}>
                            <View style={styles.iconCircle}>
                                <Text style={styles.infoIcon}>🆔</Text>
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>User ID</Text>
                                <Text style={styles.infoValue}>#{user.id}</Text>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.menuButton}
                        onPress={() => router.push('/bookings')}
                    >
                        <View style={styles.menuIconContainer}>
                            <Text style={styles.menuIcon}>📅</Text>
                        </View>
                        <Text style={styles.menuText}>My Bookings</Text>
                        <Text style={styles.menuArrow}>›</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <LinearGradient
                            colors={['#ff6b6b', '#ee5a6f']}
                            style={styles.logoutGradient}
                        >
                            <Text style={styles.logoutIcon}>🚪</Text>
                            <Text style={styles.logoutText}>Logout</Text>
                        </LinearGradient>
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    header: {
        paddingTop: 70,
        paddingHorizontal: 24,
        paddingBottom: 10,
        backgroundColor: '#0a0a0a',
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 120,
    },
    profileSection: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    avatarContainer: {
        marginBottom: 12,
    },
    avatar: {
        width: 90,
        height: 90,
        borderRadius: 45,
        borderWidth: 3,
        borderColor: '#fff',
    },
    avatarPlaceholder: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#667eea',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    avatarText: {
        fontSize: 36,
        color: '#fff',
        fontWeight: 'bold',
    },
    name: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
    },

    // Tab bar
    tabBar: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginBottom: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 4,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 6,
    },
    tabActive: {
        backgroundColor: 'rgba(102, 126, 234, 0.25)',
        borderWidth: 1,
        borderColor: 'rgba(102, 126, 234, 0.4)',
    },
    tabIcon: {
        fontSize: 14,
    },
    tabText: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.5)',
        fontWeight: '600',
    },
    tabTextActive: {
        color: '#fff',
    },

    // Info card (Profile tab)
    infoCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        marginHorizontal: 20,
        borderRadius: 25,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    iconCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    infoIcon: {
        fontSize: 24,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: '#999',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
    },
    logoutButton: {
        marginHorizontal: 20,
        marginTop: 30,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    logoutGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        gap: 10,
    },
    logoutIcon: {
        fontSize: 20,
    },
    logoutText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    menuButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        marginHorizontal: 20,
        marginTop: 20,
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    menuIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(102, 126, 234, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    menuIcon: {
        fontSize: 20,
    },
    menuText: {
        flex: 1,
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
    },
    menuArrow: {
        fontSize: 24,
        color: 'rgba(255, 255, 255, 0.4)',
        fontWeight: '300',
    },

    // Property cards grid (Liked/Viewed tabs)
    gridContent: {
        paddingHorizontal: 16,
        paddingBottom: 120,
    },
    gridRow: {
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    propertyCard: {
        width: '48%',
        height: 200,
        borderRadius: 18,
        overflow: 'hidden',
        backgroundColor: '#1a1a2e',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    propertyImage: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    propertyGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '65%',
    },
    propertyInfo: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 12,
    },
    propertyName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 2,
    },
    propertyLocation: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 6,
    },
    propertyFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    propertyPrice: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#4ade80',
    },
    propertyStats: {
        flexDirection: 'row',
        gap: 6,
    },
    propertyStat: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.7)',
    },
    sourceBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sourceBadgeText: {
        fontSize: 14,
    },

    // Empty state
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center',
        lineHeight: 20,
    },
});