import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuthHeaders, API_BASE } from '@/utils/api';
import { styles } from './styles';

interface User {
    id: number;
    username: string;
    email: string;
    profile?: {
        contact_number?: string;
        profile_pic?: string;
    };
}

interface EditProfileModalProps {
    visible: boolean;
    user: User;
    onClose: () => void;
    onUserUpdated: (updatedUser: User) => void;
}

export default function EditProfileModal({
    visible,
    user,
    onClose,
    onUserUpdated,
}: EditProfileModalProps) {
    const [editUsername, setEditUsername] = useState('');
    const [editContact, setEditContact] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (visible) {
            setEditUsername(user.username || '');
            setEditContact(user.profile?.contact_number || '');
            setCurrentPassword('');
            setNewPassword('');
        }
    }, [visible, user]);

    const handleUpdateProfile = async () => {
        setIsUpdating(true);

        const formData = new FormData();

        if (editUsername) formData.append('username', editUsername);
        if (editContact) formData.append('contact_number', editContact);

        try {
            const authHeaders = await getAuthHeaders();
            const response = await fetch(`${API_BASE}/api/profile/update/`, {
                method: 'PUT',
                headers: { ...authHeaders },
                body: formData,
            });

            const data = await response.json();
            if (response.ok) {
                console.log('[Profile] Update response user pic:', data.user?.profile?.profile_pic);
                onUserUpdated(data.user);
                onClose();
                Alert.alert('Success', 'Profile updated successfully.');
            } else {
                Alert.alert('Update Failed', data.error || 'Something went wrong.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to connect to the server.');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword) {
            Alert.alert('Error', 'Please fill in both password fields');
            return;
        }
        if (newPassword.length < 6) {
            Alert.alert('Error', 'New password must be at least 6 characters');
            return;
        }
        setIsUpdating(true);
        try {
            const authHeaders = await getAuthHeaders();
            const response = await fetch(`${API_BASE}/api/change-password/`, {
                method: 'PUT',
                headers: { ...authHeaders, 'Content-Type': 'application/json' },
                body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
            });
            const data = await response.json();
            if (response.ok) {
                if (data.access && data.refresh) {
                    await AsyncStorage.setItem('access_token', data.access);
                    await AsyncStorage.setItem('refresh_token', data.refresh);
                }
                Alert.alert('Success', 'Password changed successfully.');
                setCurrentPassword('');
                setNewPassword('');
            } else {
                Alert.alert('Error', data.error || 'Failed to change password');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to connect to the server.');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Edit Profile</Text>

                    <Text style={styles.inputLabel}>Username</Text>
                    <TextInput
                        style={styles.modalInput}
                        value={editUsername}
                        onChangeText={setEditUsername}
                        placeholder="Enter username"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                    />

                    <Text style={styles.inputLabel}>Contact Number</Text>
                    <TextInput
                        style={styles.modalInput}
                        value={editContact}
                        onChangeText={setEditContact}
                        placeholder="Enter contact number"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        keyboardType="phone-pad"
                    />

                    <View style={styles.divider} />

                    <Text style={styles.inputLabel}>Current Password</Text>
                    <TextInput
                        style={styles.modalInput}
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        placeholder="Enter current password"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        secureTextEntry
                    />

                    <Text style={styles.inputLabel}>New Password</Text>
                    <TextInput
                        style={styles.modalInput}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        placeholder="Enter new password"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        secureTextEntry
                    />

                    {(currentPassword || newPassword) ? (
                        <TouchableOpacity
                            style={[styles.modalBtnSave, { marginBottom: 12 }]}
                            onPress={handleChangePassword}
                            disabled={isUpdating}
                        >
                            {isUpdating ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.modalBtnSaveText}>Change Password</Text>
                            )}
                        </TouchableOpacity>
                    ) : null}

                    <View style={styles.modalActions}>
                        <TouchableOpacity
                            style={styles.modalBtnCancel}
                            onPress={onClose}
                            disabled={isUpdating}
                        >
                            <Text style={styles.modalBtnCancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.modalBtnSave}
                            onPress={handleUpdateProfile}
                            disabled={isUpdating}
                        >
                            {isUpdating ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.modalBtnSaveText}>Save</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
