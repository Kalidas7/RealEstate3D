import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    ActivityIndicator,
    Alert,
    Platform
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { styles } from './styles';

interface BookingModalProps {
    visible: boolean;
    onClose: () => void;
    propertyName: string;
    onConfirm: (date: string, time: string) => Promise<void>;
}

export default function BookingModal({ visible, onClose, propertyName, onConfirm }: BookingModalProps) {
    const [date, setDate] = useState<Date | null>(null);
    const [showPicker, setShowPicker] = useState(false);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Helper to format date as "05 Oct" without year
    const formatDate = (d: Date | null) => {
        if (!d) return '';
        const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
        return d.toLocaleDateString('en-US', options);
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowPicker(false);
        }
        if (selectedDate) {
            setDate(selectedDate);
        }
    };

    const timeSlots = [
        '09:00 AM', '10:00 AM', '11:00 AM',
        '12:00 PM', '01:00 PM', '02:00 PM',
        '03:00 PM', '04:00 PM', '05:00 PM'
    ];

    const handleConfirm = async () => {
        if (!date) {
            Alert.alert('Missing Date', 'Please select a date for your visit.');
            return;
        }
        if (!selectedTime) {
            Alert.alert('Missing Time', 'Please select a time slot.');
            return;
        }

        setIsLoading(true);
        try {
            await onConfirm(formatDate(date), selectedTime);
            // Reset state on success
            setDate(null);
            setSelectedTime(null);
            onClose();
        } catch (error) {
            console.error('Booking confirmation failed', error);
            Alert.alert('Error', 'Failed to submit booking. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                {/* Background dark blur */}
                <BlurView
                    intensity={40}
                    tint="dark"
                    style={StyleSheet.absoluteFill}
                />

                {/* The Modal Card */}
                <LinearGradient
                    colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.02)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.modalCard}
                >
                    <BlurView intensity={20} tint="light" style={styles.blurContainer}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.title}>Book Site Visit</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color="rgba(255,255,255,0.7)" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.propertySubtitle}>for {propertyName}</Text>

                        {/* Date Input */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>Select Date</Text>
                            <TouchableOpacity
                                style={styles.inputWrapper}
                                onPress={() => setShowPicker(true)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.dateInput, !date && { color: 'rgba(255,255,255,0.4)' }]}>
                                    {date ? formatDate(date) : "Select a date (e.g., Aug 15)"}
                                </Text>
                                <Ionicons name="calendar-outline" size={20} color="rgba(255,255,255,0.6)" />
                            </TouchableOpacity>

                            {showPicker && (
                                <View style={Platform.OS === 'ios' ? styles.iosPickerContainer : undefined}>
                                    <DateTimePicker
                                        value={date || new Date()}
                                        mode="date"
                                        display={Platform.OS === 'ios' ? 'inline' : 'default'}
                                        onChange={handleDateChange}
                                        minimumDate={new Date()}
                                        textColor="#ffffff"
                                        themeVariant="dark" /* Forces dark theme on iOS calendar */
                                    />
                                </View>
                            )}
                            {/* Close button for iOS inline picker */}
                            {showPicker && Platform.OS === 'ios' && (
                                <TouchableOpacity
                                    style={styles.iosPickerDoneBtn}
                                    onPress={() => setShowPicker(false)}
                                >
                                    <Text style={styles.iosPickerDoneText}>Done</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Time Slots */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>Select Time</Text>
                            <View style={styles.timeGrid}>
                                {timeSlots.map((time) => (
                                    <TouchableOpacity
                                        key={time}
                                        style={[
                                            styles.timeSlot,
                                            selectedTime === time && styles.timeSlotSelected
                                        ]}
                                        onPress={() => setSelectedTime(time)}
                                    >
                                        <Text
                                            style={[
                                                styles.timeText,
                                                selectedTime === time && styles.timeTextSelected
                                            ]}
                                        >
                                            {time}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Confirm Button */}
                        <TouchableOpacity
                            style={[
                                styles.confirmBtn,
                                (!date || !selectedTime || isLoading) && styles.confirmBtnDisabled
                            ]}
                            onPress={handleConfirm}
                            disabled={!date || !selectedTime || isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.confirmText}>Confirm Booking</Text>
                            )}
                        </TouchableOpacity>
                    </BlurView>
                </LinearGradient>
            </View>
        </Modal>
    );
}


