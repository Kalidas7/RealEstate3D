import React, { useState } from 'react';
import { View, Text, ActivityIndicator, Modal, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { styles } from './styles';
import { generateThreeJsHtml } from './htmlContent';

// ─── Types ──────────────────────────────────────────────────────────────────
export interface BuildingConfig {
    fixedButtons: Array<{
        name: string;
        pos: number[];
        size: number[];
    }>;
    interactiveMeshNames: string[];
}

export interface ThreeDModalProps {
    visible: boolean;
    onClose: () => void;
    modelUrl: string | null;
    propertyName: string;
    buildingConfig: BuildingConfig;
    onEnterInterior?: () => void;
}

// ─── Reusable 3D Viewer Modal ───────────────────────────────────────────────
// This modal wraps the Three.js WebView 3D engine and can be used by any
// building's exterior view. Pass in the building's config (mesh names,
// fixed buttons) and model URL.

export default function ThreeDModal({
    visible,
    onClose,
    modelUrl,
    propertyName,
    buildingConfig,
    onEnterInterior,
}: ThreeDModalProps) {
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        if (visible) {
            console.log(`[FILE EXECUTING: frontend/components/ThreeDModal/index.tsx] Modal opened for: ${propertyName}`);
        }
    }, [visible, propertyName]);

    if (!visible) return null;

    if (!modelUrl) {
        return (
            <View style={styles.container}>
                <View style={styles.placeholder}>
                    <Text style={styles.placeholderIcon}>🏗️</Text>
                    <Text style={styles.placeholderText}>No 3D model available</Text>
                </View>
            </View>
        );
    }

    const htmlContent = generateThreeJsHtml(modelUrl, buildingConfig);

    return (
        <View style={styles.container}>
            <WebView
                source={{ html: htmlContent }}
                style={styles.webview}
                onLoadStart={() => setLoading(true)}
                onLoadEnd={() => setLoading(false)}
                originWhitelist={['*']}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                allowFileAccess={true}
                mixedContentMode="always"
                onMessage={(event) => {
                    try {
                        const data = JSON.parse(event.nativeEvent.data);
                        if (data.type === 'log') {
                            console.log('[WebView Log]', data.message);
                        } else if (data.type === 'error') {
                            console.error('[WebView Error]', data.message);
                        } else if (data.type === 'fixed_click') {
                            console.log('--- FIXED BUTTON CLICKED ---');
                            console.log('Button:', data.name);
                            console.log('Position (Center):', JSON.stringify(data.center));
                            console.log('Size:', JSON.stringify(data.size));
                            console.log('Result: Click Registered');
                            console.log('----------------------------');

                            if (onEnterInterior) {
                                onEnterInterior();
                            }
                        } else if (data.type === 'selection') {
                            console.log('--- NEW MESH LOG ---');
                            console.log('Name:', data.meshName);
                            console.log('Position (Center):', JSON.stringify(data.center.map((n: number) => parseFloat(n.toFixed(3)))));
                            console.log('Size:', JSON.stringify(data.size.map((n: number) => parseFloat(n.toFixed(3)))));
                            console.log('---------------------');
                        }
                    } catch (e) {
                        console.log('[WebView Message]', event.nativeEvent.data);
                    }
                }}
                onError={() => setLoading(false)}
            />
            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#667eea" />
                    <Text style={styles.loadingText}>Loading 3D Viewer...</Text>
                </View>
            )}
        </View>
    );
}
