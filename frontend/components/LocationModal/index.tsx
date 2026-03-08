import React, { useState } from 'react';
import {
    View, Text, StyleSheet, Modal, TouchableOpacity,
    TouchableWithoutFeedback, ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

interface LocationModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectLocation: (city: string, lat: number | null, lon: number | null) => void;
    onSkipOption: () => void;
}

const CITIES = [
    { name: "Trivandrum", lat: 8.5241, lon: 76.9366 },
    { name: "Kochi", lat: 9.9312, lon: 76.2673 },
    { name: "Kollam", lat: 8.8932, lon: 76.5596 }
];

// App colour palette — matches BookingModal + app-wide blue accent
const BLUE = '#667eea';
const BLUE_DIM = 'rgba(102,126,234,0.15)';
const BLUE_BORDER = 'rgba(102,126,234,0.5)';
const DARK_BG = '#0a0a14';
const CARD_BG = '#111128';
const SURFACE = 'rgba(255,255,255,0.05)';
const SURFACE_BORDER = 'rgba(255,255,255,0.1)';

export default function LocationModal({ visible, onClose, onSelectLocation, onSkipOption }: LocationModalProps) {
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const handleAutoDetect = async () => {
        setLoading(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Allow location access to auto-detect your city.');
                return;
            }
            const loc = await Location.getCurrentPositionAsync({});
            const geocode = await Location.reverseGeocodeAsync({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
            });
            if (geocode && geocode.length > 0) {
                const city = geocode[0].city || geocode[0].subregion || geocode[0].region || 'Unknown Location';
                onSelectLocation(city, loc.coords.latitude, loc.coords.longitude);
                onClose();
            } else {
                Alert.alert('Error', 'Could not determine your city from coordinates.');
            }
        } catch (error) {
            console.error('Location error:', error);
            Alert.alert('Error', 'Failed to fetch location.');
        } finally {
            setLoading(false);
        }
    };

    const handleManualSelect = (cityObj: { name: string; lat: number; lon: number }) => {
        onSelectLocation(cityObj.name, cityObj.lat, cityObj.lon);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback onPress={() => { }}>
                        <View style={styles.card}>

                            {/* Header */}
                            <View style={styles.header}>
                                <View style={styles.iconBox}>
                                    <Ionicons name="location" size={22} color={BLUE} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.title}>Select Location</Text>
                                    <Text style={styles.subtitle}>Choose your city to see nearby properties</Text>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            {/* Primary — Auto Detect (filled blue, bold) */}
                            <TouchableOpacity
                                style={[styles.primaryBtn, loading && styles.disabled]}
                                onPress={handleAutoDetect}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <Ionicons name="navigate" size={18} color="#fff" />
                                        <Text style={styles.primaryBtnText}>Auto Detect My Location</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            {/* Separator */}
                            <View style={styles.separatorRow}>
                                <View style={styles.separatorLine} />
                                <Text style={styles.separatorText}>or choose manually</Text>
                                <View style={styles.separatorLine} />
                            </View>

                            {/* Secondary — Choose City Dropdown (outlined blue) */}
                            <TouchableOpacity
                                style={styles.secondaryBtn}
                                onPress={() => setExpanded(!expanded)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.secondaryBtnText}>Choose City</Text>
                                <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={BLUE} />
                            </TouchableOpacity>

                            {expanded && (
                                <View style={styles.cityList}>
                                    {CITIES.map((city, index) => (
                                        <TouchableOpacity
                                            key={city.name}
                                            style={[styles.cityItem, index < CITIES.length - 1 && styles.cityItemBorder]}
                                            onPress={() => handleManualSelect(city)}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons name="location-outline" size={16} color={BLUE} style={{ marginRight: 10 }} />
                                            <Text style={styles.cityText}>{city.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {/* Skip */}
                            <TouchableOpacity style={styles.skipBtn} onPress={onSkipOption}>
                                <Text style={styles.skipText}>Skip for now</Text>
                            </TouchableOpacity>

                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.82)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    card: {
        width: '100%',
        backgroundColor: CARD_BG,
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: BLUE_BORDER,
        shadowColor: BLUE,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 12,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginBottom: 20,
    },
    iconBox: {
        width: 46,
        height: 46,
        borderRadius: 14,
        backgroundColor: BLUE_DIM,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: BLUE_BORDER,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.4)',
    },
    divider: {
        height: 1,
        backgroundColor: SURFACE_BORDER,
        marginBottom: 20,
    },
    // ── Primary button (filled solid blue — matches app CTA style) ──
    primaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: BLUE,
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: BLUE,
    },
    primaryBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    disabled: {
        opacity: 0.5,
    },
    separatorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 18,
        gap: 10,
    },
    separatorLine: {
        flex: 1,
        height: 1,
        backgroundColor: SURFACE_BORDER,
    },
    separatorText: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 12,
    },
    // ── Secondary button (outlined blue — matches BookingModal inputWrapper) ──
    secondaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: SURFACE,
        paddingVertical: 16,
        paddingHorizontal: 18,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: BLUE_BORDER,
    },
    secondaryBtnText: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 15,
        fontWeight: '600',
    },
    cityList: {
        marginTop: 8,
        backgroundColor: DARK_BG,
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: SURFACE_BORDER,
    },
    cityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 18,
    },
    cityItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: SURFACE_BORDER,
    },
    cityText: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 14,
        fontWeight: '500',
    },
    skipBtn: {
        marginTop: 20,
        alignItems: 'center',
        paddingVertical: 8,
    },
    skipText: {
        color: 'rgba(255,255,255,0.35)',
        fontSize: 13,
        textDecorationLine: 'underline',
    },
});
