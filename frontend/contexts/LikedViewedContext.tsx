import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://realestate3d.onrender.com/api';

export interface PropertyData {
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
    source?: 'sponsored' | 'listed';
    liked_item_id?: string;
}

interface LikedViewedContextType {
    likedIds: string[];
    toggleLike: (property: PropertyData, source: 'sponsored' | 'listed') => Promise<void>;
    isLiked: (id: number, source: 'sponsored' | 'listed') => boolean;
    likedProperties: PropertyData[];
    refreshLiked: () => Promise<void>;
    syncLikedFromBackend: () => Promise<void>;
    viewedProperties: PropertyData[];
    addViewed: (property: PropertyData) => Promise<void>;
    clearAll: () => void;
}

const LikedViewedContext = createContext<LikedViewedContextType | undefined>(undefined);

export function useLikedViewed() {
    const context = useContext(LikedViewedContext);
    if (!context) throw new Error('useLikedViewed must be used within LikedViewedProvider');
    return context;
}

export function LikedViewedProvider({ children }: { children: React.ReactNode }) {
    const [likedIds, setLikedIds] = useState<string[]>([]);
    const [likedProperties, setLikedProperties] = useState<PropertyData[]>([]);
    const [viewedProperties, setViewedProperties] = useState<PropertyData[]>([]);

    useEffect(() => {
        loadViewed();
        loadLikedFromCache().then(() => {
            syncLikedFromBackend();
        });
    }, []);

    const getUserEmail = async (): Promise<string | null> => {
        try {
            const userData = await AsyncStorage.getItem('user');
            if (userData) return JSON.parse(userData).email;
        } catch (e) {
            console.error('Error getting user email:', e);
        }
        return null;
    };

    // ─── Liked — AsyncStorage Cache ─────────────────────────

    const loadLikedFromCache = async () => {
        try {
            const [idsData, propsData] = await Promise.all([
                AsyncStorage.getItem('liked_ids'),
                AsyncStorage.getItem('liked_properties'),
            ]);
            if (idsData) setLikedIds(JSON.parse(idsData));
            if (propsData) setLikedProperties(JSON.parse(propsData));
        } catch (error) {
            console.error('Error loading liked from cache:', error);
        }
    };

    const saveLikedToCache = async (ids: string[], props: PropertyData[]) => {
        try {
            await Promise.all([
                AsyncStorage.setItem('liked_ids', JSON.stringify(ids)),
                AsyncStorage.setItem('liked_properties', JSON.stringify(props)),
            ]);
        } catch (error) {
            console.error('Error saving liked to cache:', error);
        }
    };

    // ─── Liked — Backend Sync ───────────────────────────────

    const syncLikedFromBackend = useCallback(async () => {
        const email = await getUserEmail();
        if (!email) return;

        try {
            const [likesRes, propsRes] = await Promise.all([
                fetch(`${API_URL}/likes/?email=${encodeURIComponent(email)}`),
                fetch(`${API_URL}/liked-properties/?email=${encodeURIComponent(email)}`),
            ]);

            let newIds: string[] = [];
            let newProps: PropertyData[] = [];

            if (likesRes.ok) {
                const likesData = await likesRes.json();
                newIds = likesData.map((like: any) => like.liked_item_id);
            }
            if (propsRes.ok) {
                newProps = await propsRes.json();
            }

            // Always update state and cache, even if 0 items, to overwrite stale data
            setLikedIds(newIds);
            setLikedProperties(newProps);
            await saveLikedToCache(newIds, newProps);
        } catch (error) {
            console.error('Error syncing liked from backend:', error);
        }
    }, []);

    const refreshLiked = syncLikedFromBackend;

    const isLiked = useCallback((id: number, source: 'sponsored' | 'listed'): boolean => {
        return likedIds.includes(`${source}_${id}`);
    }, [likedIds]);

    const toggleLike = useCallback(async (property: PropertyData, source: 'sponsored' | 'listed') => {
        const email = await getUserEmail();
        if (!email) return;

        const likedItemId = `${source}_${property.id}`;
        const currentlyLiked = likedIds.includes(likedItemId);

        // Optimistic update — BOTH likedIds AND likedProperties
        let newIds: string[];
        let newProps: PropertyData[];

        if (currentlyLiked) {
            newIds = likedIds.filter(id => id !== likedItemId);
            newProps = likedProperties.filter(p => !(p.id === property.id && p.source === source));
        } else {
            newIds = [...likedIds, likedItemId];
            // Add property with source to liked properties
            const propWithSource = { ...property, source, liked_item_id: likedItemId };
            newProps = [propWithSource, ...likedProperties];
        }

        setLikedIds(newIds);
        setLikedProperties(newProps);

        // Save to AsyncStorage immediately
        saveLikedToCache(newIds, newProps);

        try {
            if (currentlyLiked) {
                await fetch(`${API_URL}/likes/`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, liked_item_id: likedItemId }),
                });
            } else {
                await fetch(`${API_URL}/likes/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, liked_item_id: likedItemId }),
                });
            }
        } catch (error) {
            console.error('Error toggling like:', error);
            // Revert on error
            setLikedIds(likedIds);
            setLikedProperties(likedProperties);
            saveLikedToCache(likedIds, likedProperties);
        }
    }, [likedIds, likedProperties, syncLikedFromBackend]);

    // ─── Viewed (AsyncStorage) ─────────────────────────────

    const loadViewed = async () => {
        try {
            const data = await AsyncStorage.getItem('viewed_properties');
            if (data) setViewedProperties(JSON.parse(data));
        } catch (error) {
            console.error('Error loading viewed:', error);
        }
    };

    const addViewed = useCallback(async (property: PropertyData) => {
        setViewedProperties(prev => {
            const filtered = prev.filter(p => !(p.id === property.id && p.source === property.source));
            const updated = [property, ...filtered].slice(0, 50);
            AsyncStorage.setItem('viewed_properties', JSON.stringify(updated)).catch(console.error);
            return updated;
        });
    }, []);

    const clearAll = useCallback(() => {
        setLikedIds([]);
        setLikedProperties([]);
        setViewedProperties([]);
    }, []);

    return (
        <LikedViewedContext.Provider value={{
            likedIds, toggleLike, isLiked,
            likedProperties, refreshLiked, syncLikedFromBackend,
            viewedProperties, addViewed, clearAll,
        }}>
            {children}
        </LikedViewedContext.Provider>
    );
}
