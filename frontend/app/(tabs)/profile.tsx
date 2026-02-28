import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

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

export default function ProfileScreen() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        loadUser();
    }, []);

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

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Profile</Text>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
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
        paddingBottom: 20,
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
        paddingVertical: 40,
    },
    avatarContainer: {
        marginBottom: 16,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: '#fff',
    },
    avatarPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#667eea',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#fff',
    },
    avatarText: {
        fontSize: 48,
        color: '#fff',
        fontWeight: 'bold',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
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
});