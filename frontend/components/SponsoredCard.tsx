import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Sponsored card — slightly smaller to leave room for the property list below
export const CARD_WIDTH = SCREEN_WIDTH * 0.65;
export const CARD_HEIGHT = SCREEN_HEIGHT * 0.38;
export const CARD_MARGIN = 8;

interface SponsoredCardProps {
    id: number;
    name: string;
    location: string;
    price: string;
    image: string;
    bedrooms: number;
    area: string;
    onPress: () => void;
}

export default function SponsoredCard({
    name,
    location,
    price,
    image,
    bedrooms,
    area,
    onPress,
}: SponsoredCardProps) {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.92}>
            <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.9)']}
                style={styles.gradient}
            />

            {/* Sponsored badge */}
            <View style={styles.exploreBadge}>
                <Text style={styles.exploreText}>Sponsored ⭐</Text>
            </View>

            {/* Bottom info */}
            <View style={styles.content}>
                <Text style={styles.name} numberOfLines={1}>{name}</Text>
                <Text style={styles.location} numberOfLines={1}>📍 {location}</Text>

                <View style={styles.footer}>
                    <Text style={styles.price}>{price}</Text>
                    <View style={styles.specs}>
                        <View style={styles.spec}>
                            <Text style={styles.specIcon}>🛏️</Text>
                            <Text style={styles.specText}>{bedrooms}</Text>
                        </View>
                        <View style={styles.spec}>
                            <Text style={styles.specIcon}>📐</Text>
                            <Text style={styles.specText}>{area}</Text>
                        </View>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 28,
        overflow: 'hidden',
        backgroundColor: '#1a1a2e',
        marginHorizontal: CARD_MARGIN,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 14,
    },
    image: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    gradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '50%',
    },
    exploreBadge: {
        position: 'absolute',
        top: 18,
        right: 18,
        backgroundColor: 'rgba(255,255,255,0.18)',
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.35)',
    },
    exploreText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    content: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 22,
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 3,
    },
    location: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.85)',
        marginBottom: 10,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    price: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4ade80',
    },
    specs: {
        flexDirection: 'row',
        gap: 8,
    },
    spec: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    specIcon: {
        fontSize: 13,
    },
    specText: {
        fontSize: 13,
        color: '#fff',
        fontWeight: '600',
    },
});
