import React, { createContext, useContext, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
    isLoggedIn: boolean;
    setLoggedIn: (value: boolean) => void;
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

    const setLoggedIn = useCallback((value: boolean) => {
        setIsLoggedIn(value);
    }, []);

    /**
     * Clears ALL auth from storage first, then flips the in-memory flag.
     * Because the flag change is synchronous, the segment guard sees
     * isLoggedIn=false immediately — no AsyncStorage race condition.
     */
    const logout = useCallback(async () => {
        await AsyncStorage.multiRemove([
            'user',
            'access_token',
            'refresh_token',
            'liked_ids',
            'liked_properties',
        ]);
        setIsLoggedIn(false);
    }, []);

    return (
        <AuthContext.Provider value={{ isLoggedIn, setLoggedIn, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
