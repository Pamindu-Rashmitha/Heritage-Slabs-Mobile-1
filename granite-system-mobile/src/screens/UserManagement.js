import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Alert,
    TouchableOpacity,
    ActivityIndicator,
    StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../api/axiosConfig';

const UserManagementScreen = ({ navigation }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const response = await api.get('/auth/users');
            setUsers(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error fetching users:', error);
            Alert.alert('Error', 'Failed to retrieve user list.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const confirmDelete = (userId, userName) => {
        Alert.alert(
            'Delete User',
            `Are you sure you want to completely remove ${userName}? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => handleDeleteUser(userId) }
            ]
        );
    };

    const handleDeleteUser = async (userId) => {
        try {
            const response = await api.delete(`/auth/delete/${userId}`);
            if (response.status === 200) {
                Alert.alert('Success', 'User was deleted successfully.');
                fetchUsers(true);
            }
        } catch (error) {
            console.error('Delete User error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Could not delete the user.');
        }
    };

    const renderUser = ({ item }) => (
        <View style={styles.userCard}>
            <View style={styles.userInfo}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.name ? item.name.charAt(0).toUpperCase() : 'U'}</Text>
                </View>
                <View style={styles.textDetails}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <Text style={styles.userEmail}>{item.email}</Text>
                    <View style={styles.roleBadgeContainer}>
                         <View style={[styles.roleBadge, { backgroundColor: item.role === 'Admin' ? '#e8f5f4' : '#eaedfc' }]}>
                             <Text style={[styles.roleText, { color: item.role === 'Admin' ? '#2a9d8f' : '#4361ee' }]}>
                                 {item.role || 'Customer'}
                             </Text>
                         </View>
                    </View>
                </View>
            </View>
            <TouchableOpacity 
                style={styles.deleteBtn} 
                onPress={() => confirmDelete(item._id, item.name)}
                activeOpacity={0.7}
            >
                <MaterialCommunityIcons name="delete-outline" size={24} color="#e63946" />
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <StatusBar barStyle="light-content" backgroundColor="#1e2235" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={26} color="#ffffff" />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerEyebrow}>ADMINISTRATION</Text>
                    <Text style={styles.headerTitle}>User Management</Text>
                </View>
            </View>

            {loading && !refreshing ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#2a9d8f" />
                    <Text style={styles.loadingText}>Loading users...</Text>
                </View>
            ) : (
                <FlatList
                    data={users}
                    keyExtractor={(item) => item._id}
                    renderItem={renderUser}
                    refreshing={refreshing}
                    onRefresh={() => fetchUsers(true)}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={
                        <View style={styles.centered}>
                            <MaterialCommunityIcons name="account-search-outline" size={48} color="#9ca3af" />
                            <Text style={styles.emptyText}>No users found.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f4f4f4',
    },
    header: {
        backgroundColor: '#1e2235',
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 25,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    backBtn: {
        marginRight: 15,
        backgroundColor: 'rgba(255,255,255,0.15)',
        padding: 8,
        borderRadius: 12,
    },
    headerTextContainer: {
        flex: 1,
    },
    headerEyebrow: {
        fontSize: 11,
        fontWeight: '700',
        color: '#2a9d8f',
        letterSpacing: 1.5,
        marginBottom: 2,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    listContainer: {
        padding: 16,
        paddingBottom: 40,
    },
    userCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 3,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#f0f2f5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    avatarText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2a9d8f',
    },
    textDetails: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e2235',
        marginBottom: 2,
    },
    userEmail: {
        fontSize: 13,
        color: '#6b7280',
        marginBottom: 6,
    },
    roleBadgeContainer: {
        flexDirection: 'row',
    },
    roleBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    roleText: {
        fontSize: 11,
        fontWeight: '600',
    },
    deleteBtn: {
        padding: 10,
        backgroundColor: '#ffeeee',
        borderRadius: 10,
        marginLeft: 10,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#6b7280',
        fontSize: 14,
    },
    emptyText: {
        marginTop: 10,
        color: '#9ca3af',
        fontSize: 15,
    },
});

export default UserManagementScreen;
