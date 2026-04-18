import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList,
    Alert, TouchableOpacity, ActivityIndicator,
    StatusBar, Modal, TextInput, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../api/axiosConfig';

const COLORS = {
    dark: '#1e2235',
    teal: '#2a9d8f',
    tealLight: '#e8f5f4',
    danger: '#e63946',
    dangerLight: '#fdecea',
    warning: '#e9c46a',
    warningLight: '#fdf8e8',
    bg: '#f0f2f5',
    white: '#ffffff',
    textPrimary: '#1e2235',
    textSub: '#6b7280',
    border: '#e5e7eb',
    orange: '#e76f51', // Special color for Suppliers
    orangeLight: '#fdecea'
};

const StatsBar = ({ count }) => (
    <View style={styles.statsBar}>
        <Text style={styles.statsText}>
            {count} {count === 1 ? 'Supplier' : 'Suppliers'} Active
        </Text>
    </View>
);

const EmptyState = () => (
    <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
            <MaterialCommunityIcons name="factory" size={60} color={COLORS.border} />
        </View>
        <Text style={styles.emptyTitle}>No Suppliers Yet</Text>
        <Text style={styles.emptySub}>Tap the + button below to add your first supplier.</Text>
    </View>
);


const SupplierManagementScreen = ({ navigation }) => {
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Modal state
    const [isModalVisible, setModalVisible] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', suppliedMaterial: '', rating: '5.0' });
    const [dropdownVisible, setDropdownVisible] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const [suppRes, prodRes] = await Promise.all([
                api.get('/suppliers'),
                api.get('/products')
            ]);
            setSuppliers(Array.isArray(suppRes.data) ? suppRes.data : []);
            
            // The product API returns { products: [...] }
            const prodData = prodRes.data?.products || prodRes.data;
            setProducts(Array.isArray(prodData) ? prodData : []);
        } catch (error) {
            console.error('Error fetching data:', error);
            Alert.alert('Error', 'Failed to retrieve data.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const confirmDelete = (supplierId, supplierName) => {
        Alert.alert(
            'Delete Supplier',
            `Are you sure you want to remove ${supplierName}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => handleDelete(supplierId) }
            ]
        );
    };

    const handleDelete = async (id) => {
        try {
            const response = await api.delete(`/suppliers/${id}`);
            if (response.status === 200 || response.status === 204) {
                Alert.alert('Success', 'Supplier deleted successfully.');
                fetchData(true);
            }
        } catch (error) {
            console.error('Delete error:', error);
            Alert.alert('Error', 'Could not delete the supplier.');
        }
    };

    const openAddModal = () => {
        setFormData({ name: '', email: '', phone: '', suppliedMaterial: '', rating: '5.0' });
        setEditingId(null);
        setModalVisible(true);
    };

    const openEditModal = (supplier) => {
        setFormData({
            name: supplier.name || '',
            email: supplier.email || '',
            phone: supplier.phone || '',
            suppliedMaterial: supplier.suppliedMaterial || '',
            rating: supplier.rating ? supplier.rating.toString() : '5.0'
        });
        setEditingId(supplier.id);
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!formData.name || !formData.phone || !formData.suppliedMaterial) {
            Alert.alert('Validation Error', 'Name, phone, and supplied material are required.');
            return;
        }
        if (formData.phone.length !== 10) {
            Alert.alert('Validation Error', 'Phone must be exactly 10 digits.');
            return;
        }
        if (formData.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                Alert.alert('Validation Error', 'Please provide a valid email address.');
                return;
            }
        }

        setIsSubmitting(true);
        try {
            const payload = { ...formData, rating: parseFloat(formData.rating) };
            if (editingId) {
                await api.put(`/suppliers/${editingId}`, payload);
                Alert.alert('Success', 'Supplier updated successfully.');
            } else {
                await api.post('/suppliers', payload);
                Alert.alert('Success', 'Supplier created successfully.');
            }
            setModalVisible(false);
            fetchData(true);
        } catch (error) {
            console.error('Save error:', error.response?.data || error.message);
            Alert.alert('Error', 'Failed to save supplier details.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderSupplier = ({ item }) => (
        <View style={styles.rowCard}>
            
            <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>{item.name ? item.name.charAt(0).toUpperCase() : 'S'}</Text>
            </View>

            <View style={styles.rowBody}>
                <View style={styles.rowInfo}>
                    <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
                    <View style={styles.rowMeta}>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{item.suppliedMaterial || 'N/A'}</Text>
                        </View>
                        <View style={styles.ratingBadge}>
                            <MaterialCommunityIcons name="star" size={14} color={COLORS.warning} />
                            <Text style={styles.ratingText}>{item.rating ? item.rating.toFixed(1) : '5.0'}</Text>
                        </View>
                    </View>
                    <Text style={styles.detailText}><MaterialCommunityIcons name="phone" size={12} /> {item.phone}   <MaterialCommunityIcons name="email-outline" size={12} /> {item.email || 'N/A'}</Text>
                </View>

                <View style={styles.rowActions}>
                    <TouchableOpacity style={[styles.actionBtn, styles.updateBtn]} onPress={() => openEditModal(item)} activeOpacity={0.8}>
                        <MaterialCommunityIcons name="pencil-outline" size={18} color={COLORS.teal} />
                        <Text style={[styles.actionText, { color: COLORS.teal }]}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => confirmDelete(item.id || item._id, item.name)} activeOpacity={0.8}>
                        <MaterialCommunityIcons name="trash-can-outline" size={18} color={COLORS.danger} />
                        <Text style={[styles.actionText, { color: COLORS.danger }]}>Delete</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#ffffff" />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerEyebrow}>ADMIN</Text>
                    <Text style={styles.headerTitle}>Supplier Management</Text>
                </View>
            </View>

            {loading && !refreshing ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={COLORS.teal} />
                    <Text style={styles.loadingText}>Loading suppliers...</Text>
                </View>
            ) : (
                <>
                    <StatsBar count={suppliers.length} />
                    <FlatList
                        data={suppliers}
                        keyExtractor={(item) => item.id?.toString() || item._id?.toString() || Math.random().toString()}
                        renderItem={renderSupplier}
                        refreshing={refreshing}
                        onRefresh={() => fetchData(true)}
                        contentContainerStyle={[
                            styles.listContainer,
                            suppliers.length === 0 && styles.listContentEmpty,
                        ]}
                        ListEmptyComponent={<EmptyState />}
                        showsVerticalScrollIndicator={false}
                    />
                </>
            )}

            {/* Floating Add Button */}
            {!isModalVisible && (
                <TouchableOpacity style={styles.fab} onPress={openAddModal} activeOpacity={0.85}>
                    <MaterialCommunityIcons name="plus" size={30} color={COLORS.white} />
                </TouchableOpacity>
            )}

            {/* Form Modal */}
            <Modal visible={isModalVisible} transparent animationType="slide">
                <View style={styles.modalSubContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editingId ? 'Edit Supplier' : 'Add New Supplier'}</Text>
                            <TouchableOpacity style={styles.modalCloseIcon} onPress={() => setModalVisible(false)}>
                                <MaterialCommunityIcons name="close" size={24} color={COLORS.textSub} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>

                            <Text style={styles.label}>Company Name</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.name}
                                onChangeText={(t) => setFormData({ ...formData, name: t })}
                                placeholder="e.g. Global Stones Ltd"
                                placeholderTextColor="#9ca3af"
                            />

                            <Text style={styles.label}>Email Address</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.email}
                                onChangeText={(t) => setFormData({ ...formData, email: t })}
                                placeholder="supplier@example.com"
                                placeholderTextColor="#9ca3af"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />

                            <Text style={styles.label}>Phone Number</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.phone}
                                onChangeText={(t) => {
                                    const cleaned = t.replace(/[^0-9]/g, '');
                                    setFormData({ ...formData, phone: cleaned });
                                }}
                                placeholder="10 digit phone number"
                                placeholderTextColor="#9ca3af"
                                keyboardType="number-pad"
                                maxLength={10}
                            />

                            <Text style={styles.label}>Supplied Material Type</Text>
                            <TouchableOpacity style={styles.inputDropdown} onPress={() => setDropdownVisible(!dropdownVisible)} activeOpacity={0.7}>
                                <Text style={{ color: formData.suppliedMaterial ? COLORS.textPrimary : '#9ca3af', fontSize: 16 }}>
                                    {formData.suppliedMaterial || 'Select Material...'}
                                </Text>
                                <MaterialCommunityIcons name={dropdownVisible ? "chevron-up" : "chevron-down"} size={20} color={COLORS.textSub} />
                            </TouchableOpacity>
                            {dropdownVisible && (
                                <View style={styles.dropdownContainer}>
                                    {products.map(p => (
                                        <TouchableOpacity
                                            key={p._id || p.id}
                                            style={styles.dropdownItem}
                                            onPress={() => {
                                                setFormData({ ...formData, suppliedMaterial: p.stoneName });
                                                setDropdownVisible(false);
                                            }}
                                        >
                                            <MaterialCommunityIcons name="layers-outline" size={16} color={COLORS.textSub} style={{ marginRight: 8 }}/>
                                            <Text style={styles.dropdownItemText}>{p.stoneName}</Text>
                                        </TouchableOpacity>
                                    ))}
                                    {products.length === 0 && (
                                        <Text style={{ padding: 15, color: COLORS.textSub, textAlign:'center' }}>No products available.</Text>
                                    )}
                                </View>
                            )}

                            <Text style={styles.label}>Supplier Rating (0-5)</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.rating}
                                onChangeText={(t) => setFormData({ ...formData, rating: t })}
                                keyboardType="numeric"
                            />

                            <View style={styles.modalActions}>
                                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)} activeOpacity={0.7}>
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSubmitting} activeOpacity={0.8}>
                                    {isSubmitting ? (
                                        <ActivityIndicator color="#fff" style={{width: 20, height: 20}} />
                                    ) : (
                                        <Text style={styles.saveBtnText}>Save Supplier</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    header: {
        backgroundColor: COLORS.dark, paddingHorizontal: 20, paddingTop: 15, paddingBottom: 25,
        flexDirection: 'row', alignItems: 'center', borderBottomLeftRadius: 24, borderBottomRightRadius: 24, gap: 14
    },
    backBtn: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 9 },
    headerTextContainer: { flex: 1 },
    headerEyebrow: { fontSize: 11, fontWeight: '700', color: COLORS.teal, letterSpacing: 2, marginBottom: 2 },
    headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white },
    
    // Stats
    statsBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, gap: 6 },
    statsText: { fontSize: 13, color: COLORS.textSub, fontWeight: '600' },
    
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, color: COLORS.textSub, fontSize: 14, fontWeight:'500' },
    
    // Empty
    listContentEmpty: { flex: 1 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
    emptyIconContainer: { width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset:{width:0, height:2}, shadowOpacity: 0.05 },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, marginTop: 16 },
    emptySub: { fontSize: 14, color: COLORS.textSub, marginTop: 6, textAlign: 'center', paddingHorizontal: 40 },
    
    // List & Cards
    listContainer: { paddingHorizontal: 16, paddingBottom: 100 },
    rowCard: {
        backgroundColor: COLORS.white, borderRadius: 16, marginBottom: 12, flexDirection: 'row',
        shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
    },
    avatarContainer: {
        width: 60, height: 60, margin: 12, borderRadius: 30, backgroundColor: COLORS.orangeLight,
        justifyContent: 'center', alignItems: 'center', alignSelf: 'center', borderWidth: 1, borderColor: '#fceaea'
    },
    avatarText: { fontSize: 24, fontWeight: '800', color: COLORS.orange },
    rowBody: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingRight: 14, gap: 10 },
    rowInfo: { flex: 1 },
    rowName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 6 },
    rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    badge: { backgroundColor: COLORS.tealLight, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    badgeText: { fontSize: 11, fontWeight: '700', color: COLORS.teal, textTransform: 'uppercase' },
    ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.warningLight, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
    ratingText: { fontSize: 12, fontWeight: '700', color: COLORS.warning, marginLeft: 4 },
    detailText: { fontSize: 12, color: COLORS.textSub, fontWeight: '500' },
    
    rowActions: { flexDirection: 'column', gap: 6 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, minWidth: 70, justifyContent: 'center' },
    updateBtn: { backgroundColor: COLORS.tealLight },
    deleteBtn: { backgroundColor: COLORS.dangerLight },
    actionText: { fontSize: 12, fontWeight: '700' },
    
    // FAB
    fab: {
        position: 'absolute', bottom: 28, right: 24, width: 60, height: 60, borderRadius: 30,
        backgroundColor: COLORS.teal, justifyContent: 'center', alignItems: 'center',
        shadowColor: COLORS.teal, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 10, elevation: 10,
    },
    
    // Modal
    modalSubContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: 50, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
    modalCloseIcon: { backgroundColor: COLORS.bg, padding: 6, borderRadius: 20 },
    label: { fontSize: 13, fontWeight: '700', color: COLORS.textSub, marginBottom: 6, marginLeft: 4 },
    input: { backgroundColor: COLORS.bg, borderRadius: 14, padding: 16, marginBottom: 18, fontSize: 16, color: COLORS.textPrimary, borderWidth: 1, borderColor: '#e5e7eb' },
    inputDropdown: { backgroundColor: COLORS.bg, borderRadius: 14, padding: 16, marginBottom: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
    dropdownContainer: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14, marginTop: -14, marginBottom: 18, backgroundColor: COLORS.white, maxHeight: 180, overflow: 'hidden' },
    dropdownItem: { flexDirection:'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.bg },
    dropdownItemText: { fontSize: 15, color: COLORS.textPrimary, fontWeight: '500' },
    modalActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    cancelBtn: { paddingVertical: 16, paddingHorizontal: 20, borderRadius: 14, flex: 0.4, alignItems: 'center', backgroundColor: COLORS.bg },
    cancelBtnText: { color: COLORS.textPrimary, fontWeight: '700', fontSize: 16 },
    saveBtn: { backgroundColor: COLORS.teal, paddingVertical: 16, borderRadius: 14, flex: 0.55, alignItems: 'center', shadowColor: COLORS.teal, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    saveBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 16 }
});

export default SupplierManagementScreen;
