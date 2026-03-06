import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useLikedViewed } from '@/contexts/LikedViewedContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PropertyListCardProps {
    id: number;
    name: string;
    location: string;
    price: string;
    image: string;
    bedrooms: number;
    bathrooms: number;
    area: string;
    description?: string;
    onPress: () => void;
}

export default function PropertyListCard({
    id,
    name,
    location,
    price,
    image,
    bedrooms,
    bathrooms,
    area,
    description,
    onPress,
}: PropertyListCardProps) {
    const { isLiked, toggleLike } = useLikedViewed();
    const liked = isLiked(id, 'listed');

    const handleLike = () => {
        toggleLike({ id, name, location, price, image, bedrooms, bathrooms, area, description, source: 'listed' }, 'listed');
    };

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
            {/* Left: Thumbnail */}
            <Image source={{ uri: image }} style={styles.thumbnail} resizeMode="cover" />

            {/* Right: Info */}
            <View style={styles.info}>
                <View style={styles.topRow}>
                    <Text style={styles.name} numberOfLines={1}>{name}</Text>
                    <TouchableOpacity onPress={handleLike} activeOpacity={0.7} style={styles.likeButton}>
                        <Text style={styles.likeIcon}>{liked ? '❤️' : '🤍'}</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.location} numberOfLines={1}>📍 {location}</Text>

                {description ? (
                    <Text style={styles.description} numberOfLines={2}>{description}</Text>
                ) : null}

                {/* Stats row */}
                <View style={styles.statsRow}>
                    <View style={styles.stat}>
                        <Text style={styles.statIcon}>🛏️</Text>
                        <Text style={styles.statText}>{bedrooms} Bed</Text>
                    </View>
                    <View style={styles.stat}>
                        <Text style={styles.statIcon}>🚿</Text>
                        <Text style={styles.statText}>{bathrooms} Bath</Text>
                    </View>
                    <View style={styles.stat}>
                        <Text style={styles.statIcon}>📐</Text>
                        <Text style={styles.statText}>{area}</Text>
                    </View>
                </View>

                {/* Tags row */}
                <View style={styles.tagsRow}>
                    <View style={styles.priceTag}>
                        <Text style={styles.priceText}>{price}</Text>
                    </View>
                    <View style={styles.tag}>
                        <Text style={styles.tagText}>3D Tour</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 16,
        marginHorizontal: 20,
        marginBottom: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    thumbnail: {
        width: 100,
        height: '100%',
        minHeight: 130,
    },
    info: {
        flex: 1,
        padding: 12,
        justifyContent: 'space-between',
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1,
    },
    likeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    likeIcon: {
        fontSize: 16,
    },
    location: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 2,
    },
    description: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.45)',
        marginTop: 4,
        lineHeight: 15,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 6,
    },
    stat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    statIcon: {
        fontSize: 11,
    },
    statText: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '500',
    },
    tagsRow: {
        flexDirection: 'row',
        gap: 6,
        marginTop: 8,
    },
    priceTag: {
        backgroundColor: 'rgba(74, 222, 128, 0.15)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(74, 222, 128, 0.3)',
    },
    priceText: {
        fontSize: 12,
        color: '#4ade80',
        fontWeight: 'bold',
    },
    tag: {
        backgroundColor: 'rgba(102, 126, 234, 0.15)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(102, 126, 234, 0.3)',
    },
    tagText: {
        fontSize: 12,
        color: '#667eea',
        fontWeight: '600',
    },
});
