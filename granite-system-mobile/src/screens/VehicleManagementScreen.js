import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Alert,
    TouchableOpacity,
    ActivityIndicator,
    StatusBar,
    Modal,
    TextInput,
    ScrollView
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
    danger: '#e63946',
    dangerLight: '#fdecea',
    purple: '#7b2d8b',
    purpleLight: '#f3e8f8'
};

const StatsBar = ({ count }) => (
    <View style={styles.statsBar}>
        <Text style={styles.statsText}>
            {count} {count === 1 ? 'Vehicle' : 'Vehicles'} in Fleet
        </Text>
    </View>
);

const VehicleManagementScreen = ({ navigation }) => {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Modal state
    const [isModalVisible, setModalVisible] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ 
        licensePlate: '', 
        type: '', 
        capacity: '', 
        status: 'AVAILABLE' 
    });

    useFocusEffect(
        useCallback(() => {
            fetchVehicles();
        }, [])
    );

    const fetchVehicles = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const response = await api.get('/vehicles');
            setVehicles(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error fetching vehicles:', error);
            Alert.alert('Error', 'Failed to retrieve fleet data.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const confirmDelete = (id, plate) => {
        Alert.alert(
            'Delete Vehicle',
            `Are you sure you want to remove ${plate} from the fleet?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => handleDelete(id) }
            ]
        );
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/vehicles/${id}`);
            Alert.alert('Success', 'Vehicle deleted successfully.');
            fetchVehicles(true);
        } catch (error) {
            Alert.alert('Error', 'Could not delete the vehicle.');
        }
    };

    const openAddModal = () => {
        setFormData({ licensePlate: '', type: '', capacity: '', status: 'AVAILABLE' });
        setEditingId(null);
        setModalVisible(true);
    };

    const openEditModal = (vehicle) => {
        setFormData({
            licensePlate: vehicle.licensePlate,
            type: vehicle.type,
            capacity: vehicle.capacity.toString(),
            status: vehicle.status
        });
        setEditingId(vehicle._id || vehicle.id);
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!formData.licensePlate || !formData.type || !formData.capacity) {
            Alert.alert('Validation Error', 'License plate, type, and capacity are required.');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = { 
                ...formData, 
                capacity: parseInt(formData.capacity) 
            };

            if (editingId) {
                await api.put(`/vehicles/${editingId}`, payload);
                Alert.alert('Success', 'Vehicle updated successfully.');
            } else {
                await api.post('/vehicles', payload);
                Alert.alert('Success', 'Vehicle added to fleet.');
            }
            setModalVisible(false);
            fetchVehicles(true);
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to save vehicle details.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderVehicle = ({ item }) => (
        <View style={styles.rowCard}>
            <View style={styles.iconContainer}>
                <MaterialCommunityIcons name="truck-outline" size={32} color={COLORS.purple} />
            </View>

            <View style={styles.rowBody}>
                <View style={styles.rowInfo}>
                    <Text style={styles.rowName}>{item.licensePlate}</Text>
                    <View style={styles.rowMeta}>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{item.type}</Text>
                        </View>
                        <View style={[
                            styles.badge, 
                            { backgroundColor: item.status === 'AVAILABLE' ? COLORS.tealLight : COLORS.dangerLight }
                        ]}>
                            <Text style={[
                                styles.badgeText, 
                                { color: item.status === 'AVAILABLE' ? COLORS.teal : COLORS.danger }
                            ]}>
                                {item.status.replace('_', ' ')}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.detailText}>Max Capacity: {item.capacity} kg</Text>
                </View>

                <View style={styles.rowActions}>
                    <TouchableOpacity style={[styles.actionBtn, styles.updateBtn]} onPress={() => openEditModal(item)} activeOpacity={0.8}>
                        <MaterialCommunityIcons name="pencil-outline" size={18} color={COLORS.teal} />
                        <Text style={[styles.actionText, { color: COLORS.teal }]}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => confirmDelete(item._id || item.id, item.licensePlate)} activeOpacity={0.8}>
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
                    <Text style={styles.headerTitle}>Fleet Management</Text>
                </View>
            </View>

            {loading && !refreshing ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={COLORS.teal} />
                    <Text style={styles.loadingText}>Loading fleet...</Text>
                </View>
            ) : (
                <>
                    <StatsBar count={vehicles.length} />
                    <FlatList
                        data={vehicles}
                        keyExtractor={(item) => item._id || item.id || Math.random().toString()}
                        renderItem={renderVehicle}
                        refreshing={refreshing}
                        onRefresh={() => fetchVehicles(true)}
                        contentContainerStyle={styles.listContainer}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.centeredEmpty}>
                                <MaterialCommunityIcons name="truck-fast-outline" size={60} color={COLORS.border} />
                                <Text style={styles.emptyTitle}>No Vehicles Yet</Text>
                                <Text style={styles.emptySub}>Tap the + button to add a truck to your fleet.</Text>
                            </View>
                        }
                    />
                </>
            )}

            {!isModalVisible && (
                <TouchableOpacity style={styles.fab} onPress={openAddModal} activeOpacity={0.85}>
                    <MaterialCommunityIcons name="plus" size={30} color={COLORS.white} />
                </TouchableOpacity>
            )}

            {/* Modal Form */}
            <Modal visible={isModalVisible} transparent animationType="slide">
                <View style={styles.modalSubContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editingId ? 'Edit Vehicle' : 'Add New Vehicle'}</Text>
                            <TouchableOpacity style={styles.modalCloseIcon} onPress={() => setModalVisible(false)}>
                                <MaterialCommunityIcons name="close" size={24} color={COLORS.textSub} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.label}>License Plate</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.licensePlate}
                                onChangeText={(t) => setFormData({ ...formData, licensePlate: t })}
                                placeholder="e.g. ABC-1234"
                                placeholderTextColor="#9ca3af"
                                autoCapitalize="characters"
                            />

                            <Text style={styles.label}>Vehicle Type</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.type}
                                onChangeText={(t) => setFormData({ ...formData, type: t })}
                                placeholder="e.g. Flatbed Truck"
                                placeholderTextColor="#9ca3af"
                            />

                            <Text style={styles.label}>Capacity (kg)</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.capacity}
                                onChangeText={(t) => setFormData({ ...formData, capacity: t.replace(/[^0-9]/g, '') })}
                                placeholder="e.g. 1500"
                                placeholderTextColor="#9ca3af"
                                keyboardType="numeric"
                            />

                            <View style={styles.modalActions}>
                                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)} activeOpacity={0.7}>
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSubmitting} activeOpacity={0.8}>
                                    {isSubmitting ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.saveBtnText}>Save Vehicle</Text>
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
        flexDirection: 'row', alignItems: 'center', borderBottomLeftRadius: 24, borderBottomRightRadius: 24
    },
    backBtn: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 9, marginRight: 15 },
    headerTextContainer: { flex: 1 },
    headerEyebrow: { fontSize: 11, fontWeight: '700', color: COLORS.purple, letterSpacing: 2, marginBottom: 2 },
    headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white },
    
    statsBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, gap: 6 },
    statsText: { fontSize: 13, color: COLORS.textSub, fontWeight: '600' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    centeredEmpty: { alignItems: 'center', marginTop: 80 },
    loadingText: { marginTop: 12, color: COLORS.textSub, fontSize: 14, fontWeight:'500' },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, marginTop: 16 },
    emptySub: { fontSize: 14, color: COLORS.textSub, marginTop: 6, textAlign: 'center' },
    
    listContainer: { paddingHorizontal: 16, paddingBottom: 100 },
    rowCard: {
        backgroundColor: COLORS.white, borderRadius: 16, marginBottom: 12, flexDirection: 'row',
        shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
    },
    iconContainer: {
        width: 60, height: 60, margin: 12, borderRadius: 14, backgroundColor: COLORS.purpleLight,
        justifyContent: 'center', alignItems: 'center', alignSelf: 'center'
    },
    rowBody: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingRight: 14, gap: 10 },
    rowInfo: { flex: 1 },
    rowName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 6 },
    rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' },
    badge: { backgroundColor: COLORS.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    badgeText: { fontSize: 11, fontWeight: '700', color: COLORS.textSub, textTransform: 'uppercase' },
    detailText: { fontSize: 12, color: COLORS.textSub, fontWeight: '500' },
    
    rowActions: { flexDirection: 'column', gap: 6 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, minWidth: 70, justifyContent: 'center' },
    updateBtn: { backgroundColor: COLORS.tealLight },
    deleteBtn: { backgroundColor: COLORS.dangerLight },
    actionText: { fontSize: 12, fontWeight: '700' },
    
    fab: {
        position: 'absolute', bottom: 28, right: 24, width: 60, height: 60, borderRadius: 30,
        backgroundColor: COLORS.teal, justifyContent: 'center', alignItems: 'center',
        shadowColor: COLORS.teal, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 10, elevation: 10,
    },
    
    modalSubContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: 40, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
    modalCloseIcon: { backgroundColor: COLORS.bg, padding: 6, borderRadius: 20 },
    label: { fontSize: 13, fontWeight: '700', color: COLORS.textSub, marginBottom: 6, marginLeft: 4 },
    input: { backgroundColor: COLORS.bg, borderRadius: 14, padding: 16, marginBottom: 18, fontSize: 16, color: COLORS.textPrimary, borderWidth: 1, borderColor: '#e5e7eb' },
    modalActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    cancelBtn: { paddingVertical: 16, paddingHorizontal: 20, borderRadius: 14, flex: 0.4, alignItems: 'center', backgroundColor: COLORS.bg },
    cancelBtnText: { color: COLORS.textPrimary, fontWeight: '700', fontSize: 16 },
    saveBtn: { backgroundColor: COLORS.teal, paddingVertical: 16, borderRadius: 14, flex: 0.55, alignItems: 'center' },
    saveBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 16 }
});

export default VehicleManagementScreen;