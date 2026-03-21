import React, { useState } from 'react';
import {
    View, Text, Modal, TouchableOpacity,
    TouchableWithoutFeedback, ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { styles, BLUE } from './styles';

interface LocationModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectLocation: (city: string, lat: number | null, lon: number | null) => void;
    onSkipOption: () => void;
}

const CITIES = [
    { name: 'Trivandrum', lat: 8.5241, lon: 76.9366 },
    { name: 'Kochi', lat: 9.9312, lon: 76.2673 },
    { name: 'Kollam', lat: 8.8932, lon: 76.5596 },
];

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
                const city = geocode[0].city || geocode[0].subregion || geocode[0].region || 'Unknown';
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

                            {/* Primary — Auto Detect (solid blue button) */}
                            <TouchableOpacity
                                style={[styles.primaryBtn, loading && styles.disabled]}
                                onPress={handleAutoDetect}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                {loading ? (
                                    <ActivityIndicator color={BLUE} />
                                ) : (
                                    <>
                                        <Ionicons name="navigate" size={18} color={BLUE} />
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

                            {/* Secondary — Choose City (outlined blue dropdown) */}
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
                                            style={[
                                                styles.cityItem,
                                                index < CITIES.length - 1 && styles.cityItemBorder,
                                            ]}
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
