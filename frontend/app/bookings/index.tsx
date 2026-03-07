
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Linking, Alert, Platform, Animated, LayoutAnimation, UIManager } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Calendar from 'expo-calendar';
import BookingModal from '../../components/BookingModal';
import { useAsyncBackendSync } from '@/hooks/useAsyncBackendSync';
import { styles } from './_styles';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const API_BASE = 'https://realestate3d.onrender.com';

interface PropertyDetails {
    id: number;
    name: string;
    location: string;
    image: string;
    location_link?: string;
}

interface Booking {
    id: number;
    property_details: PropertyDetails;
    date: string;
    time: string;
    status: 'upcoming' | 'completed' | 'cancelled';
}

export default function BookingsScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');

    // Reschedule state
    const [isRescheduleModalVisible, setRescheduleModalVisible] = useState(false);
    const [bookingToReschedule, setBookingToReschedule] = useState<Booking | null>(null);

    // Use the generic hook — loads from cache first, then syncs from backend
    const { data: bookings, isLoading, refresh, setData: setBookings } = useAsyncBackendSync<Booking[]>({
        cacheKey: 'cached_bookings',
        defaultValue: [],
        fetchFromBackend: async () => {
            const userData = await AsyncStorage.getItem('user');
            if (!userData) return null;
            const user = JSON.parse(userData);
            const response = await fetch(`${API_BASE}/api/bookings/?email=${user.email}`);
            if (response.ok) return await response.json();
            return null;
        },
    });

    // Re-sync when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            refresh();
        }, [refresh])
    );

    const handleTabChange = (tab: 'upcoming' | 'completed') => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setActiveTab(tab);
    };

    const handleRescheduleConfirm = async (date: string, time: string) => {
        if (!bookingToReschedule) return;

        try {
            const userData = await AsyncStorage.getItem('user');
            if (!userData) return;
            const user = JSON.parse(userData);

            const response = await fetch(`${API_BASE}/api/bookings/${bookingToReschedule.id}/reschedule/`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email, date, time })
            });

            if (response.ok) {
                // Optimistic update — update local cache
                const updatedBookings = bookings.map(b =>
                    b.id === bookingToReschedule.id ? { ...b, date, time } : b
                );
                setBookings(updatedBookings);
                await AsyncStorage.setItem('cached_bookings', JSON.stringify(updatedBookings));
                Alert.alert("Success", "Booking rescheduled successfully.");
                refresh(); // Sync fresh data from backend
            } else {
                const errorData = await response.json();
                Alert.alert(`Error: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Failed to reschedule', error);
            Alert.alert("Error", "Network error. Please try again.");
        }
    };

    const handleDirections = (link?: string) => {
        if (link) {
            Linking.openURL(link);
        } else {
            Alert.alert("Location Unavailable", "No directions link has been provided for this property yet.");
        }
    };

    const parseBookingDateTime = (dateStr: string, timeStr: string) => {
        const months: { [key: string]: number } = {
            'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
            'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
        };
        const parts = dateStr.trim().split(' ');
        let dayStr = parts[0];
        let monthStr = parts.length > 1 ? parts[1] : '';

        // Handle both "DD MMM" and "MMM DD" formats
        if (isNaN(parseInt(dayStr, 10)) && parts.length > 1) {
            // It's likely "MMM DD" (e.g., iOS returns "Aug 15")
            monthStr = parts[0];
            dayStr = parts[1];
        }

        const day = parseInt(dayStr || '1', 10);
        const month = months[monthStr] !== undefined ? months[monthStr] : new Date().getMonth();

        const timeParts = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
        let hours = 9;
        let mins = 0;
        if (timeParts) {
            hours = parseInt(timeParts[1], 10);
            mins = parseInt(timeParts[2], 10);
            const ampm = timeParts[3].toUpperCase();
            if (ampm === 'PM' && hours < 12) hours += 12;
            if (ampm === 'AM' && hours === 12) hours = 0;
        }

        const now = new Date();
        const year = now.getFullYear();
        let eventDate = new Date(year, month, day, hours, mins, 0);

        // If the date looks like it's from more than 11 months ago (e.g. it's Jan now and we booked for Dec)
        // push it to LAST year. If it's Jan now and we book for Dec, it's THIS year. 
        // Wait, property bookings are future-facing.
        // If the month is significantly smaller than the current month (e.g. booked for Jan, now is Dec),
        // push the event to NEXT year.
        if (month < now.getMonth() - 6) {
            eventDate = new Date(year + 1, month, day, hours, mins, 0);
        } else if (month > now.getMonth() + 6) {
            // In case someone books for a date 6+ months ago (unlikely, but defensive)
            eventDate = new Date(year - 1, month, day, hours, mins, 0);
        }

        return eventDate;
    };

    const handleAddToCalendar = async (booking: Booking) => {
        const title = `${booking.property_details?.name || 'Property'} Visit`;
        const link = booking.property_details?.location_link ? `\n\nDirections: ${booking.property_details.location_link}` : '';
        const details = `Property viewing appointment for ${booking.property_details?.name || 'Property'}.${link}`;

        const startDate = parseBookingDateTime(booking.date, booking.time);
        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

        if (Platform.OS === 'ios') {
            const { status } = await Calendar.requestCalendarPermissionsAsync();
            if (status === 'granted') {
                const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
                const writableCalendars = calendars.filter(c => c.allowsModifications);
                let targetCalendar = writableCalendars.find(c => c.isPrimary);
                if (!targetCalendar && writableCalendars.length > 0) {
                    targetCalendar = writableCalendars[0];
                }

                if (targetCalendar) {
                    try {
                        await Calendar.createEventAsync(targetCalendar.id, {
                            title,
                            startDate,
                            endDate,
                            notes: details,
                            alarms: [{ relativeOffset: -60, method: Calendar.AlarmMethod.ALERT }]
                        });
                        Alert.alert("Success", "Event added to your Apple Calendar!");
                        const appleEpochOffset = 978307200; // Seconds between Jan 1 1970 and Jan 1 2001
                        Linking.openURL(`calshow:${(startDate.getTime() / 1000) - appleEpochOffset}`);
                    } catch (e) {
                        console.error("Calendar Add Error:", e);
                        Alert.alert("Error", "Could not create event in Apple Calendar.");
                    }
                } else {
                    Alert.alert("Error", "No available calendar found on this device.");
                }
            } else {
                Alert.alert("Permission required", "Calendar access is needed to add events.");
            }
        } else {
            const formatGoogleDate = (d: Date) => d.toISOString().replace(/-|:|\.\d{3}/g, '');
            const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}&details=${encodeURIComponent(details)}`;

            Linking.openURL(url).catch(() => {
                Alert.alert("Error", "Unable to open Google Calendar");
            });
        }
    };

    const filteredBookings = bookings.filter(b => b.status === activeTab);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Bookings</Text>
                <Text style={styles.headerSubtitle}>Manage your property visits</Text>
            </View>

            {/* Toggle Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'upcoming' && styles.tabButtonActive]}
                    onPress={() => handleTabChange('upcoming')}
                >
                    <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>Upcoming</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'completed' && styles.tabButtonActive]}
                    onPress={() => handleTabChange('completed')}
                >
                    <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>Completed</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {isLoading ? (
                    <ActivityIndicator size="large" color="#4169E1" style={{ marginTop: 50 }} />
                ) : filteredBookings.length > 0 ? (
                    filteredBookings.map((booking) => (
                        <View key={booking.id} style={styles.bookingCard}>
                            <Text style={styles.propertyTitle}>{booking.property_details.name}</Text>

                            <View style={styles.statusBadge}>
                                <Text style={styles.statusText}>{booking.status}</Text>
                            </View>

                            <View style={styles.infoRow}>
                                <Ionicons name="calendar-outline" size={16} color="rgba(255,255,255,0.6)" />
                                <Text style={styles.infoText}>{booking.date}</Text>
                            </View>

                            <View style={styles.infoRow}>
                                <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.6)" />
                                <Text style={styles.infoText}>{booking.time}</Text>
                            </View>

                            <View style={styles.infoRow}>
                                <Ionicons name="person-outline" size={16} color="rgba(255,255,255,0.6)" />
                                <Text style={styles.infoText}>Agent: Default Agent</Text>
                            </View>

                            {/* Action Buttons */}
                            <View style={styles.actionRow}>
                                <TouchableOpacity
                                    style={styles.actionBtnReschedule}
                                    onPress={() => {
                                        setBookingToReschedule(booking);
                                        setRescheduleModalVisible(true);
                                    }}
                                >
                                    <Text style={styles.actionBtnRescheduleText}>Reschedule</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.actionBtnDirections}
                                    onPress={() => handleDirections(booking.property_details.location_link)}
                                >
                                    <Text style={styles.actionBtnDirectionsText}>Directions</Text>
                                    <Ionicons name="navigate" size={16} color="#4CAF50" style={{ marginLeft: 4 }} />
                                </TouchableOpacity>
                            </View>

                            {/* Add to Calendar Button */}
                            <TouchableOpacity
                                style={styles.actionBtnCalendar}
                                onPress={() => handleAddToCalendar(booking)}
                            >
                                <Text style={styles.actionBtnCalendarText}>Add to Calendar</Text>
                                <Ionicons name="calendar" size={16} color="#FFA500" style={{ marginLeft: 6 }} />
                            </TouchableOpacity>
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <Ionicons name="calendar-outline" size={80} color="#fff" style={styles.emptyIcon} />
                        <Text style={styles.emptyText}>No Bookings Yet</Text>
                        <Text style={styles.emptySubtext}>
                            When you book a property, it will show up here.
                        </Text>
                    </View>
                )}
            </ScrollView>

            <BookingModal
                visible={isRescheduleModalVisible}
                onClose={() => setRescheduleModalVisible(false)}
                propertyName={bookingToReschedule?.property_details?.name || 'Property'}
                onConfirm={handleRescheduleConfirm}
            />
        </View>
    );
}
