import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import ThreeDModal from '@/components/ThreeDModal';
import Interior3DModal from '@/components/Interior3DModal';
import BookingModal from '@/components/BookingModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLikedViewed } from '@/contexts/LikedViewedContext';
import { authFetch, API_BASE } from '@/utils/api';
import { styles } from './styles';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

type DetailTab = 'overview' | 'amenities' | 'trends';

export default function PropertyDetailScreen() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [viewMode, setViewMode] = useState<'exterior' | 'interior'>('exterior');
    const [isBookingModalVisible, setBookingModalVisible] = useState(false);
    const [activeTab, setActiveTab] = useState<DetailTab>('overview');
    const { addViewed, isLiked, toggleLike } = useLikedViewed();
    const fadeAnim = useRef(new Animated.Value(1)).current;

    const property = params.property ? JSON.parse(params.property as string) : null;

    const source: 'sponsored' | 'listed' = property?.source || 'sponsored';
    const liked = property ? isLiked(property.id, source) : false;

    const handleLike = () => {
        if (!property) return;
        toggleLike(property, source);
    };

    const handleTabChange = (tab: DetailTab) => {
        // Fade out, switch, fade in
        Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setActiveTab(tab);
            Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
        });
    };

    useEffect(() => {
        if (property) {
            addViewed({
                id: property.id,
                name: property.name,
                location: property.location,
                price: property.price,
                image: property.image,
                bedrooms: property.bedrooms,
                bathrooms: property.bathrooms,
                area: property.area,
                description: property.description,
                three_d_file: property.three_d_file,
                interior_file: property.interior_file,
                interactive_mesh_names: property.interactive_mesh_names,
                source: source,
            });
        }
    }, []);

    const handleBookingConfirm = async (date: string, time: string) => {
        try {
            const token = await AsyncStorage.getItem('access_token');
            if (!token) {
                alert("Please log in to book a viewing.");
                router.replace('/(auth)/login' as any);
                return;
            }
            const response = await authFetch(`${API_BASE}/api/bookings/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ property_id: property.id, date, time }),
            });
            if (response.ok) {
                alert("Booking Confirmed!");
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.error}`);
            }
        } catch (error) {
            console.error(error);
            alert("Network error failed to book.");
        }
    };

    if (!property) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Property not found</Text>
            </View>
        );
    }

    const modelUrl = property.three_d_file
        ? (property.three_d_file.startsWith('http') ? property.three_d_file : `${API_BASE}${property.three_d_file}`)
        : null;

    const interiorUrl = property.interior_file
        ? (property.interior_file.startsWith('http') ? property.interior_file : `${API_BASE}${property.interior_file}`)
        : null;

    const meshNamesStr = property.interactive_mesh_names || '';
    const exteriorConfig = {
        fixedButtons: [] as any[],
        interactiveMeshNames: meshNamesStr
            ? meshNamesStr.split(',').map((s: string) => s.trim()).filter(Boolean)
            : [],
    };

    if (isFullscreen) {
        return (
            <View style={styles.container}>
                <Stack.Screen options={{ headerShown: false }} />
                <View style={{ flex: 1 }}>
                    {viewMode === 'exterior' ? (
                        <ThreeDModal
                            visible={true}
                            onClose={() => setIsFullscreen(false)}
                            modelUrl={modelUrl}
                            propertyName={property.name}
                            buildingConfig={exteriorConfig}
                            onEnterInterior={() => { if (interiorUrl) setViewMode('interior'); }}
                        />
                    ) : (
                        <Interior3DModal visible={true} modelUrl={interiorUrl} />
                    )}
                </View>
                <TouchableOpacity style={styles.exitFullscreen} onPress={() => setIsFullscreen(false)}>
                    <Text style={styles.exitIcon}>⤓</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // ─── Tab Content ────────────────────────────────────────

    const renderOverview = () => (
        <>
            <View style={styles.priceRow}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.price}>{property.price}</Text>
                    <Text style={styles.location}>📍 {property.location}</Text>
                </View>
                <TouchableOpacity style={styles.detailLikeBtn} onPress={handleLike} activeOpacity={0.7}>
                    <Ionicons name={liked ? 'heart' : 'heart-outline'} size={22}
                        color={liked ? '#ff4d6d' : 'rgba(255,255,255,0.6)'} />
                </TouchableOpacity>
            </View>

            <View style={styles.statsRow}>
                <View style={styles.stat}>
                    <Text style={styles.statVal}>{property.bedrooms}</Text>
                    <Text style={styles.statLabel}>Beds</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                    <Text style={styles.statVal}>{property.bathrooms}</Text>
                    <Text style={styles.statLabel}>Baths</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                    <Text style={styles.statVal}>{property.area}</Text>
                    <Text style={styles.statLabel}>Area</Text>
                </View>
            </View>

            {property.description ? (
                <View>
                    <Text style={styles.sectionTitle}>About Property</Text>
                    <Text style={styles.description}>{property.description}</Text>
                </View>
            ) : null}

            <TouchableOpacity style={styles.bookBtn} onPress={() => setBookingModalVisible(true)}>
                <View style={[styles.bookGradient, { backgroundColor: '#667eea' }]}>
                    <Text style={styles.bookText}>Book a Viewing</Text>
                </View>
            </TouchableOpacity>
        </>
    );

    const renderAmenities = () => (
        <>
            <Text style={styles.sectionTitle}>Premium Amenities</Text>
            <View style={styles.amenitiesGrid}>
                {[
                    { icon: 'shield-checkmark-outline', label: '24/7 Security' },
                    { icon: 'barbell-outline', label: 'Gym & Fitness' },
                    { icon: 'car-outline', label: 'Parking' },
                    { icon: 'wifi-outline', label: 'High Speed WiFi' },
                    { icon: 'water-outline', label: 'Swimming Pool' },
                    { icon: 'people-outline', label: 'Community Hall' },
                    { icon: 'leaf-outline', label: 'Garden' },
                    { icon: 'arrow-up-outline', label: 'Elevator' },
                ].map((item, index) => (
                    <View key={index} style={styles.amenityCard}>
                        <Ionicons name={item.icon as any} size={26} color="#667eea" />
                        <Text style={styles.amenityLabel}>{item.label}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.amenitySectionHeader}>
                <Ionicons name="location" size={18} color="#4ade80" />
                <Text style={styles.sectionTitle}>Nearby Features</Text>
            </View>

            <View style={styles.amenitiesGrid}>
                {[
                    { icon: 'medical-outline', label: 'City Hospital', dist: '0.5 km', color: '#ff6b6b' },
                    { icon: 'school-outline', label: 'International School', dist: '1.2 km', color: '#4facfe' },
                    { icon: 'bag-outline', label: 'Metro Mall', dist: '0.8 km', color: '#a18cd1' },
                    { icon: 'train-outline', label: 'Metro Station', dist: '0.3 km', color: '#48c6ef' },
                    { icon: 'cafe-outline', label: 'Cafe & Restaurants', dist: '0.2 km', color: '#fccb90' },
                    { icon: 'leaf-outline', label: 'Central Park', dist: '1.0 km', color: '#84fab0' },
                ].map((item, index) => (
                    <View key={index} style={styles.amenityCard}>
                        <Ionicons name={item.icon as any} size={26} color={item.color} />
                        <Text style={styles.amenityLabel}>{item.label}</Text>
                        <Text style={styles.amenityDistance}>Distance: {item.dist}</Text>
                    </View>
                ))}
            </View>
        </>
    );

    const renderTrends = () => (
        <>
            <View style={styles.trendCard}>
                <View style={styles.trendHeader}>
                    <View style={styles.trendTitleRow}>
                        <Ionicons name="trending-up-outline" size={18} color="#4ade80" />
                        <Text style={styles.trendTitle}>Price Trend</Text>
                    </View>
                    <View style={styles.trendBadge}>
                        <Text style={styles.trendBadgeText}>↗ +12.5%</Text>
                    </View>
                </View>
                <Text style={styles.trendValue}>Rising</Text>
                <Text style={styles.trendDesc}>Property value increased by 12.5% in last 6 months</Text>
            </View>

            <View style={styles.trendCard}>
                <View style={styles.trendHeader}>
                    <View style={styles.trendTitleRow}>
                        <Ionicons name="pulse-outline" size={18} color="#f97316" />
                        <Text style={styles.trendTitle}>Demand</Text>
                    </View>
                    <Ionicons name="flame-outline" size={18} color="#f97316" />
                </View>
                <Text style={styles.trendValue}>High</Text>
                <Text style={styles.trendDesc}>83% occupancy rate in this area</Text>
            </View>

            <View style={styles.trendCard}>
                <View style={styles.trendHeader}>
                    <View style={styles.trendTitleRow}>
                        <Ionicons name="cash-outline" size={18} color="#667eea" />
                        <Text style={styles.trendTitle}>Investment Score</Text>
                    </View>
                </View>
                <Text style={styles.trendValue}>8.5/10</Text>
                <Text style={styles.trendDesc}>Excellent investment opportunity</Text>
            </View>
        </>
    );

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.headerOverlay}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={20} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{property.name}</Text>
                <TouchableOpacity onPress={() => modelUrl && setIsFullscreen(true)}
                    style={[styles.backBtn, !modelUrl && { opacity: 0.3 }]}>
                    <Ionicons name="expand-outline" size={18} color="#fff" />
                </TouchableOpacity>
            </View>

            <View style={styles.viewerSection}>
                {viewMode === 'exterior' ? (
                    <ThreeDModal
                        visible={true}
                        onClose={() => { }}
                        modelUrl={modelUrl}
                        propertyName={property.name}
                        buildingConfig={exteriorConfig}
                        onEnterInterior={() => { if (interiorUrl) setViewMode('interior'); }}
                    />
                ) : (
                    <View style={{ flex: 1 }}>
                        <Interior3DModal visible={true} modelUrl={interiorUrl} />
                        <TouchableOpacity style={styles.backToExteriorBtn} onPress={() => setViewMode('exterior')}>
                            <Ionicons name="arrow-back" size={14} color="#fff" />
                            <Text style={styles.backToExteriorText}> Back to Exterior</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Details — tabs INSIDE the card */}
            <View style={styles.detailsSection}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.detailsContent}>
                    <LinearGradient
                        colors={['rgba(26, 26, 46, 0.95)', 'rgba(10, 10, 10, 0.98)']}
                        style={styles.detailsCard}
                    >
                        {/* Tab selector inside the card */}
                        <View style={styles.tabBar}>
                            {(['overview', 'amenities', 'trends'] as DetailTab[]).map((tab) => (
                                <TouchableOpacity
                                    key={tab}
                                    style={[styles.detailTab, activeTab === tab && styles.detailTabActive]}
                                    onPress={() => handleTabChange(tab)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.detailTabText, activeTab === tab && styles.detailTabTextActive]}>
                                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Animated tab content */}
                        <Animated.View style={{ opacity: fadeAnim }}>
                            {activeTab === 'overview' && renderOverview()}
                            {activeTab === 'amenities' && renderAmenities()}
                            {activeTab === 'trends' && renderTrends()}
                        </Animated.View>
                    </LinearGradient>
                </ScrollView>
            </View>

            <BookingModal
                visible={isBookingModalVisible}
                onClose={() => setBookingModalVisible(false)}
                propertyName={property.name}
                onConfirm={handleBookingConfirm}
            />
        </View>
    );
}
