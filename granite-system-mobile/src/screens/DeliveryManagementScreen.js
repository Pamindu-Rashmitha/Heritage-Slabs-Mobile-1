import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Modal,
    TextInput,
    ScrollView,
    StatusBar,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
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
    warning: '#f4a261',
    warningLight: '#fdf3ea',
    orange: '#e76f51',
    orangeLight: '#fdecea'
};

const DeliveryManagementScreen = ({ navigation }) => {
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Modal State
    const [isModalVisible, setModalVisible] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Form Data & Dropdowns
    const [formData, setFormData] = useState({ orderId: null, vehicleId: null, driverName: '', estimatedTime: '' });
    const [readyOrders, setReadyOrders] = useState([]);
    const [availableVehicles, setAvailableVehicles] = useState([]);
    const [showOrderPicker, setShowOrderPicker] = useState(false);
    const [showVehiclePicker, setShowVehiclePicker] = useState(false);

    useFocusEffect(
        useCallback(() => {
            fetchDeliveries();
        }, [])
    );

    const fetchDeliveries = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const response = await api.get('/deliveries');
            setDeliveries(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch deliveries.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const openAssignModal = async () => {
        setFormData({ orderId: null, vehicleId: null, driverName: '', estimatedTime: '' });
        setShowOrderPicker(false);
        setShowVehiclePicker(false);
        setModalVisible(true);
        
        try {
            // Fetch ready orders and available vehicles simultaneously
            const [ordersRes, vehiclesRes] = await Promise.all([
                api.get('/deliveries/orders/ready'),
                api.get('/vehicles/available')
            ]);
            setReadyOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
            setAvailableVehicles(Array.isArray(vehiclesRes.data) ? vehiclesRes.data : []);
        } catch (error) {
            Alert.alert('Warning', 'Could not load available orders or vehicles.');
        }
    };

    const handleAssignDelivery = async () => {
        if (!formData.orderId || !formData.vehicleId || !formData.driverName) {
            Alert.alert('Validation Error', 'Order, Vehicle, and Driver Name are required.');
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post('/deliveries/assign', formData);
            Alert.alert('Success', 'Delivery assigned and truck dispatched!');
            setModalVisible(false);
            fetchDeliveries(true);
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to assign delivery.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateStatus = (deliveryId) => {
        Alert.alert(
            'Confirm Delivery',
            'Mark this order as DELIVERED? This will free up the vehicle.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        try {
                            await api.patch(`/deliveries/${deliveryId}/status`, { status: 'DELIVERED' });
                            fetchDeliveries(true);
                        } catch (error) {
                            Alert.alert('Error', 'Failed to update status.');
                        }
                    }
                }
            ]
        );
    };

    const renderDeliveryCard = ({ item }) => {
        const isDelivered = item.status === 'DELIVERED';
        
        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.orderIdBox}>
                        <MaterialCommunityIcons name="package-variant-closed" size={18} color={COLORS.textPrimary} />
                        <Text style={styles.orderIdText}>
                            Order #{item.order?._id?.slice(-6).toUpperCase() || 'UNKNOWN'}
                        </Text>
                    </View>
                    <View style={[
                        styles.statusBadge, 
                        { backgroundColor: isDelivered ? COLORS.tealLight : COLORS.warningLight }
                    ]}>
                        <Text style={[
                            styles.statusText, 
                            { color: isDelivered ? COLORS.teal : COLORS.warning }
                        ]}>
                            {item.status}
                        </Text>
                    </View>
                </View>

                <View style={styles.infoContainer}>
                    <View style={styles.infoRow}>
                        <MaterialCommunityIcons name="truck-outline" size={18} color={COLORS.textSub} style={styles.infoIcon} />
                        <Text style={styles.infoText}>Vehicle: <Text style={styles.infoTextBold}>{item.vehicle?.licensePlate || 'N/A'}</Text></Text>
                    </View>
                    
                    <View style={styles.infoRow}>
                        <MaterialCommunityIcons name="account-hard-hat" size={18} color={COLORS.textSub} style={styles.infoIcon} />
                        <Text style={styles.infoText}>Driver: <Text style={styles.infoTextBold}>{item.driverName}</Text></Text>
                    </View>

                    {item.estimatedTime ? (
                        <View style={styles.infoRow}>
                            <MaterialCommunityIcons name="clock-outline" size={18} color={COLORS.textSub} style={styles.infoIcon} />
                            <Text style={styles.infoText}>ETA: <Text style={styles.infoTextBold}>{item.estimatedTime}</Text></Text>
                        </View>
                    ) : null}
                </View>

                {!isDelivered && (
                    <TouchableOpacity 
                        style={styles.markDeliveredBtn} 
                        onPress={() => handleUpdateStatus(item._id)}
                        activeOpacity={0.8}
                    >
                        <MaterialCommunityIcons name="check-circle-outline" size={18} color={COLORS.white} />
                        <Text style={styles.markDeliveredText}>Mark as Delivered</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerEyebrow}>LOGISTICS</Text>
                    <Text style={styles.headerTitle}>Deliveries</Text>
                </View>
            </View>

            {loading && !refreshing ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={COLORS.teal} />
                    <Text style={styles.loadingText}>Loading deliveries...</Text>
                </View>
            ) : (
                <FlatList
                    data={deliveries}
                    keyExtractor={item => item._id}
                    renderItem={renderDeliveryCard}
                    contentContainerStyle={styles.listContent}
                    refreshing={refreshing}
                    onRefresh={() => fetchDeliveries(true)}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.centeredEmpty}>
                            <MaterialCommunityIcons name="truck-delivery-outline" size={64} color={COLORS.border} />
                            <Text style={styles.emptyTitle}>No Deliveries Yet</Text>
                            <Text style={styles.emptySub}>Assign trucks to paid orders to get started.</Text>
                        </View>
                    }
                />
            )}

            {!isModalVisible && (
                <TouchableOpacity style={styles.fab} onPress={openAssignModal} activeOpacity={0.85}>
                    <MaterialCommunityIcons name="truck-plus-outline" size={28} color={COLORS.white} />
                </TouchableOpacity>
            )}

            {/* Assign Delivery Modal */}
            <Modal visible={isModalVisible} transparent animationType="slide">
                <View style={styles.modalSubContainer}>
                    <KeyboardAvoidingView 
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
                        style={styles.modalContent}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Dispatch Delivery</Text>
                            <TouchableOpacity style={styles.modalCloseIcon} onPress={() => setModalVisible(false)}>
                                <MaterialCommunityIcons name="close" size={24} color={COLORS.textSub}/>
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Order Selection */}
                            <Text style={styles.label}>Select Order (Ready for Dispatch)</Text>
                            <TouchableOpacity 
                                style={styles.dropdown} 
                                onPress={() => {
                                    setShowOrderPicker(!showOrderPicker);
                                    setShowVehiclePicker(false);
                                }}
                                activeOpacity={0.7}
                            >
                                <Text style={formData.orderId ? styles.dropdownTextFilled : styles.dropdownTextPlaceholder}>
                                    {formData.orderId ? `Order #${formData.orderId.slice(-6).toUpperCase()}` : 'Tap to select Order...'}
                                </Text>
                                <MaterialCommunityIcons name={showOrderPicker ? "chevron-up" : "chevron-down"} size={20} color={COLORS.textSub} />
                            </TouchableOpacity>
                            
                            {showOrderPicker && (
                                <View style={styles.dropdownList}>
                                    {readyOrders.length === 0 ? <Text style={styles.noDataText}>No paid orders waiting.</Text> : 
                                        readyOrders.map(o => (
                                            <TouchableOpacity 
                                                key={o._id} 
                                                style={styles.dropdownItem} 
                                                onPress={() => { setFormData({...formData, orderId: o._id}); setShowOrderPicker(false); }}
                                            >
                                                <MaterialCommunityIcons name="package-variant" size={16} color={COLORS.textSub} style={{marginRight: 8}}/>
                                                <Text style={styles.dropdownItemText}>#{o._id.slice(-6).toUpperCase()} - {o.user?.name}</Text>
                                            </TouchableOpacity>
                                        ))
                                    }
                                </View>
                            )}

                            {/* Vehicle Selection */}
                            <Text style={styles.label}>Select Available Vehicle</Text>
                            <TouchableOpacity 
                                style={styles.dropdown} 
                                onPress={() => {
                                    setShowVehiclePicker(!showVehiclePicker);
                                    setShowOrderPicker(false);
                                }}
                                activeOpacity={0.7}
                            >
                                <Text style={formData.vehicleId ? styles.dropdownTextFilled : styles.dropdownTextPlaceholder}>
                                    {formData.vehicleId ? availableVehicles.find(v => v._id === formData.vehicleId)?.licensePlate : 'Tap to select Truck...'}
                                </Text>
                                <MaterialCommunityIcons name={showVehiclePicker ? "chevron-up" : "chevron-down"} size={20} color={COLORS.textSub} />
                            </TouchableOpacity>
                            
                            {showVehiclePicker && (
                                <View style={styles.dropdownList}>
                                    {availableVehicles.length === 0 ? <Text style={styles.noDataText}>No vehicles available.</Text> : 
                                        availableVehicles.map(v => (
                                            <TouchableOpacity 
                                                key={v._id} 
                                                style={styles.dropdownItem} 
                                                onPress={() => { setFormData({...formData, vehicleId: v._id}); setShowVehiclePicker(false); }}
                                            >
                                                <MaterialCommunityIcons name="truck-outline" size={16} color={COLORS.textSub} style={{marginRight: 8}}/>
                                                <Text style={styles.dropdownItemText}>{v.licensePlate} ({v.type})</Text>
                                            </TouchableOpacity>
                                        ))
                                    }
                                </View>
                            )}

                            <Text style={styles.label}>Driver Name</Text>
                            <TextInput 
                                style={styles.input} 
                                value={formData.driverName} 
                                onChangeText={(t) => setFormData({...formData, driverName: t})} 
                                placeholder="e.g. Nimal Perera"
                                placeholderTextColor="#9ca3af"
                            />

                            <Text style={styles.label}>Estimated Time (Optional)</Text>
                            <TextInput 
                                style={styles.input} 
                                value={formData.estimatedTime} 
                                onChangeText={(t) => setFormData({...formData, estimatedTime: t})} 
                                placeholder="e.g. 2:00 PM Today"
                                placeholderTextColor="#9ca3af"
                            />

                            <View style={styles.modalActions}>
                                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)} activeOpacity={0.7}>
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.saveBtn} onPress={handleAssignDelivery} disabled={isSubmitting} activeOpacity={0.8}>
                                    {isSubmitting ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.saveBtnText}>Dispatch Delivery</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    header: { backgroundColor: COLORS.dark, padding: 20, flexDirection: 'row', alignItems: 'center', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    backBtn: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 8, marginRight: 15 },
    headerEyebrow: { fontSize: 11, fontWeight: '700', color: COLORS.warning, letterSpacing: 2, marginBottom: 2 },
    headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white },
    
    listContent: { padding: 16, paddingBottom: 100 },
    card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 14, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.bg },
    orderIdBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    orderIdText: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
    
    infoContainer: { gap: 8, marginBottom: 4 },
    infoRow: { flexDirection: 'row', alignItems: 'center' },
    infoIcon: { marginRight: 8, width: 20 },
    infoText: { fontSize: 14, color: COLORS.textSub },
    infoTextBold: { color: COLORS.textPrimary, fontWeight: '600' },
    
    markDeliveredBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: COLORS.teal, marginTop: 16, paddingVertical: 14, borderRadius: 12 },
    markDeliveredText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
    
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, color: COLORS.textSub, fontSize: 14, fontWeight:'500' },
    centeredEmpty: { alignItems: 'center', marginTop: 80 },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, marginTop: 16 },
    emptySub: { fontSize: 14, color: COLORS.textSub, marginTop: 6, textAlign: 'center' },
    
    fab: { position: 'absolute', bottom: 30, right: 24, width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.warning, justifyContent: 'center', alignItems: 'center', elevation: 10, shadowColor: COLORS.warning, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 10 },
    
    // Modal
    modalSubContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: 40, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
    modalCloseIcon: { backgroundColor: COLORS.bg, padding: 6, borderRadius: 20 },
    label: { fontSize: 13, fontWeight: '700', color: COLORS.textSub, marginBottom: 6, marginLeft: 4 },
    input: { backgroundColor: COLORS.bg, borderRadius: 14, padding: 16, marginBottom: 18, borderWidth: 1, borderColor: COLORS.border, color: COLORS.textPrimary, fontSize: 15 },
    dropdown: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.bg, borderRadius: 14, padding: 16, marginBottom: 18, borderWidth: 1, borderColor: COLORS.border },
    dropdownTextFilled: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '500' },
    dropdownTextPlaceholder: { color: COLORS.textSub, fontSize: 15 },
    dropdownList: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, marginTop: -12, marginBottom: 18, maxHeight: 160, overflow: 'hidden' },
    dropdownItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.bg },
    dropdownItemText: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '500' },
    noDataText: { padding: 16, color: COLORS.textSub, textAlign: 'center' },
    
    modalActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    cancelBtn: { paddingVertical: 16, paddingHorizontal: 20, borderRadius: 14, flex: 0.4, alignItems: 'center', backgroundColor: COLORS.bg },
    cancelBtnText: { color: COLORS.textPrimary, fontWeight: '700', fontSize: 16 },
    saveBtn: { backgroundColor: COLORS.dark, padding: 16, borderRadius: 14, flex: 0.55, alignItems: 'center' },
    saveBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 16 }
});

export default DeliveryManagementScreen;