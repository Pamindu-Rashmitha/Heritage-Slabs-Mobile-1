import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/axiosConfig';

const COLORS = {
    dark: '#1e2235',
    teal: '#2a9d8f',
    tealLight: '#e8f5f4',
    bg: '#f0f2f5',
    white: '#ffffff',
    textPrimary: '#1e2235',
    textSub: '#6b7280',
    border: '#e5e7eb',
    danger: '#e63946',
    warning: '#f4a261',
    success: '#2a9d8f'
};

const OrderHistoryScreen = ({ navigation }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await api.get('/orders/myorders');
            setOrders(response.data);
        } catch (error) {
            console.error('Error fetching orders:', error);
            Alert.alert('Error', 'Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const handlePayNow = (orderId, totalAmount) => {
        navigation.navigate('SimulatedPayment', { orderId, amount: totalAmount });
    };

    const handleDeleteOrder = async (orderId) => {
        Alert.alert(
            'Delete Order',
            'Are you sure you want to delete this pending order?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/orders/${orderId}`);
                            fetchOrders();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete order');
                        }
                    }
                }
            ]
        );
    };

    const handleDownloadInvoice = async (orderId) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                Alert.alert('Error', 'Please login again to download invoice.');
                return;
            }
            const url = `${api.defaults.baseURL}/orders/${orderId}/invoice?token=${encodeURIComponent(token)}`;
            await Linking.openURL(url);
        } catch (err) {
            Alert.alert('Error', 'Could not open invoice link');
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
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={COLORS.teal} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Order History</Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                data={orders}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <View style={styles.orderCard}>
                        <View style={styles.orderTop}>
                            <Text style={styles.orderId}>Order #{item._id.slice(-6).toUpperCase()}</Text>
                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                            </View>
                        </View>

                        <Text style={styles.orderDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                        
                        <View style={styles.divider} />
                        
                        {item.items.map((orderItem, idx) => (
                            <Text key={idx} style={styles.itemSummary}>
                                {orderItem.quantity} x {orderItem.product?.stoneName || 'Product'}
                            </Text>
                        ))}

                        <View style={styles.orderBottom}>
                            <Text style={styles.totalLabel}>Total: <Text style={styles.totalValue}>LKR {item.totalAmount.toLocaleString()}</Text></Text>
                            
                            <View style={styles.actions}>
                                {item.status === 'Pending' && (
                                    <>
                                        <TouchableOpacity style={styles.payBtn} onPress={() => handlePayNow(item._id, item.totalAmount)}>
                                            <Text style={styles.payBtnText}>Pay Now</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteOrder(item._id)}>
                                            <MaterialCommunityIcons name="delete" size={20} color={COLORS.danger} />
                                        </TouchableOpacity>
                                    </>
                                )}
                                {item.status === 'Paid' && (
                                    <TouchableOpacity style={styles.invoiceBtn} onPress={() => handleDownloadInvoice(item._id)}>
                                        <MaterialCommunityIcons name="file-pdf-box" size={20} color={COLORS.teal} />
                                        <Text style={styles.invoiceBtnText}>Invoice</Text>
                                    </TouchableOpacity>
                                )}
                                {['Paid', 'Shipped', 'Delivered'].includes(item.status) && (
                                    item.items.map((orderItem, idx) =>
                                        orderItem.product ? (
                                            <TouchableOpacity
                                                key={idx}
                                                style={styles.reviewBtn}
                                                onPress={() => navigation.navigate('WriteReview', {
                                                    productId: orderItem.product._id,
                                                    productName: orderItem.product.stoneName,
                                                })}
                                            >
                                                <MaterialCommunityIcons name="star-outline" size={16} color={COLORS.teal} />
                                                <Text style={styles.reviewBtnText}>Review</Text>
                                            </TouchableOpacity>
                                        ) : null
                                    )
                                )}
                            </View>
                        </View>
                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="history" size={64} color={COLORS.border} />
                        <Text style={styles.emptyText}>You haven't placed any orders yet</Text>
                    </View>
                }
                refreshing={loading}
                onRefresh={fetchOrders}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    header: { 
        backgroundColor: COLORS.dark, 
        padding: 20, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between' 
    },
    headerTitle: { color: COLORS.white, fontSize: 20, fontWeight: '800' },
    listContent: { padding: 16 },
    orderCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3
    },
    orderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    orderId: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    statusText: { fontSize: 12, fontWeight: '700' },
    orderDate: { fontSize: 12, color: COLORS.textSub, marginTop: 4 },
    divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
    itemSummary: { fontSize: 14, color: COLORS.textPrimary, marginBottom: 4 },
    orderBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
    totalLabel: { fontSize: 14, color: COLORS.textSub },
    totalValue: { fontSize: 16, fontWeight: '800', color: COLORS.dark },
    actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    payBtn: { backgroundColor: COLORS.teal, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
    payBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
    deleteBtn: { padding: 8 },
    invoiceBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 8, borderWidth: 1, borderColor: COLORS.teal, borderRadius: 8 },
    invoiceBtnText: { color: COLORS.teal, fontWeight: '700', fontSize: 13 },
    reviewBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.teal, borderRadius: 8, backgroundColor: '#e8f5f4' },
    reviewBtnText: { color: COLORS.teal, fontWeight: '700', fontSize: 13 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    emptyText: { marginTop: 12, color: COLORS.textSub, fontSize: 16 }
});

export default OrderHistoryScreen;
