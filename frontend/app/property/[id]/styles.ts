import { StyleSheet, Dimensions } from 'react-native';

const { height } = Dimensions.get('window');

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    headerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingHorizontal: 16,
        paddingBottom: 10,
    },
    backBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 0.5,
        borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    backIcon: {
        fontSize: 20,
        color: '#fff',
    },
    headerTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        textAlign: 'center',
        marginHorizontal: 10,
    },
    viewerSection: {
        height: height * 0.55,
    },
    detailsSection: {
        flex: 1,
    },

    // ─── Details Content ────────────────────────────────────
    detailsContent: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 40,
    },
    detailsCard: {
        borderRadius: 22,
        padding: 16,
        borderWidth: 0.5,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },

    // ─── Tab Bar (inside card) ──────────────────────────────
    tabBar: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 14,
        padding: 3,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    detailTab: {
        flex: 1,
        paddingVertical: 11,
        alignItems: 'center',
        borderRadius: 11,
    },
    detailTabActive: {
        backgroundColor: 'rgba(102, 126, 234, 0.25)',
        borderWidth: 1,
        borderColor: 'rgba(102, 126, 234, 0.4)',
    },
    detailTabText: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.45)',
        fontWeight: '600',
    },
    detailTabTextActive: {
        color: '#fff',
    },

    // ─── Overview ───────────────────────────────────────────
    priceRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    price: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#4CAF50',
        marginBottom: 3,
    },
    location: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.65)',
    },
    detailLikeBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        marginLeft: 12,
        marginTop: 2,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        marginBottom: 14,
    },
    stat: {
        alignItems: 'center',
    },
    statVal: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#fff',
    },
    statLabel: {
        fontSize: 10,
        color: 'rgba(255, 255, 255, 0.45)',
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 10,
    },
    description: {
        fontSize: 13,
        lineHeight: 20,
        color: 'rgba(255, 255, 255, 0.65)',
        marginBottom: 14,
    },
    bookBtn: {
        borderRadius: 14,
        overflow: 'hidden',
        marginTop: 2,
    },
    bookGradient: {
        paddingVertical: 14,
        alignItems: 'center',
        backgroundColor: '#667eea',
    },
    bookText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
    },

    // ─── Amenities Grid ─────────────────────────────────────
    amenitiesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    amenityCard: {
        width: '47%',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 14,
        paddingVertical: 16,
        paddingHorizontal: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
        gap: 8,
    },
    amenityLabel: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.75)',
        fontWeight: '600',
        textAlign: 'center',
    },

    // ─── Trends Cards ───────────────────────────────────────
    trendCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    trendHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    trendTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    trendTitle: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.65)',
        fontWeight: '600',
    },
    trendBadge: {
        backgroundColor: 'rgba(74, 222, 128, 0.15)',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(74, 222, 128, 0.25)',
    },
    trendBadgeText: {
        fontSize: 11,
        color: '#4ade80',
        fontWeight: 'bold',
    },
    trendValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 3,
    },
    trendDesc: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.45)',
        lineHeight: 16,
    },

    // ─── Other ──────────────────────────────────────────────
    exitFullscreen: {
        position: 'absolute',
        top: 55,
        right: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 0.5,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    exitIcon: {
        fontSize: 22,
        color: '#fff',
    },
    errorText: {
        color: '#fff',
        fontSize: 18,
        textAlign: 'center',
        marginTop: 100,
    },
    backToExteriorBtn: {
        position: 'absolute',
        top: 20,
        left: 20,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    backToExteriorText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: 'bold',
    },
});
