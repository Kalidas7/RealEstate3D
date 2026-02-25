
import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#0a0a0a',
        zIndex: 10,
    },
    backButton: {
        display: 'none', // Removed for main tab display, matching Figma
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.6)',
        marginTop: 4,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    placeholder: {
        display: 'none',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        marginHorizontal: 20,
        borderRadius: 20,
        padding: 4,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    tabButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 16,
        overflow: 'hidden',
    },
    tabButtonActive: {
        // Gradient applied inline in component
    },
    tabText: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontWeight: '600',
        zIndex: 2,
    },
    tabTextActive: {
        color: '#fff',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 120,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
        opacity: 0.8,
    },
    emptyText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    emptySubtext: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 14,
        textAlign: 'center',
        maxWidth: 250,
    },
    bookingCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
    },
    propertyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: 'rgba(65, 105, 225, 0.2)',
        borderWidth: 1,
        borderColor: 'rgba(65, 105, 225, 0.4)',
        marginBottom: 16,
    },
    statusText: {
        fontSize: 12,
        color: '#4169E1',
        fontWeight: '600',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    infoText: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 14,
        marginLeft: 10,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
        gap: 12,
    },
    actionBtnReschedule: {
        flex: 1,
        backgroundColor: 'rgba(65, 105, 225, 0.15)',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(65, 105, 225, 0.3)',
    },
    actionBtnRescheduleText: {
        color: '#4169E1',
        fontWeight: '600',
    },
    actionBtnDirections: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: 'rgba(76, 175, 80, 0.15)',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(76, 175, 80, 0.3)',
    },
    actionBtnDirectionsText: {
        color: '#4CAF50',
        fontWeight: '600',
    },
    actionBtnCalendar: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 165, 0, 0.15)',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 165, 0, 0.3)',
        marginTop: 12,
    },
    actionBtnCalendarText: {
        color: '#FFA500',
        fontWeight: '600',
    }
});
