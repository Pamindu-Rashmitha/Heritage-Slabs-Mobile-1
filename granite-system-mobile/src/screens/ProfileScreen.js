import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../api/axiosConfig';

const ProfileScreen = ({ navigation }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const storedId = await AsyncStorage.getItem('userId');
            if (!storedId) {
                Alert.alert('Error', 'User ID not found. Please log in again.');
                navigation.replace('Login');
                return;
            }
            setUserId(storedId);

            const response = await api.get(`/auth/user/${storedId}`);
            if (response.data) {
                setName(response.data.name || '');
                setEmail(response.data.email || '');
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            Alert.alert('Error', 'Could not load profile data.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async () => {
        if (!name || !email) {
            Alert.alert('Validation Error', 'Name and email cannot be empty');
            return;
        }

        setSaving(true);
        try {
            const payload = { name, email };
            if (password) {
                payload.password = password;
            }

            const response = await api.patch(`/auth/update/${userId}`, payload);
            if (response.status === 200) {
                Alert.alert('Success', 'Profile updated successfully!', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            }
        } catch (error) {
            console.error('Update error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'Are you sure you want to permanently delete your account? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Delete', 
                    style: 'destructive', 
                    onPress: async () => {
                        try {
                            setSaving(true);
                            await api.delete(`/auth/delete/${userId}`);
                            await AsyncStorage.removeItem('userToken');
                            await AsyncStorage.removeItem('userRole');
                            await AsyncStorage.removeItem('userId');
                            Alert.alert('Account Deleted', 'Your account has been deleted successfully.');
                            navigation.replace('Login');
                        } catch (error) {
                            console.error('Delete error:', error);
                            Alert.alert('Error', error.response?.data?.message || 'Failed to delete account.');
                            setSaving(false);
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2a9d8f" />
                <Text style={styles.loadingText}>Loading Profile...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#1e2235" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Profile</Text>
                <View style={{ width: 24 }} />
            </View>

            <KeyboardAvoidingView 
                style={{ flex: 1 }} 
                behavior={Platform.OS === 'ios' ? 'padding' : null}
            >
                <ScrollView contentContainerStyle={styles.formContainer} showsVerticalScrollIndicator={false}>
                    
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarText}>
                                {name ? name.charAt(0).toUpperCase() : 'U'}
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.label}>Full Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Your Name"
                        value={name}
                        onChangeText={setName}
                    />

                    <Text style={styles.label}>Email Address</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Email Address"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <Text style={styles.label}>New Password (Optional)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Leave blank to keep current password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <TouchableOpacity 
                        style={styles.updateButton} 
                        onPress={handleUpdateProfile}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.updateButtonText}>Save Changes</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.deleteButton} 
                        onPress={handleDeleteAccount}
                        disabled={saving}
                    >
                        <Text style={styles.deleteButtonText}>Delete My Account</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f2f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f2f5',
    },
    loadingText: {
        marginTop: 10,
        color: '#6b7280',
        fontSize: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e2235',
    },
    backButton: {
        padding: 5,
    },
    formContainer: {
        padding: 20,
        paddingBottom: 40,
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 10,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#2a9d8f',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 5,
    },
    avatarText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#fff',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
        marginBottom: 5,
        marginLeft: 5,
    },
    input: {
        backgroundColor: '#fff',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginBottom: 20,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        color: '#1e2235',
    },
    updateButton: {
        backgroundColor: '#2a9d8f',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#2a9d8f',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 5,
    },
    updateButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    deleteButton: {
        backgroundColor: '#fff',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
        borderWidth: 1.5,
        borderColor: '#e63946',
    },
    deleteButtonText: {
        color: '#e63946',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ProfileScreen;
