import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
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
    divider: {
        height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 16,
    },
});
