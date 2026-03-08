import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
    isLoggedIn: boolean;
    isLoading: boolean;       // true while we're checking AsyncStorage on boot
    setLoggedIn: (value: boolean) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
    return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true); // starts true until storage is read

    // On mount: read AsyncStorage ONCE to seed in-memory state
    useEffect(() => {
        AsyncStorage.getItem('user')
            .then(raw => {
                console.log('[AuthContext] user in storage on boot:', !!raw);
                setIsLoggedIn(!!raw);
            })
            .catch(() => setIsLoggedIn(false))
            .finally(() => setIsLoading(false));
    }, []);

    const setLoggedIn = useCallback((value: boolean) => {
        setIsLoggedIn(value);
    }, []);

    const logout = useCallback(() => {
        setIsLoggedIn(false);
    }, []);

    return (
        <AuthContext.Provider value={{ isLoggedIn, isLoading, setLoggedIn, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
