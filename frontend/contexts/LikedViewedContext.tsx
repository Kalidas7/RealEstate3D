import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authFetch, API_URL } from '@/utils/api';

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
    like_count?: number;
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
    likeCounts: Record<string, number>;
    seedLikeCounts: (properties: PropertyData[], source: 'sponsored' | 'listed') => void;
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
    const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});

    // Version counter: incremented by toggleLike so that any in-flight sync
    // knows its data is stale and should be discarded.
    const mutationVersionRef = useRef(0);

    useEffect(() => {
        loadViewed();
        loadLikedFromCache().then(() => {
            syncLikedFromBackend();
        });
    }, []);

    // ─── Liked — AsyncStorage Cache ─────────────────────────

    const loadLikedFromCache = async () => {
        try {
            const [idsData, propsData] = await Promise.all([
                AsyncStorage.getItem('liked_ids'),
                AsyncStorage.getItem('liked_properties'),
            ]);
            if (idsData) setLikedIds(JSON.parse(idsData));
            if (propsData) {
                const props: PropertyData[] = JSON.parse(propsData);
                setLikedProperties(props);
                // Extract like counts from cached properties
                const counts: Record<string, number> = {};
                props.forEach(p => {
                    if (p.source && p.like_count !== undefined) {
                        counts[`${p.source}_${p.id}`] = p.like_count;
                    }
                });
                setLikeCounts(prev => ({ ...prev, ...counts }));
            }
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
        const token = await AsyncStorage.getItem('access_token');
        if (!token) return;

        // Capture the version before the fetch starts
        const versionBefore = mutationVersionRef.current;

        try {
            const res = await authFetch(`${API_URL}/liked-properties/`);

            if (res.ok) {
                // If a toggle happened while we were fetching, discard the
                // stale response — the optimistic state is more up-to-date.
                if (versionBefore !== mutationVersionRef.current) return;

                const data = await res.json();

                // Handle both response formats:
                //   New: { liked_ids: [...], properties: [...] }
                //   Old: [ property1, property2, ... ]  (flat array)
                let newIds: string[];
                let newProps: PropertyData[];

                if (Array.isArray(data)) {
                    // Old format (flat array of properties with source & liked_item_id)
                    newProps = data;
                    newIds = data
                        .map((p: any) => p.liked_item_id)
                        .filter(Boolean);
                } else {
                    // New format
                    newIds = data.liked_ids || [];
                    newProps = data.properties || [];
                }

                // Double-check version again after parsing
                if (versionBefore !== mutationVersionRef.current) return;

                setLikedIds(newIds);
                setLikedProperties(newProps);
                await saveLikedToCache(newIds, newProps);

                // Extract like counts from properties
                const counts: Record<string, number> = {};
                newProps.forEach(p => {
                    if (p.source && p.like_count !== undefined) {
                        counts[`${p.source}_${p.id}`] = p.like_count;
                    }
                });
                setLikeCounts(prev => ({ ...prev, ...counts }));
            }
        } catch (error) {
            console.error('Error syncing liked from backend:', error);
        }
    }, []);

    const refreshLiked = syncLikedFromBackend;

    const isLiked = useCallback((id: number, source: 'sponsored' | 'listed'): boolean => {
        return likedIds.includes(`${source}_${id}`);
    }, [likedIds]);

    const toggleLike = useCallback(async (property: PropertyData, source: 'sponsored' | 'listed') => {
        const token = await AsyncStorage.getItem('access_token');
        if (!token) return;

        // Bump version so any in-flight sync discards its stale result
        mutationVersionRef.current++;

        const likedItemId = `${source}_${property.id}`;
        const currentlyLiked = likedIds.includes(likedItemId);

        // Optimistic update — BOTH likedIds AND likedProperties
        let newIds: string[];
        let newProps: PropertyData[];

        if (currentlyLiked) {
            newIds = likedIds.filter(id => id !== likedItemId);
            newProps = likedProperties.filter(p => !(p.id === property.id && p.source === source));
            // Optimistic like count decrement
            setLikeCounts(prev => ({
                ...prev,
                [likedItemId]: Math.max(0, (prev[likedItemId] || 1) - 1),
            }));
        } else {
            newIds = [...likedIds, likedItemId];
            const propWithSource = { ...property, source, liked_item_id: likedItemId };
            newProps = [propWithSource, ...likedProperties];
            // Optimistic like count increment
            setLikeCounts(prev => ({
                ...prev,
                [likedItemId]: (prev[likedItemId] || 0) + 1,
            }));
        }

        setLikedIds(newIds);
        setLikedProperties(newProps);
        saveLikedToCache(newIds, newProps);

        try {
            let res: Response;
            if (currentlyLiked) {
                res = await authFetch(`${API_URL}/likes/`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ liked_item_id: likedItemId }),
                });
            } else {
                res = await authFetch(`${API_URL}/likes/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ liked_item_id: likedItemId }),
                });
            }

            // Update like count from backend response
            if (res.ok) {
                const data = await res.json();
                if (data.like_count !== undefined) {
                    setLikeCounts(prev => ({
                        ...prev,
                        [likedItemId]: data.like_count,
                    }));
                }
            }
        } catch (error) {
            console.error('Error toggling like:', error);
            // Revert on error
            setLikedIds(likedIds);
            setLikedProperties(likedProperties);
            saveLikedToCache(likedIds, likedProperties);
        }
    }, [likedIds, likedProperties]);

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

    // Seed like counts from public API data (/all-properties/).
    // Uses mutationVersionRef to avoid overwriting optimistic counts
    // from a recent toggleLike.
    const lastSeedVersionRef = useRef(0);
    const seedLikeCounts = useCallback((properties: PropertyData[], source: 'sponsored' | 'listed') => {
        const currentVersion = mutationVersionRef.current;
        lastSeedVersionRef.current = currentVersion;

        const counts: Record<string, number> = {};
        properties.forEach(p => {
            if (p.like_count !== undefined) {
                counts[`${source}_${p.id}`] = p.like_count;
            }
        });

        setLikeCounts(prev => {
            // If a toggle happened since this seed was initiated, keep
            // the optimistic values for the toggled keys.
            if (currentVersion !== mutationVersionRef.current) return prev;
            return { ...prev, ...counts };
        });
    }, []);

    const clearAll = useCallback(() => {
        setLikedIds([]);
        setLikedProperties([]);
        setViewedProperties([]);
        setLikeCounts({});
    }, []);

    return (
        <LikedViewedContext.Provider value={{
            likedIds, toggleLike, isLiked,
            likedProperties, refreshLiked, syncLikedFromBackend,
            viewedProperties, addViewed, clearAll,
            likeCounts, seedLikeCounts,
        }}>
            {children}
        </LikedViewedContext.Provider>
    );
}
