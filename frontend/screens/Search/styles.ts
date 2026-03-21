import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 16,
        paddingBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    backButton: {
        padding: 4,
    },
    inputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 15,
        paddingHorizontal: 15,
        paddingVertical: Platform.OS === 'android' ? 10 : 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        gap: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#fff',
    },
    empty: {
        alignItems: 'center',
        marginTop: 80,
        gap: 12,
    },
    emptyText: {
        color: 'rgba(255,255,255,0.35)',
        fontSize: 15,
    },
});
