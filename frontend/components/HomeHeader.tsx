import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface HomeHeaderProps {
    profilePicUrl: string | null;
    isFilterVisible: boolean;
    setIsFilterVisible: (visible: boolean) => void;
    activeFilter: string | null;
    selectFilter: (filter: string) => void;
    selectedCity: string | null;
    onLocationPress: () => void;
}

export default function HomeHeader({
    profilePicUrl,
    isFilterVisible,
    setIsFilterVisible,
    activeFilter,
    selectFilter,
    selectedCity,
    onLocationPress,
}: HomeHeaderProps) {
    const router = useRouter();

    return (
        <View style={styles.header}>
            <View style={styles.headerTop}>
                <View>

                    <Text style={styles.title}>Properties</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={styles.profileButton} activeOpacity={0.8}>
                    {profilePicUrl ? (
                        <Image source={{ uri: profilePicUrl }} style={{ width: 45, height: 45, borderRadius: 22.5 }} />
                    ) : (
                        <Ionicons name="person-outline" size={20} color="#fff" />
                    )}
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={styles.searchContainer}
                onPress={() => router.push('/search' as any)}
                activeOpacity={0.8}
            >
                <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.6)" style={styles.searchIcon} />
                <Text style={styles.searchPlaceholder}>Search properties, builders...</Text>
                <TouchableOpacity onPress={() => setIsFilterVisible(!isFilterVisible)} style={styles.filterIconButton} activeOpacity={0.7}>
                    <Ionicons name="options-outline" size={20} color={isFilterVisible ? "#5B8DEF" : "#fff"} />
                </TouchableOpacity>
            </TouchableOpacity>

            {isFilterVisible && (
                <View style={styles.filterOptionsContainer}>
                    <TouchableOpacity
                        style={styles.filterOption}
                        onPress={onLocationPress}
                    >
                        <Text style={styles.filterOptionText}>📍 Location {selectedCity ? `(${selectedCity})` : ''}</Text>
                    </TouchableOpacity>
                    {['Place', 'Villa', 'Type', 'Bedroom'].map((filter) => (
                        <TouchableOpacity
                            key={filter}
                            style={[styles.filterOption, activeFilter === filter && styles.filterOptionActive]}
                            onPress={() => selectFilter(filter)}
                        >
                            <Text style={[styles.filterOptionText, activeFilter === filter && styles.filterOptionTextActive]}>
                                {filter}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 10,
        backgroundColor: 'transparent',
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    greeting: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
    },
    profileButton: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchContainer: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 15,
        paddingHorizontal: 15,
        paddingVertical: Platform.OS === 'android' ? 10 : 12,
        marginBottom: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    searchIcon: {
        fontSize: 18,
        marginRight: 10,
    },
    searchPlaceholder: {
        flex: 1,
        fontSize: 16,
        color: 'rgba(255,255,255,0.5)',
    },
    filterIconButton: {
        marginLeft: 10,
    },
    filterOptionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 10,
        gap: 8,
    },
    filterOption: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    filterOptionActive: {
        backgroundColor: 'rgba(91, 141, 239, 0.15)',
        borderColor: '#5B8DEF',
    },
    filterOptionText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 13,
    },
    filterOptionTextActive: {
        color: '#5B8DEF',
        fontWeight: '600',
    },
});
