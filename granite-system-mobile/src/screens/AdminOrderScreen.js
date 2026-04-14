import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../api/axiosConfig';

const COLORS = {
    dark: '#1e2235',
    teal: '#2a9d8f',
    bg: '#f0f2f5',
    white: '#ffffff',
    textPrimary: '#1e2235',
    textSub: '#6b7280',
    border: '#e5e7eb',
    warning: '#f4a261',
    success: '#2a9d8f',
    danger: '#e63946'
};

const AdminOrderScreen = ({ navigation }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await api.get('/orders');
            setOrders(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to fetch all orders');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Paid': return COLORS.success;
            case 'Pending': return COLORS.warning;
            case 'Failed': return COLORS.danger;
            default: return COLORS.textSub;
        }
    };

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.teal} /></View>;
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>All Customer Orders</Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                data={orders}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <View style={styles.orderCard}>
                        <View style={styles.row}>
                            <Text style={styles.customerName}>{item.user?.name || 'Unknown User'}</Text>
                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                            </View>
                        </View>
                        <Text style={styles.customerEmail}>{item.user?.email}</Text>
                        
                        <View style={styles.divider} />
                        
                        {(Array.isArray(item.items) ? item.items : []).map((orderItem, idx) => (
                            <Text key={idx} style={styles.itemLine}>
                                • {orderItem?.quantity || 0} x {orderItem?.product?.stoneName || 'Product'}
                            </Text>
                        ))}
                        
                        <View style={styles.footerRow}>
                            <Text style={styles.totalText}>
                                Amount:{' '}
                                <Text style={styles.bold}>
                                    LKR {(Number(item.totalAmount) || 0).toLocaleString()}
                                </Text>
                            </Text>
                            <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                        </View>
                    </View>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>No orders found.</Text>}
                onRefresh={fetchOrders}
                refreshing={loading}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    header: { backgroundColor: COLORS.dark, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: '800' },
    listContent: { padding: 16 },
    orderCard: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 16 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    customerName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
    customerEmail: { fontSize: 13, color: COLORS.textSub },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    statusText: { fontSize: 11, fontWeight: '700' },
    divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
    itemLine: { fontSize: 14, color: COLORS.textPrimary, marginBottom: 4 },
    footerRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, alignItems: 'center' },
    totalText: { fontSize: 14, color: COLORS.textSub },
    bold: { fontWeight: '800', color: COLORS.dark },
    dateText: { fontSize: 12, color: COLORS.textSub },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { textAlign: 'center', marginTop: 50, color: COLORS.textSub }
});

export default AdminOrderScreen;
