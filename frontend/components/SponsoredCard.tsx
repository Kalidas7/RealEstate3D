import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLikedViewed } from '@/contexts/LikedViewedContext';

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
    three_d_file?: string | null;
    interior_file?: string | null;
    interactive_mesh_names?: string;
    onPress: () => void;
}

export default function SponsoredCard({
    id,
    name,
    location,
    price,
    image,
    bedrooms,
    area,
    three_d_file,
    interior_file,
    interactive_mesh_names,
    onPress,
}: SponsoredCardProps) {
    const { isLiked, toggleLike, likeCounts } = useLikedViewed();
    const liked = isLiked(id, 'sponsored');
    const likeCount = likeCounts[`sponsored_${id}`] || 0;

    const handleLike = () => {
        toggleLike({ id, name, location, price, image, bedrooms, bathrooms: 0, area, three_d_file, interior_file, interactive_mesh_names, source: 'sponsored' }, 'sponsored');
    };

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.92}>
            <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.9)']}
                style={styles.gradient}
            />

            {/* Sponsored badge — LEFT side */}
            <View style={styles.exploreBadge}>
                <Text style={styles.exploreText}>Sponsored ⭐</Text>
            </View>

            {/* Like button — RIGHT side, minimalist */}
            <TouchableOpacity style={styles.likeButton} onPress={handleLike} activeOpacity={0.7}>
                <Ionicons
                    name={liked ? 'heart' : 'heart-outline'}
                    size={18}
                    color={liked ? '#ff4d6d' : '#fff'}
                />
                {likeCount > 0 && (
                    <Text style={styles.likeCount}>{likeCount}</Text>
                )}
            </TouchableOpacity>

            {/* Bottom info */}
            <View style={styles.content}>
                <Text style={styles.name} numberOfLines={1}>{name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                    <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.85)" />
                    <Text style={[styles.location, { marginBottom: 0, marginLeft: 4 }]} numberOfLines={1}>{location}</Text>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.price}>{price}</Text>
                    <View style={styles.specs}>
                        <View style={styles.spec}>
                            <Ionicons name="bed-outline" size={13} color="#fff" />
                            <Text style={styles.specText}>{bedrooms}</Text>
                        </View>
                        <View style={styles.spec}>
                            <Ionicons name="resize-outline" size={13} color="#fff" />
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
        left: 18,
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
    likeButton: {
        position: 'absolute',
        top: 18,
        right: 18,
        minWidth: 36,
        minHeight: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 6,
    },
    likeCount: {
        fontSize: 10,
        color: '#fff',
        fontWeight: '600',
        marginTop: 1,
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
