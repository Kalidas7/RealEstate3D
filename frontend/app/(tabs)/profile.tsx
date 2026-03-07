import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, Alert, FlatList, Animated, LayoutAnimation, Platform, UIManager, Modal, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLikedViewed } from '@/contexts/LikedViewedContext';
import { useFocusEffect } from '@react-navigation/native';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
    const { likedProperties, refreshLiked, viewedProperties, clearAll } = useLikedViewed();
    const fadeAnim = useRef(new Animated.Value(1)).current;

    // Edit Profile State
    const [isEditing, setIsEditing] = useState(false);
    const [editUsername, setEditUsername] = useState('');
    const [editContact, setEditContact] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        loadUser();
    }, []);

    useFocusEffect(
        useCallback(() => {
            refreshLiked();
        }, [refreshLiked])
    );

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
                setEditUsername(parsedUser.username || '');
                setEditContact(parsedUser.profile?.contact_number || '');
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
                        setUser(null);
                        await AsyncStorage.removeItem('user');
                        await AsyncStorage.removeItem('access_token');
                        await AsyncStorage.removeItem('refresh_token');
                        const check = await AsyncStorage.getItem('user');
                        if (check) await AsyncStorage.clear();
                    } catch (error) {
                        await AsyncStorage.clear();
                    } finally {
                        setTimeout(() => {
                            router.replace({ pathname: '/', params: { logout: 'true' } });
                        }, 100);
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
            handleUpdateProfile(result.assets[0].uri);
        }
    };

    const handleUpdateProfile = async (newProfilePicUri?: string) => {
        if (!user) return;
        setIsUpdating(true);

        const formData = new FormData();
        formData.append('email', user.email);

        if (editUsername) formData.append('username', editUsername);
        if (editContact) formData.append('contact_number', editContact);

        if (newProfilePicUri) {
            const uriParts = newProfilePicUri.split('.');
            const fileType = uriParts[uriParts.length - 1];
            // @ts-ignore
            formData.append('profile_pic', {
                uri: newProfilePicUri,
                name: `photo.${fileType}`,
                type: `image/${fileType}`,
            });
        }

        try {
            const response = await fetch(`${API_URL}/api/profile/update/`, {
                method: 'PUT',
                body: formData,
            });

            const data = await response.json();
            if (response.ok) {
                setUser(data.user);
                await AsyncStorage.setItem('user', JSON.stringify(data.user));
                setIsEditing(false);
                if (!newProfilePicUri) {
                    Alert.alert('Success', 'Profile updated successfully.');
                }
            } else {
                Alert.alert('Update Failed', data.error || 'Something went wrong.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to connect to the server.');
        } finally {
            setIsUpdating(false);
        }
    };

    if (!user) {
        return (
            <View style={styles.container}>
                <Text style={{ color: '#fff', textAlign: 'center', marginTop: 100 }}>Loading...</Text>
            </View>
        );
    }

    const profilePicUrl = user.profile?.profile_pic
        ? (user.profile.profile_pic.startsWith('http') ? user.profile.profile_pic : `${API_URL}${user.profile.profile_pic}`)
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

                        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                            <LinearGradient colors={['#ff6b6b', '#ee5a6f']} style={styles.logoutGradient}>
                                <Ionicons name="log-out-outline" size={20} color="#fff" />
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
            </Animated.View>

            {/* Edit Profile Modal */}
            <Modal visible={isEditing} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edit Profile</Text>

                        <Text style={styles.inputLabel}>Username</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={editUsername}
                            onChangeText={setEditUsername}
                            placeholder="Enter username"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                        />

                        <Text style={styles.inputLabel}>Contact Number</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={editContact}
                            onChangeText={setEditContact}
                            placeholder="Enter contact number"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            keyboardType="phone-pad"
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalBtnCancel}
                                onPress={() => setIsEditing(false)}
                                disabled={isUpdating}
                            >
                                <Text style={styles.modalBtnCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalBtnSave}
                                onPress={() => handleUpdateProfile()}
                                disabled={isUpdating}
                            >
                                {isUpdating ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.modalBtnSaveText}>Save</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
    },
    scrollView: { flex: 1 },
    scrollContent: { paddingBottom: 120 },
    profileSection: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    avatarContainer: { marginBottom: 12 },
    avatar: {
        width: 90, height: 90, borderRadius: 45,
        borderWidth: 3, borderColor: '#fff',
    },
    avatarPlaceholder: {
        width: 90, height: 90, borderRadius: 45,
        backgroundColor: '#667eea',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 3, borderColor: '#fff',
    },
    avatarText: { fontSize: 36, color: '#fff', fontWeight: 'bold' },
    editAvatarBadge: {
        position: 'absolute', bottom: 0, right: 0,
        backgroundColor: '#4ade80', width: 28, height: 28,
        borderRadius: 14, justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: '#0a0a0a',
    },
    name: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
    editProfileBtn: {
        marginTop: 8, paddingHorizontal: 16, paddingVertical: 6,
        borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    },
    editProfileBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },

    // Tab bar
    tabBar: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginBottom: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 14,
        padding: 3,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 11,
        borderRadius: 11,
        gap: 6,
    },
    tabActive: {
        backgroundColor: 'rgba(102, 126, 234, 0.25)',
        borderWidth: 1,
        borderColor: 'rgba(102, 126, 234, 0.4)',
    },
    tabText: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.45)',
        fontWeight: '600',
    },
    tabTextActive: { color: '#fff' },

    // Info card
    infoCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        marginHorizontal: 20, borderRadius: 22,
        padding: 20, borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    infoRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 14, borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    },
    iconCircle: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: 'rgba(102, 126, 234, 0.12)',
        justifyContent: 'center', alignItems: 'center',
        marginRight: 14,
    },
    infoContent: { flex: 1 },
    infoLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 3 },
    infoValue: { fontSize: 15, color: '#fff', fontWeight: '600' },

    logoutButton: {
        marginHorizontal: 20, marginTop: 28,
        borderRadius: 16, overflow: 'hidden',
    },
    logoutGradient: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', paddingVertical: 16, gap: 10,
    },
    logoutText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

    menuButton: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        marginHorizontal: 20, marginTop: 18,
        padding: 14, borderRadius: 18,
        borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    menuIconContainer: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: 'rgba(102, 126, 234, 0.15)',
        justifyContent: 'center', alignItems: 'center',
        marginRight: 14,
    },
    menuText: { flex: 1, fontSize: 15, color: '#fff', fontWeight: '600' },

    // Property grid
    gridContent: { paddingHorizontal: 16, paddingBottom: 120 },
    gridRow: { justifyContent: 'space-between', marginBottom: 12 },
    propertyCard: {
        width: '48%', height: 200, borderRadius: 18,
        overflow: 'hidden', backgroundColor: '#1a1a2e',
        elevation: 5, shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 8,
    },
    propertyImage: { width: '100%', height: '100%', position: 'absolute' },
    propertyGradient: {
        position: 'absolute', left: 0, right: 0, bottom: 0, height: '65%',
    },
    propertyInfo: {
        position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12,
    },
    propertyName: { fontSize: 14, fontWeight: 'bold', color: '#fff', marginBottom: 2 },
    propertyLocation: { fontSize: 10, color: 'rgba(255,255,255,0.8)', marginBottom: 6 },
    propertyFooter: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    propertyPrice: { fontSize: 12, fontWeight: 'bold', color: '#4ade80' },
    propertyStats: { flexDirection: 'row', gap: 6 },
    propertyStat: { fontSize: 10, color: 'rgba(255,255,255,0.7)' },
    sourceBadge: {
        position: 'absolute', top: 8, right: 8,
        width: 26, height: 26, borderRadius: 13,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center', alignItems: 'center',
    },

    // Empty state
    emptyState: {
        flex: 1, justifyContent: 'center', alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 18, fontWeight: 'bold', color: '#fff',
        marginTop: 16, marginBottom: 6,
    },
    emptySubtitle: {
        fontSize: 13, color: 'rgba(255,255,255,0.4)',
        textAlign: 'center', lineHeight: 20,
    },

    // Modal Styles
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center', alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%', backgroundColor: '#1a1a2e',
        borderRadius: 24, padding: 24,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 20, textAlign: 'center' },
    inputLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 6, marginLeft: 4 },
    modalInput: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12, padding: 14, color: '#fff',
        marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    },
    modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
    modalBtnCancel: {
        flex: 1, padding: 14, borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center',
    },
    modalBtnCancelText: { color: '#fff', fontWeight: 'bold' },
    modalBtnSave: {
        flex: 1, padding: 14, borderRadius: 12,
        backgroundColor: '#667eea', alignItems: 'center',
    },
    modalBtnSaveText: { color: '#fff', fontWeight: 'bold' },
});