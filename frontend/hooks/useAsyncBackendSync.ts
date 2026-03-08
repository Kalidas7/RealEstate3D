import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Generic hook: AsyncStorage-first with background backend sync.
 *
 * Usage:
 *   const { data, isLoading, refresh, update } = useAsyncBackendSync<Booking[]>({
 *       cacheKey: 'bookings',
 *       fetchFromBackend: async () => { ... },
 *       defaultValue: [],
 *   });
 */

interface UseAsyncBackendSyncOptions<T> {
    /** AsyncStorage key for caching */
    cacheKey: string;
    /** Async function that fetches fresh data from the backend */
    fetchFromBackend: () => Promise<T | null>;
    /** Default value before any data loads */
    defaultValue: T;
    /** If true, auto-fetch on mount (default: true) */
    autoFetch?: boolean;
}

interface UseAsyncBackendSyncResult<T> {
    /** Current data (from cache or backend) */
    data: T;
    /** True while initial load is happening */
    isLoading: boolean;
    /** Manually trigger a backend sync */
    refresh: () => Promise<void>;
    /** Optimistically update local data + cache, then sync from backend */
    update: (newData: T) => Promise<void>;
    /** Directly set data without syncing */
    setData: React.Dispatch<React.SetStateAction<T>>;
}

export function useAsyncBackendSync<T>({
    cacheKey,
    fetchFromBackend,
    defaultValue,
    autoFetch = true,
}: UseAsyncBackendSyncOptions<T>): UseAsyncBackendSyncResult<T> {
    const [data, setData] = useState<T>(defaultValue);
    const [isLoading, setIsLoading] = useState(true);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        if (autoFetch) {
            loadFromCache().then(() => syncFromBackend());
        }
        return () => { isMounted.current = false; };
    }, []);

    const loadFromCache = async () => {
        try {
            const cached = await AsyncStorage.getItem(cacheKey);
            if (cached && isMounted.current) {
                setData(JSON.parse(cached));
            }
        } catch (e) {
            console.error(`[AsyncSync] Error loading cache "${cacheKey}":`, e);
        } finally {
            if (isMounted.current) setIsLoading(false);
        }
    };

    const saveToCache = async (value: T) => {
        try {
            await AsyncStorage.setItem(cacheKey, JSON.stringify(value));
        } catch (e) {
            console.error(`[AsyncSync] Error saving cache "${cacheKey}":`, e);
        }
    };

    const fetchRef = useRef(fetchFromBackend);
    useEffect(() => {
        fetchRef.current = fetchFromBackend;
    }, [fetchFromBackend]);

    const syncFromBackend = useCallback(async () => {
        try {
            const freshData = await fetchRef.current();
            if (freshData !== null && isMounted.current) {
                setData(freshData);
                await saveToCache(freshData);
            }
        } catch (e) {
            console.error(`[AsyncSync] Error syncing "${cacheKey}" from backend:`, e);
        }
    }, [cacheKey]);

    const refresh = syncFromBackend;

    const update = useCallback(async (newData: T) => {
        // Optimistically update state + cache
        if (isMounted.current) setData(newData);
        await saveToCache(newData);
        // Then sync from backend in background (non-blocking)
        syncFromBackend().catch(() => { });
    }, [syncFromBackend]);

    return { data, isLoading, refresh, update, setData };
}
