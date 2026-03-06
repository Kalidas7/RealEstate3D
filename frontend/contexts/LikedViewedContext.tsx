import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://realestate3d.onrender.com/api';

interface PropertyData {
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
    source?: 'sponsored' | 'listed';
}

interface LikedViewedContextType {
    // Liked (backend-synced)
    likedIds: Set<string>;
    toggleLike: (property: PropertyData, source: 'sponsored' | 'listed') => Promise<void>;
    isLiked: (id: number, source: 'sponsored' | 'listed') => boolean;
    likedProperties: PropertyData[];
    refreshLiked: () => Promise<void>;

    // Viewed (AsyncStorage)
    viewedProperties: PropertyData[];
    addViewed: (property: PropertyData) => Promise<void>;
}

const LikedViewedContext = createContext<LikedViewedContextType | undefined>(undefined);

export function useLikedViewed() {
    const context = useContext(LikedViewedContext);
    if (!context) throw new Error('useLikedViewed must be used within LikedViewedProvider');
    return context;
}

export function LikedViewedProvider({ children }: { children: React.ReactNode }) {
    const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
    const [likedProperties, setLikedProperties] = useState<PropertyData[]>([]);
    const [viewedProperties, setViewedProperties] = useState<PropertyData[]>([]);

    // Load viewed from AsyncStorage and liked IDs from backend on mount
    useEffect(() => {
        loadViewed();
        loadLikedIds();
    }, []);

    const getUserEmail = async (): Promise<string | null> => {
        try {
            const userData = await AsyncStorage.getItem('user');
            if (userData) {
                return JSON.parse(userData).email;
            }
        } catch (e) {
            console.error('Error getting user email:', e);
        }
        return null;
    };

    // ─── Liked (Backend) ───────────────────────────────────

    const loadLikedIds = async () => {
        const email = await getUserEmail();
        if (!email) return;

        try {
            const response = await fetch(`${API_URL}/likes/?email=${encodeURIComponent(email)}`);
            if (response.ok) {
                const data = await response.json();
                const ids = new Set<string>(data.map((like: any) => like.liked_item_id));
                setLikedIds(ids);
            }
        } catch (error) {
            console.error('Error loading liked IDs:', error);
        }
    };

    const refreshLiked = useCallback(async () => {
        const email = await getUserEmail();
        if (!email) return;

        try {
            const response = await fetch(`${API_URL}/liked-properties/?email=${encodeURIComponent(email)}`);
            if (response.ok) {
                const data = await response.json();
                setLikedProperties(data);
            }
        } catch (error) {
            console.error('Error fetching liked properties:', error);
        }
    }, []);

    const isLiked = useCallback((id: number, source: 'sponsored' | 'listed'): boolean => {
        return likedIds.has(`${source}_${id}`);
    }, [likedIds]);

    const toggleLike = useCallback(async (property: PropertyData, source: 'sponsored' | 'listed') => {
        const email = await getUserEmail();
        if (!email) return;

        const likedItemId = `${source}_${property.id}`;
        const currentlyLiked = likedIds.has(likedItemId);

        // Optimistic update
        setLikedIds(prev => {
            const newSet = new Set(prev);
            if (currentlyLiked) {
                newSet.delete(likedItemId);
            } else {
                newSet.add(likedItemId);
            }
            return newSet;
        });

        try {
            if (currentlyLiked) {
                // Unlike — DELETE
                await fetch(`${API_URL}/likes/`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, liked_item_id: likedItemId }),
                });
            } else {
                // Like — POST
                await fetch(`${API_URL}/likes/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, liked_item_id: likedItemId }),
                });
            }
        } catch (error) {
            // Revert on error
            console.error('Error toggling like:', error);
            setLikedIds(prev => {
                const newSet = new Set(prev);
                if (currentlyLiked) {
                    newSet.add(likedItemId);
                } else {
                    newSet.delete(likedItemId);
                }
                return newSet;
            });
        }
    }, [likedIds]);

    // ─── Viewed (AsyncStorage) ─────────────────────────────

    const loadViewed = async () => {
        try {
            const data = await AsyncStorage.getItem('viewed_properties');
            if (data) {
                setViewedProperties(JSON.parse(data));
            }
        } catch (error) {
            console.error('Error loading viewed:', error);
        }
    };

    const addViewed = useCallback(async (property: PropertyData) => {
        setViewedProperties(prev => {
            // Remove duplicate if exists, add to front
            const filtered = prev.filter(p => !(p.id === property.id && p.source === property.source));
            const updated = [property, ...filtered].slice(0, 50); // Keep max 50
            // Persist async
            AsyncStorage.setItem('viewed_properties', JSON.stringify(updated)).catch(console.error);
            return updated;
        });
    }, []);

    return (
        <LikedViewedContext.Provider value={{
            likedIds,
            toggleLike,
            isLiked,
            likedProperties,
            refreshLiked,
            viewedProperties,
            addViewed,
        }}>
            {children}
        </LikedViewedContext.Provider>
    );
}
