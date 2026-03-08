import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    sectionHeader: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        paddingHorizontal: 20,
        marginTop: 10,
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    sectionSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.5)',
        marginTop: 4,
    },
});
