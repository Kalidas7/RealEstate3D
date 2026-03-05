import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import SkylineExterior from '@/components/buildings/Skyline towers/exterior';
import GraffitiExterior from '@/components/buildings/Graffiti/exterior';
import InteriorModal from '@/components/InteriorModal';
import BookingModal from '@/components/BookingModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from './styles';

const API_BASE = 'https://realestate3d.onrender.com';

export default function PropertyDetailScreen() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [viewMode, setViewMode] = useState<'exterior' | 'interior'>('exterior');
    const [isBookingModalVisible, setBookingModalVisible] = useState(false);

    const property = params.property ? JSON.parse(params.property as string) : null;

    const handleBookingConfirm = async (date: string, time: string) => {
        try {
            const userData = await AsyncStorage.getItem('user');
            if (!userData) {
                alert("Please log in to book a viewing.");
                router.replace('/(auth)/login' as any);
                return;
            }

            const user = JSON.parse(userData);

            const response = await fetch(`${API_BASE}/api/bookings/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: user.email,
                    property_id: property.id,
                    date: date,
                    time: time
                }),
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

    // Parse comma-separated mesh names from API into buildingConfig
    const meshNamesStr = property.interactive_mesh_names || '';
    const exteriorConfig = {
        fixedButtons: [] as any[],
        interactiveMeshNames: meshNamesStr
            ? meshNamesStr.split(',').map((s: string) => s.trim()).filter(Boolean)
            : [],
    };

    // Parse interior camera nodes from API: "Label:x:y:z, Label:x:y:z"
    const cameraNodesStr = property.interior_camera_nodes || '';
    const cameraNodes = cameraNodesStr
        ? cameraNodesStr.split(',').map((s: string) => {
            const parts = s.trim().split(':');
            if (parts.length < 4) return null;
            return {
                label: parts[0].trim(),
                x: parseFloat(parts[1]),
                y: parseFloat(parts[2]),
                z: parseFloat(parts[3]),
            };
        }).filter(Boolean)
        : [];

    if (isFullscreen) {
        return (
            <View style={styles.container}>
                <Stack.Screen options={{ headerShown: false }} />
                <View style={{ flex: 1 }}>
                    {viewMode === 'exterior' ? (
                        property.name === 'Skyline towers' ? (
                            <SkylineExterior
                                visible={true}
                                onClose={() => { }}
                                modelUrl={modelUrl}
                                propertyName={property.name}
                                buildingConfig={exteriorConfig}
                                onEnterInterior={() => {
                                    if (interiorUrl) setViewMode('interior');
                                }}
                            />
                        ) : (
                            <GraffitiExterior
                                visible={true}
                                onClose={() => { }}
                                modelUrl={modelUrl}
                                propertyName={property.name}
                                buildingConfig={exteriorConfig}
                                onEnterInterior={() => {
                                    if (interiorUrl) setViewMode('interior');
                                }}
                            />
                        )
                    ) : (
                        <InteriorModal
                            visible={true}
                            modelUrl={interiorUrl}
                            cameraNodes={cameraNodes}
                        />
                    )}
                </View>
                <TouchableOpacity
                    style={styles.exitFullscreen}
                    onPress={() => setIsFullscreen(false)}
                >
                    <Text style={styles.exitIcon}>⤓</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Back button overlay */}
            <View style={styles.headerOverlay}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{property.name}</Text>
                <TouchableOpacity
                    onPress={() => modelUrl && setIsFullscreen(true)}
                    style={[styles.backBtn, !modelUrl && { opacity: 0.3 }]}
                >
                    <Text style={styles.backIcon}>⤢</Text>
                </TouchableOpacity>
            </View>

            {/* 3D Viewer - 3/4 screen */}
            <View style={styles.viewerSection}>
                {viewMode === 'exterior' ? (
                    property.name === 'Skyline towers' ? (
                        <SkylineExterior
                            visible={true}
                            onClose={() => { }}
                            modelUrl={modelUrl}
                            propertyName={property.name}
                            buildingConfig={exteriorConfig}
                            onEnterInterior={() => {
                                if (interiorUrl) setViewMode('interior');
                            }}
                        />
                    ) : (
                        <GraffitiExterior
                            visible={true}
                            onClose={() => { }}
                            modelUrl={modelUrl}
                            propertyName={property.name}
                            buildingConfig={exteriorConfig}
                            onEnterInterior={() => {
                                if (interiorUrl) setViewMode('interior');
                            }}
                        />
                    )
                ) : (
                    <View style={{ flex: 1 }}>
                        <InteriorModal
                            visible={true}
                            modelUrl={interiorUrl}
                            cameraNodes={cameraNodes}
                        />
                        <TouchableOpacity
                            style={styles.backToExteriorBtn}
                            onPress={() => setViewMode('exterior')}
                        >
                            <Text style={styles.backToExteriorText}>← Back to Exterior</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Details - scrollable bottom 1/4 */}
            <View style={styles.detailsSection}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.detailsContent}
                >
                    <LinearGradient
                        colors={['rgba(26, 26, 46, 0.95)', 'rgba(10, 10, 10, 0.98)']}
                        style={styles.detailsCard}
                    >
                        {/* Price */}
                        <View style={styles.priceRow}>
                            <Text style={styles.price}>{property.price}</Text>
                            <Text style={styles.location}>📍 {property.location}</Text>
                        </View>

                        {/* Stats Row */}
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

                        {/* Description */}
                        {property.description ? (
                            <View>
                                <Text style={styles.sectionTitle}>About</Text>
                                <Text style={styles.description}>{property.description}</Text>
                            </View>
                        ) : null}

                        {/* Book button */}
                        <TouchableOpacity style={styles.bookBtn} onPress={() => setBookingModalVisible(true)}>
                            <LinearGradient
                                colors={['#667eea', '#764ba2']}
                                style={styles.bookGradient}
                            >
                                <Text style={styles.bookText}>📅 Book a Viewing</Text>
                            </LinearGradient>
                        </TouchableOpacity>
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

