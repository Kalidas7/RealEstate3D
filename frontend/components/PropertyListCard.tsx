import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
    three_d_file?: string | null;
    interior_file?: string | null;
    interactive_mesh_names?: string;
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
    three_d_file,
    interior_file,
    interactive_mesh_names,
    onPress,
}: PropertyListCardProps) {
    const { isLiked, toggleLike, likeCounts } = useLikedViewed();
    const liked = isLiked(id, 'listed');
    const likeCount = likeCounts[`listed_${id}`] || 0;

    const handleLike = () => {
        toggleLike({ id, name, location, price, image, bedrooms, bathrooms, area, description, three_d_file, interior_file, interactive_mesh_names, source: 'listed' }, 'listed');
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
                        <Ionicons
                            name={liked ? 'heart' : 'heart-outline'}
                            size={18}
                            color={liked ? '#ff4d6d' : 'rgba(255,255,255,0.6)'}
                        />
                        {likeCount > 0 && (
                            <Text style={styles.likeCount}>{likeCount}</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                    <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.6)" />
                    <Text style={[styles.location, { marginLeft: 4 }]} numberOfLines={1}>{location}</Text>
                </View>

                {description ? (
                    <Text style={styles.description} numberOfLines={2}>{description}</Text>
                ) : null}

                {/* Stats row */}
                <View style={styles.statsRow}>
                    <View style={styles.stat}>
                        <Ionicons name="bed-outline" size={14} color="rgba(255,255,255,0.7)" />
                        <Text style={styles.statText}>{bedrooms} Bed</Text>
                    </View>
                    <View style={styles.stat}>
                        <Ionicons name="water-outline" size={14} color="rgba(255,255,255,0.7)" />
                        <Text style={styles.statText}>{bathrooms} Bath</Text>
                    </View>
                    <View style={styles.stat}>
                        <Ionicons name="resize-outline" size={14} color="rgba(255,255,255,0.7)" />
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
        minWidth: 30,
        minHeight: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    likeCount: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.6)',
        fontWeight: '600',
        marginTop: 1,
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
