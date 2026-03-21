import { StyleSheet } from 'react-native';

// App colour tokens — shared with BookingModal palette
export const BLUE = '#667eea';
export const BLUE_DIM = 'rgba(102,126,234,0.15)';
export const BLUE_BORDER = 'rgba(102,126,234,0.5)';
export const DARK_BG = '#0a0a14';
export const CARD_BG = '#111128';
export const SURFACE = 'rgba(255,255,255,0.05)';
export const SURFACE_BORDER = 'rgba(255,255,255,0.1)';

export const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.82)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    card: {
        width: '100%',
        backgroundColor: '#0d0d1a',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginBottom: 20,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold' as const,
        color: '#fff',
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.4)',
    },
    divider: {
        height: 1,
        backgroundColor: SURFACE_BORDER,
        marginBottom: 20,
    },
    // Primary action button — ghost style with subtle blue background
    primaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: BLUE_DIM,
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: BLUE,
    },
    primaryBtnText: {
        color: BLUE,
        fontSize: 16,
        fontWeight: 'bold' as const,
    },
    disabled: {
        opacity: 0.5,
    },
    separatorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 18,
        gap: 10,
    },
    separatorLine: {
        flex: 1,
        height: 1,
        backgroundColor: SURFACE_BORDER,
    },
    separatorText: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 12,
    },
    // Secondary button — ghost style matching primary
    secondaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'transparent',
        paddingVertical: 16,
        paddingHorizontal: 18,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: BLUE,
    },
    secondaryBtnText: {
        color: BLUE,
        fontSize: 15,
        fontWeight: '600' as const,
    },
    cityList: {
        marginTop: 8,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    cityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 18,
    },
    cityItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: SURFACE_BORDER,
    },
    cityText: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 14,
        fontWeight: '500' as const,
    },
    skipBtn: {
        marginTop: 20,
        alignItems: 'center',
        paddingVertical: 8,
    },
    skipText: {
        color: 'rgba(255,255,255,0.35)',
        fontSize: 13,
        textDecorationLine: 'underline',
    },
});
