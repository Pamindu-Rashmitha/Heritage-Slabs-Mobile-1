import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/axiosConfig';

const COLORS = {
    dark: '#1e2235',
    teal: '#2a9d8f',
    bg: '#f0f2f5',
    white: '#ffffff',
    textPrimary: '#1e2235',
    textSub: '#6b7280',
    border: '#e5e7eb',
    danger: '#e63946',
};

const STATUS_FILTERS = ['All', 'Draft', 'Ordered', 'Received', 'Cancelled'];

const STATUS_COLORS = {
    Draft: { bg: '#f3f4f6', text: '#6b7280' },
    Ordered: { bg: '#eaedfc', text: '#4361ee' },
    Received: { bg: '#e8f5f4', text: '#2a9d8f' },
    Cancelled: { bg: '#fceaea', text: '#e63946' },
};

const PurchaseOrderListScreen = ({ navigation }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('All');

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await api.get('/purchase-orders');
            setOrders(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to fetch purchase orders');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchOrders();
        }, [])
    );

    const handleDelete = (id, poNumber) => {
        Alert.alert(
            'Delete Purchase Order',
            `Are you sure you want to delete ${poNumber}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/purchase-orders/${id}`);
                            setOrders(prev => prev.filter(o => o._id !== id));
                        } catch (error) {
                            Alert.alert('Error', error.response?.data?.message || 'Failed to delete');
                        }
                    },
                },
            ]
        );
    };

    const filteredOrders = activeFilter === 'All'
        ? orders
        : orders.filter(o => o.status === activeFilter);

    const renderItem = ({ item }) => {
        const statusStyle = STATUS_COLORS[item.status] || STATUS_COLORS.Draft;
        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.poNumber}>{item.poNumber}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                        <Text style={[styles.statusText, { color: statusStyle.text }]}>{item.status}</Text>
                    </View>
                </View>

                <Text style={styles.supplierName}>{item.supplierName}</Text>
                {item.supplierContact ? (
                    <Text style={styles.supplierContact}>{item.supplierContact}</Text>
                ) : null}

                <View style={styles.divider} />

                <Text style={styles.itemsLabel}>
                    {item.items.length} item{item.items.length !== 1 ? 's' : ''}
                </Text>
                {item.items.map((lineItem, idx) => (
                    <Text key={idx} style={styles.itemLine}>
                        • {lineItem.stoneName}  {lineItem.quantityInSqFt} sqft @ LKR {lineItem.unitPrice}/sqft
                    </Text>
                ))}

                <View style={styles.cardFooter}>
                    <Text style={styles.totalLabel}>
                        Total: <Text style={styles.totalAmount}>LKR {item.totalAmount.toLocaleString()}</Text>
                    </Text>
                    <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>

                {item.expectedDeliveryDate ? (
                    <Text style={styles.deliveryDate}>
                        Expected: {new Date(item.expectedDeliveryDate).toLocaleDateString()}
                    </Text>
                ) : null}

                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => navigation.navigate('EditPurchaseOrder', { order: item })}
                    >
                        <MaterialCommunityIcons name="pencil-outline" size={16} color={COLORS.teal} />
                        <Text style={styles.editBtnText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => handleDelete(item._id, item.poNumber)}
                    >
                        <MaterialCommunityIcons name="trash-can-outline" size={16} color={COLORS.danger} />
                        <Text style={styles.deleteBtnText}>Delete</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Purchase Orders</Text>
                <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => navigation.navigate('AddPurchaseOrder')}
                >
                    <MaterialCommunityIcons name="plus" size={22} color={COLORS.white} />
                </TouchableOpacity>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterRow}
            >
                {STATUS_FILTERS.map(filter => (
                    <TouchableOpacity
                        key={filter}
                        style={[styles.filterTab, activeFilter === filter && styles.filterTabActive]}
                        onPress={() => setActiveFilter(filter)}
                    >
                        <Text style={[styles.filterTabText, activeFilter === filter && styles.filterTabTextActive]}>
                            {filter}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={COLORS.teal} />
                </View>
            ) : (
                <FlatList
                    data={filteredOrders}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.listContent}
                    renderItem={renderItem}
                    onRefresh={fetchOrders}
                    refreshing={loading}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No purchase orders found.</Text>
                    }
                />
            )}
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
        justifyContent: 'space-between',
    },
    headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: '800' },
    addBtn: {
        backgroundColor: COLORS.teal,
        borderRadius: 10,
        padding: 6,
    },

    filterRow: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
    },
    filterTab: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginRight: 8,
    },
    filterTabActive: {
        backgroundColor: COLORS.dark,
        borderColor: COLORS.dark,
    },
    filterTabText: { fontSize: 13, fontWeight: '600', color: COLORS.textSub },
    filterTabTextActive: { color: COLORS.white },

    listContent: { padding: 16, paddingBottom: 40 },

    card: {
        backgroundColor: COLORS.white,
        borderRadius: 14,
        padding: 16,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    poNumber: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 11, fontWeight: '700' },
    supplierName: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 2 },
    supplierContact: { fontSize: 12, color: COLORS.textSub, marginBottom: 4 },

    divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 10 },

    itemsLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textSub, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
    itemLine: { fontSize: 13, color: COLORS.textPrimary, marginBottom: 3 },

    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    totalLabel: { fontSize: 13, color: COLORS.textSub },
    totalAmount: { fontWeight: '800', color: COLORS.dark },
    dateText: { fontSize: 12, color: COLORS.textSub },
    deliveryDate: { fontSize: 12, color: COLORS.teal, marginTop: 4 },

    actions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 14,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingTop: 12,
    },
    editBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.teal,
    },
    editBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.teal },
    deleteBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.danger,
    },
    deleteBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.danger },

    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { textAlign: 'center', marginTop: 60, color: COLORS.textSub, fontSize: 15 },
});

export default PurchaseOrderListScreen;
