import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
    isLoggedIn: boolean;
    isLoading: boolean;
    user: any;
    setLoggedIn: (value: boolean) => void;
    setUser: (user: any) => void;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
    return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUserState] = useState<any>(null);

    // On mount: read AsyncStorage ONCE to seed in-memory state
    useEffect(() => {
        Promise.all([
            AsyncStorage.getItem('user'),
            AsyncStorage.getItem('access_token'),
        ])
            .then(([raw, token]) => {
                if (raw && token) {
                    const parsed = JSON.parse(raw);
                    console.log('[AuthContext] boot user pic:', parsed?.profile?.profile_pic);
                    setUserState(parsed);
                    setIsLoggedIn(true);
                } else if (raw && !token) {
                    // User data exists but no token — clear stale user data
                    console.log('[AuthContext] Stale user data found without token — clearing');
                    AsyncStorage.removeItem('user');
                }
            })
            .catch(() => { })
            .finally(() => setIsLoading(false));
    }, []);

    const setLoggedIn = useCallback((value: boolean) => {
        setIsLoggedIn(value);
    }, []);

    // Update user in both memory and AsyncStorage
    const setUser = useCallback((userData: any) => {
        console.log('[AuthContext] setUser called, pic:', userData?.profile?.profile_pic);
        setUserState(userData);
        if (userData) {
            AsyncStorage.setItem('user', JSON.stringify(userData));
        }
    }, []);

    const logout = useCallback(async () => {
        await AsyncStorage.multiRemove([
            'user',
            'access_token',
            'refresh_token',
            'liked_ids',
            'liked_properties',
            'user_location',
        ]);
        setIsLoggedIn(false);
        setUserState(null);
    }, []);

    return (
        <AuthContext.Provider value={{ isLoggedIn, isLoading, user, setLoggedIn, setUser, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
