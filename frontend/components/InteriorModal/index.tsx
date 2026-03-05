import React, { useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { generateInteriorHtml, CameraNode } from './htmlContent';
import { styles } from './styles';

// ─── Types ──────────────────────────────────────────────────────────────────
export type { CameraNode } from './htmlContent';

export interface InteriorModalProps {
    visible: boolean;
    modelUrl: string | null;
    cameraNodes: CameraNode[];
}

// ─── Reusable Interior 3D Viewer ────────────────────────────────────────────
// Pass in the interior model URL and camera nodes from the backend.
// First node in the array = entry point.

export default function InteriorModal({
    visible,
    modelUrl,
    cameraNodes,
}: InteriorModalProps) {
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        if (visible) {
            console.log(`[FILE EXECUTING: frontend/components/InteriorModal/index.tsx] Loaded with ${cameraNodes.length} camera nodes`);
        }
    }, [visible, cameraNodes.length]);

    if (!visible) return null;

    if (!modelUrl) {
        return (
            <View style={styles.placeholder}>
                <Text style={styles.placeholderIcon}>🏠</Text>
                <Text style={styles.placeholderText}>No interior model available</Text>
            </View>
        );
    }

    // Fallback: if no nodes from backend, use empty array (no nav buttons shown)
    const nodes = cameraNodes.length > 0 ? cameraNodes : [];
    const htmlContent = generateInteriorHtml(modelUrl, nodes);

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
                onError={() => setLoading(false)}
            />
            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#667eea" />
                    <Text style={styles.loadingText}>Loading Interior...</Text>
                </View>
            )}
        </View>
    );
}
