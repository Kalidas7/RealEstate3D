import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    header: {
        paddingTop: 70,
        paddingHorizontal: 24,
        paddingBottom: 10,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
    },
    scrollView: { flex: 1 },
    scrollContent: { paddingBottom: 120 },
    profileSection: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    avatarContainer: { marginBottom: 12 },
    avatar: {
        width: 90, height: 90, borderRadius: 45,
        borderWidth: 3, borderColor: '#fff',
    },
    avatarPlaceholder: {
        width: 90, height: 90, borderRadius: 45,
        backgroundColor: '#667eea',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 3, borderColor: '#fff',
    },
    avatarText: { fontSize: 36, color: '#fff', fontWeight: 'bold' },
    editAvatarBadge: {
        position: 'absolute', bottom: 0, right: 0,
        backgroundColor: '#4ade80', width: 28, height: 28,
        borderRadius: 14, justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: '#0a0a0a',
    },
    name: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
    editProfileBtn: {
        marginTop: 8, paddingHorizontal: 16, paddingVertical: 6,
        borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    },
    editProfileBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },

    // Tab bar
    tabBar: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginBottom: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 14,
        padding: 3,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 11,
        borderRadius: 11,
        gap: 6,
    },
    tabActive: {
        backgroundColor: 'rgba(102, 126, 234, 0.25)',
        borderWidth: 1,
        borderColor: 'rgba(102, 126, 234, 0.4)',
    },
    tabText: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.45)',
        fontWeight: '600',
    },
    tabTextActive: { color: '#fff' },

    // Info card
    infoCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        marginHorizontal: 20, borderRadius: 22,
        padding: 20, borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    infoRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 14, borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    },
    iconCircle: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: 'rgba(102, 126, 234, 0.12)',
        justifyContent: 'center', alignItems: 'center',
        marginRight: 14,
    },
    infoContent: { flex: 1 },
    infoLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 3 },
    infoValue: { fontSize: 15, color: '#fff', fontWeight: '600' },

    logoutButton: {
        marginHorizontal: 20, marginTop: 28,
        borderRadius: 12, overflow: 'hidden',
        borderWidth: 1, borderColor: '#ff4b4b',
        backgroundColor: '#1a0a0a',
    },
    logoutContainer: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', paddingVertical: 14, gap: 10,
    },
    logoutText: { color: '#ff4b4b', fontSize: 16, fontWeight: 'bold' },

    menuButton: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        marginHorizontal: 20, marginTop: 18,
        padding: 14, borderRadius: 18,
        borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    menuIconContainer: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: 'rgba(102, 126, 234, 0.15)',
        justifyContent: 'center', alignItems: 'center',
        marginRight: 14,
    },
    menuText: { flex: 1, fontSize: 15, color: '#fff', fontWeight: '600' },

    // Property grid
    gridContent: { paddingHorizontal: 16, paddingBottom: 120 },
    gridRow: { justifyContent: 'space-between', marginBottom: 12 },
    propertyCard: {
        width: '48%', height: 200, borderRadius: 18,
        overflow: 'hidden', backgroundColor: '#1a1a2e',
        elevation: 5, shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 8,
    },
    propertyImage: { width: '100%', height: '100%', position: 'absolute' },
    propertyGradient: {
        position: 'absolute', left: 0, right: 0, bottom: 0, height: '65%',
    },
    propertyInfo: {
        position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12,
    },
    propertyName: { fontSize: 14, fontWeight: 'bold', color: '#fff', marginBottom: 2 },
    propertyLocation: { fontSize: 10, color: 'rgba(255,255,255,0.8)', marginBottom: 6 },
    propertyFooter: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    propertyPrice: { fontSize: 12, fontWeight: 'bold', color: '#4ade80' },
    propertyStats: { flexDirection: 'row', gap: 6 },
    propertyStat: { fontSize: 10, color: 'rgba(255,255,255,0.7)' },
    sourceBadge: {
        position: 'absolute', top: 8, right: 8,
        width: 26, height: 26, borderRadius: 13,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center', alignItems: 'center',
    },

    // Empty state
    emptyState: {
        flex: 1, justifyContent: 'center', alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 18, fontWeight: 'bold', color: '#fff',
        marginTop: 16, marginBottom: 6,
    },
    emptySubtitle: {
        fontSize: 13, color: 'rgba(255,255,255,0.4)',
        textAlign: 'center', lineHeight: 20,
    },

    // Modal Styles
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center', alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%', backgroundColor: '#1a1a2e',
        borderRadius: 24, padding: 24,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 20, textAlign: 'center' },
    inputLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 6, marginLeft: 4 },
    modalInput: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12, padding: 14, color: '#fff',
        marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    },
    modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
    modalBtnCancel: {
        flex: 1, padding: 14, borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center',
    },
    modalBtnCancelText: { color: '#fff', fontWeight: 'bold' },
    modalBtnSave: {
        flex: 1, padding: 14, borderRadius: 12,
        backgroundColor: '#667eea', alignItems: 'center',
    },
    modalBtnSaveText: { color: '#fff', fontWeight: 'bold' },
});
