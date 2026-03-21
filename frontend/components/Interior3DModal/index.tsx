import React, { useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { styles } from './styles';
import { generateInteriorHtml } from './htmlContent';

export interface Interior3DModalProps {
    visible: boolean;
    modelUrl: string | null;
}

export default function Interior3DModal({
    visible,
    modelUrl,
}: Interior3DModalProps) {
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        if (visible) {
            console.log(`[FILE EXECUTING: frontend/components/Interior3DModal/index.tsx] Component mounted. Requested Model URL: ${modelUrl}`);
        }
    }, [visible, modelUrl]);

    if (!visible) return null;

    if (!modelUrl) {
        return (
            <View style={styles.container}>
                <View style={styles.placeholder}>
                    <Text style={styles.placeholderIcon}>🏠</Text>
                    <Text style={styles.placeholderText}>No interior model available</Text>
                </View>
            </View>
        );
    }

    const htmlContent = generateInteriorHtml(modelUrl);

    return (
        <View style={styles.container}>
            <WebView
                source={{ html: htmlContent }}
                style={styles.webview}
                onLoadStart={() => {
                    console.log('[Interior3DModal] WebView started loading HTML canvas...');
                    setLoading(true);
                }}
                onLoadEnd={() => {
                    console.log('[Interior3DModal] WebView finished loading HTML canvas.');
                    setLoading(false);
                }}
                originWhitelist={['*']}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                allowFileAccess={true}
                mixedContentMode="always"
                scalesPageToFit={false}
                onMessage={(event) => {
                    try {
                        const data = JSON.parse(event.nativeEvent.data);
                        if (data.type === 'log') {
                            console.log('[Interior WebView Log]', data.message);
                        } else if (data.type === 'error') {
                            console.error('[Interior WebView ERROR]', data.message);
                            if (data.stack) console.error(data.stack);
                        }
                    } catch (e) {
                        console.log('[Interior WebView Message]', event.nativeEvent.data);
                    }
                }}
                onError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.error('[Interior WebView Native Error]', nativeEvent);
                    setLoading(false);
                }}
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
