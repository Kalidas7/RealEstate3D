import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TextInput, FlatList, TouchableOpacity,
    StyleSheet, ActivityIndicator, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import PropertyListCard from '@/components/PropertyListCard';
import { type PropertyData } from '@/contexts/LikedViewedContext';
import { API_URL } from '@/utils/api';

type SearchResult = PropertyData & { source: 'sponsored' | 'listed' };

export default function SearchScreen() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef = useRef<TextInput>(null);

    useEffect(() => {
        const t = setTimeout(() => inputRef.current?.focus(), 100);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        if (query.trim() === '') {
            setResults([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(async () => {
            try {
                const response = await fetch(`${API_URL}/search/?q=${encodeURIComponent(query.trim())}`);
                if (!response.ok) return;
                const data = await response.json();
                const combined: SearchResult[] = [
                    ...(data.sponsored || []).map((p: PropertyData) => ({ ...p, source: 'sponsored' as const })),
                    ...(data.listed || []).map((p: PropertyData) => ({ ...p, source: 'listed' as const })),
                ];
                setResults(combined);
            } catch (e) {
                console.error('Search error:', e);
            } finally {
                setLoading(false);
            }
        }, 250);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query]);

    const handlePress = (item: SearchResult) => {
        router.push({
            pathname: '/property/[id]',
            params: { id: item.id, property: JSON.stringify(item) },
        });
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.inputContainer}>
                    <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.6)" />
                    <TextInput
                        ref={inputRef}
                        style={styles.input}
                        placeholder="Search properties, builders..."
                        placeholderTextColor="rgba(255,255,255,0.5)"
                        value={query}
                        onChangeText={setQuery}
                        autoFocus
                        returnKeyType="search"
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={() => setQuery('')} activeOpacity={0.7}>
                            <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.5)" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {loading && (
                <ActivityIndicator color="#5B8DEF" style={{ marginTop: 30 }} />
            )}

            {!loading && query.trim() !== '' && results.length === 0 && (
                <View style={styles.empty}>
                    <Ionicons name="search-outline" size={48} color="rgba(255,255,255,0.15)" />
                    <Text style={styles.emptyText}>No results for "{query}"</Text>
                </View>
            )}

            {!loading && query.trim() === '' && (
                <View style={styles.empty}>
                    <Ionicons name="search-outline" size={48} color="rgba(255,255,255,0.15)" />
                    <Text style={styles.emptyText}>Search by name, location, or builder</Text>
                </View>
            )}

            <FlatList
                data={results}
                keyExtractor={(item) => `${item.source}-${item.id}`}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 120 }}
                renderItem={({ item }) => (
                    <PropertyListCard
                        id={item.id}
                        name={item.name}
                        location={item.location}
                        price={item.price}
                        image={item.image}
                        bedrooms={item.bedrooms}
                        bathrooms={item.bathrooms}
                        area={item.area}
                        description={item.description || ''}
                        three_d_file={item.three_d_file}
                        interior_file={item.interior_file}
                        interactive_mesh_names={item.interactive_mesh_names}
                        onPress={() => handlePress(item)}
                    />
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 16,
        paddingBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    backButton: {
        padding: 4,
    },
    inputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 15,
        paddingHorizontal: 15,
        paddingVertical: Platform.OS === 'android' ? 10 : 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        gap: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#fff',
    },
    empty: {
        alignItems: 'center',
        marginTop: 80,
        gap: 12,
    },
    emptyText: {
        color: 'rgba(255,255,255,0.35)',
        fontSize: 15,
    },
});
