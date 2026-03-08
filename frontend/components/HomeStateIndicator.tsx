import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';

interface HomeStateProps {
    type: 'loading' | 'error' | 'empty';
    message?: string;
    onRetry?: () => void;
}

export default function HomeStateIndicator({ type, message, onRetry }: HomeStateProps) {
    if (type === 'loading') {
        return (
            <View style={styles.container}>
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color="#5B8DEF" />
                    <Text style={styles.loadingText}>{message || 'Loading properties...'}</Text>
                </View>
            </View>
        );
    }

    if (type === 'error') {
        return (
            <View style={styles.container}>
                <View style={styles.centerContent}>
                    <Text style={styles.icon}>🔌</Text>
                    <Text style={styles.title}>Server Offline</Text>
                    <Text style={styles.subtitle}>
                        {message || "We can't reach the server right now. Make sure the backend is running."}
                    </Text>
                    {onRetry && (
                        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                            <Text style={styles.retryText}>Retry Connection</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    }

    // Empty state for sections
    return (
        <View style={styles.emptySection}>
            <Text style={styles.emptyText}>{message || 'No properties available'}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: 'rgba(255,255,255,0.7)',
    },
    icon: {
        fontSize: 50,
        marginBottom: 10,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    retryButton: {
        backgroundColor: '#0a0a14',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#5B8DEF',
    },
    retryText: {
        color: '#5B8DEF',
        fontWeight: 'bold',
    },
    emptySection: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#111',
        borderRadius: 16,
        marginHorizontal: 20,
        marginBottom: 20,
        height: 120,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    emptyText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 14,
    },
});
