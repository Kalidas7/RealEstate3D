import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    modalCard: {
        width: '85%',
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    blurContainer: {
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    propertySubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)',
        marginBottom: 24,
    },
    closeBtn: {
        padding: 4,
    },
    section: {
        marginBottom: 24,
    },
    sectionLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 10,
        fontWeight: '500',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    dateInput: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
    },
    timeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 10,
    },
    timeSlot: {
        width: '30%',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    timeSlotSelected: {
        backgroundColor: 'rgba(102, 126, 234, 0.4)',
        borderColor: '#667eea',
    },
    timeText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        fontWeight: '600',
    },
    timeTextSelected: {
        color: '#fff',
    },
    confirmBtn: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        marginTop: 8,
    },
    confirmBtnDisabled: {
        opacity: 0.5,
    },
    confirmText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    iosPickerContainer: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        marginTop: 10,
        padding: 10,
        alignItems: 'center',
        width: '100%',
    },
    iosPickerDoneBtn: {
        alignSelf: 'flex-end',
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginTop: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
    },
    iosPickerDoneText: {
        color: '#fff',
        fontWeight: 'bold',
    }
});
