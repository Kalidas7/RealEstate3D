
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Linking, Alert, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Calendar from 'expo-calendar';
import BookingModal from '../../components/BookingModal';
import { styles } from './_styles';

const API_BASE = 'http://192.168.1.6:8000';

interface PropertyDetails {
    id: number;
    name: string;
    location: string;
    image: string;
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
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Reschedule state
    const [isRescheduleModalVisible, setRescheduleModalVisible] = useState(false);
    const [bookingToReschedule, setBookingToReschedule] = useState<Booking | null>(null);

    useFocusEffect(
        useCallback(() => {
            fetchBookings();
        }, [])
    );

    const fetchBookings = async () => {
        try {
            const userData = await AsyncStorage.getItem('user');
            if (!userData) {
                router.replace('/(auth)/login' as any);
                return;
            }
            const user = JSON.parse(userData);

            const response = await fetch(`${API_BASE}/api/bookings/?email=${user.email}`);
            if (response.ok) {
                const data = await response.json();
                setBookings(data);
            }
        } catch (error) {
            console.error('Failed to fetch bookings', error);
        } finally {
            setIsLoading(false);
        }
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
                Alert.alert("Success", "Booking rescheduled successfully.");
                fetchBookings(); // refresh list
            } else {
                const errorData = await response.json();
                Alert.alert(`Error: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Failed to reschedule', error);
            Alert.alert("Error", "Network error. Please try again.");
        }
    };

    const handleDirections = () => {
        const url = "https://www.google.com/maps/place/Graffiti+by+Sree+Dhanya+Homes/@8.5043221,76.9111129,975m/data=!3m2!1e3!4b1!4m6!3m5!1s0x3b05bd5bec064e77:0x96736b1bf5180cff!8m2!3d8.5043221!4d76.9111129!16s%2Fg%2F11k9b5l4mr!18m1!1e1?entry=ttu&g_ep=EgoyMDI2MDIyMi4wIKXMDSoASAFQAw%3D%3D";
        Linking.openURL(url);
    };

    const handleAddToCalendar = async (booking: Booking) => {
        const title = `${booking.property_details?.name || 'Property'} Visit`;
        const details = `Property viewing appointment for ${booking.property_details?.name || 'Property'}.`;

        // Parse date and time correctly
        const currentYear = new Date().getFullYear();
        let eventDate = new Date(`${booking.date} ${currentYear} ${booking.time}`);
        if (isNaN(eventDate.getTime())) {
            eventDate = new Date(); // fallback
        }

        // If the date is more than 1 month in the past, it's probably for next year.
        if (eventDate.getTime() < Date.now() - 30 * 24 * 60 * 60 * 1000) {
            eventDate = new Date(`${booking.date} ${currentYear + 1} ${booking.time}`);
        }

        const startDate = eventDate;
        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration

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
                        });
                        Alert.alert("Success", "Event added to your Apple Calendar!");
                        Linking.openURL(`calshow:${startDate.getTime() / 1000}`);
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
            // Android: Google Calendar URL template formatted to YYYYMMDDTHHMMSSZ
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
                    onPress={() => setActiveTab('upcoming')}
                >
                    {activeTab === 'upcoming' && (
                        <LinearGradient
                            colors={['#8A2BE2', '#4169E1']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 16 }}
                        />
                    )}
                    <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>Upcoming</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'completed' && styles.tabButtonActive]}
                    onPress={() => setActiveTab('completed')}
                >
                    {activeTab === 'completed' && (
                        <LinearGradient
                            colors={['#8A2BE2', '#4169E1']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 16 }}
                        />
                    )}
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
                                    onPress={handleDirections}
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
