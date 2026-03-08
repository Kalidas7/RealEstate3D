import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';

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

export default function LocationModal({ visible, onClose, onSelectLocation, onSkipOption }: LocationModalProps) {
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const handleAutoDetect = async () => {
        setLoading(true);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Allow location access to auto-detect your city.');
                setLoading(false);
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            let geocode = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            });

            if (geocode && geocode.length > 0) {
                const city = geocode[0].city || geocode[0].subregion || geocode[0].region || "Unknown Location";
                onSelectLocation(city, location.coords.latitude, location.coords.longitude);
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

    const handleManualSelect = (cityObj: { name: string, lat: number, lon: number }) => {
        onSelectLocation(cityObj.name, cityObj.lat, cityObj.lon);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback onPress={() => { }}>
                        <View style={styles.modalContent}>
                            <View style={styles.iconContainer}>
                                <Ionicons name="location-outline" size={24} color="#5B8DEF" />
                            </View>
                            <Text style={styles.title}>Select Location</Text>
                            <Text style={styles.subtitle}>Choose your city to see nearby properties</Text>

                            <TouchableOpacity
                                style={[styles.autoDetectBtn, loading && styles.disabledBtn]}
                                onPress={handleAutoDetect}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#5B8DEF" />
                                ) : (
                                    <>
                                        <Ionicons name="navigate" size={18} color="#5B8DEF" />
                                        <Text style={styles.autoDetectText}>Auto Detect</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            <View style={styles.separatorContainer}>
                                <View style={styles.line} />
                                <Text style={styles.orText}>or</Text>
                                <View style={styles.line} />
                            </View>

                            <TouchableOpacity
                                style={styles.manualDropdown}
                                onPress={() => setExpanded(!expanded)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.manualText}>Choose Manually</Text>
                                <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={20} color="rgba(255,255,255,0.7)" />
                            </TouchableOpacity>

                            {expanded && (
                                <View style={styles.expandedContainer}>
                                    {CITIES.map((city, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={[styles.cityItem, index < CITIES.length - 1 && styles.cityItemBorder]}
                                            onPress={() => handleManualSelect(city)}
                                        >
                                            <Text style={styles.cityText}>{city.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

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
        backgroundColor: 'rgba(0,0,0,0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        width: '100%',
        backgroundColor: '#1a1a2e',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(91, 141, 239, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(91, 141, 239, 0.3)',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.4)',
        marginBottom: 24,
        textAlign: 'center',
    },
    autoDetectBtn: {
        width: '100%',
        flexDirection: 'row',
        backgroundColor: '#0a0a14',
        paddingVertical: 14,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: '#5B8DEF',
    },
    disabledBtn: {
        opacity: 0.5,
    },
    autoDetectText: {
        color: '#5B8DEF',
        fontSize: 15,
        fontWeight: 'bold',
    },
    separatorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginVertical: 20,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    orText: {
        color: 'rgba(255,255,255,0.4)',
        paddingHorizontal: 12,
        fontSize: 12,
    },
    manualDropdown: {
        width: '100%',
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.03)',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    manualText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        fontWeight: '500',
    },
    expandedContainer: {
        width: '100%',
        marginTop: 8,
        backgroundColor: '#0a0a14',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    cityItem: {
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    cityItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    cityText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
    },
    skipBtn: {
        marginTop: 20,
        paddingVertical: 10,
    },
    skipText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 14,
        textDecorationLine: 'underline',
    }
});
