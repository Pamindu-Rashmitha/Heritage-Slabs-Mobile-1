import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Modal,
    FlatList,
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
    danger: '#e63946',
    inputBg: '#f9fafb',
};

const emptyItem = () => ({ product: null, stoneName: '', quantityInSqFt: '', unitPrice: '' });

const AddPurchaseOrderScreen = ({ navigation }) => {
    const [supplierName, setSupplierName] = useState('');
    const [supplierContact, setSupplierContact] = useState('');
    const [items, setItems] = useState([emptyItem()]);
    const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const [products, setProducts] = useState([]);
    const [productsLoading, setProductsLoading] = useState(true);
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerTarget, setPickerTarget] = useState(null); // index of item being picked

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await api.get('/products');
                setProducts(Array.isArray(response.data.products) ? response.data.products : []);
            } catch {
                Alert.alert('Error', 'Failed to load products');
            } finally {
                setProductsLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const openPicker = (index) => {
        setPickerTarget(index);
        setPickerVisible(true);
    };

    const selectProduct = (product) => {
        setItems(prev => {
            const updated = [...prev];
            updated[pickerTarget] = {
                product: product._id,
                stoneName: product.stoneName,
                quantityInSqFt: '',
                unitPrice: String(product.pricePerSqFt),
            };
            return updated;
        });
        setPickerVisible(false);
    };

    const updateItem = (index, field, value) => {
        setItems(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const addItem = () => setItems(prev => [...prev, emptyItem()]);

    const removeItem = (index) => {
        if (items.length === 1) return;
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const calcSubtotal = (item) => {
        const qty = parseFloat(item.quantityInSqFt) || 0;
        const price = parseFloat(item.unitPrice) || 0;
        return qty * price;
    };

    const totalAmount = items.reduce((sum, item) => sum + calcSubtotal(item), 0);

    const validate = () => {
        if (!supplierName.trim()) {
            Alert.alert('Validation Error', 'Supplier name is required.');
            return false;
        }
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (!item.product) {
                Alert.alert('Validation Error', `Item ${i + 1}: Please select a product.`);
                return false;
            }
            if (!item.quantityInSqFt || parseFloat(item.quantityInSqFt) <= 0) {
                Alert.alert('Validation Error', `Item ${i + 1}: Quantity must be greater than 0.`);
                return false;
            }
            if (!item.unitPrice || parseFloat(item.unitPrice) <= 0) {
                Alert.alert('Validation Error', `Item ${i + 1}: Unit price must be greater than 0.`);
                return false;
            }
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setSubmitting(true);
        try {
            const payload = {
                supplierName: supplierName.trim(),
                supplierContact: supplierContact.trim() || undefined,
                items: items.map(item => ({
                    product: item.product,
                    stoneName: item.stoneName,
                    quantityInSqFt: parseFloat(item.quantityInSqFt),
                    unitPrice: parseFloat(item.unitPrice),
                })),
                expectedDeliveryDate: expectedDeliveryDate.trim() || undefined,
                notes: notes.trim() || undefined,
            };
            await api.post('/purchase-orders', payload);
            Alert.alert('Success', 'Purchase order created successfully.', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to create purchase order');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>New Purchase Order</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Product Picker Modal */}
            <Modal visible={pickerVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Product</Text>
                            <TouchableOpacity onPress={() => setPickerVisible(false)}>
                                <MaterialCommunityIcons name="close" size={22} color={COLORS.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        {productsLoading ? (
                            <ActivityIndicator size="large" color={COLORS.teal} style={{ marginTop: 20 }} />
                        ) : (
                            <FlatList
                                data={products}
                                keyExtractor={p => p._id}
                                contentContainerStyle={{ paddingBottom: 20 }}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.productRow}
                                        onPress={() => selectProduct(item)}
                                    >
                                        <View style={styles.productIcon}>
                                            <MaterialCommunityIcons name="layers-outline" size={22} color={COLORS.teal} />
                                        </View>
                                        <View style={styles.productInfo}>
                                            <Text style={styles.productName}>{item.stoneName}</Text>
                                            <Text style={styles.productMeta}>
                                                LKR {item.pricePerSqFt}/sqft  ·  Stock: {item.stockInSqFt} sqft
                                            </Text>
                                        </View>
                                        <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textSub} />
                                    </TouchableOpacity>
                                )}
                                ListEmptyComponent={
                                    <Text style={styles.emptyText}>No products found. Add products first.</Text>
                                }
                            />
                        )}
                    </View>
                </View>
            </Modal>

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

                    {/* Supplier Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Supplier Details</Text>

                        <Text style={styles.label}>Supplier Name <Text style={styles.required}>*</Text></Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Colombo Granite Suppliers"
                            placeholderTextColor={COLORS.textSub}
                            value={supplierName}
                            onChangeText={setSupplierName}
                        />

                        <Text style={styles.label}>Contact (Phone / Email)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. 0771234567"
                            placeholderTextColor={COLORS.textSub}
                            value={supplierContact}
                            onChangeText={setSupplierContact}
                        />
                    </View>

                    {/* Items Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Products</Text>
                            <TouchableOpacity style={styles.addItemBtn} onPress={addItem}>
                                <MaterialCommunityIcons name="plus" size={16} color={COLORS.teal} />
                                <Text style={styles.addItemText}>Add Item</Text>
                            </TouchableOpacity>
                        </View>

                        {items.map((item, index) => (
                            <View key={index} style={styles.itemCard}>
                                <View style={styles.itemCardHeader}>
                                    <Text style={styles.itemLabel}>Item {index + 1}</Text>
                                    {items.length > 1 && (
                                        <TouchableOpacity onPress={() => removeItem(index)}>
                                            <MaterialCommunityIcons name="close-circle" size={20} color={COLORS.danger} />
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {/* Product Selector */}
                                <Text style={styles.label}>Product <Text style={styles.required}>*</Text></Text>
                                <TouchableOpacity
                                    style={[styles.productSelector, item.product && styles.productSelectorFilled]}
                                    onPress={() => openPicker(index)}
                                >
                                    <MaterialCommunityIcons
                                        name={item.product ? 'layers' : 'layers-outline'}
                                        size={18}
                                        color={item.product ? COLORS.teal : COLORS.textSub}
                                    />
                                    <Text style={[styles.productSelectorText, item.product && styles.productSelectorTextFilled]}>
                                        {item.stoneName || 'Tap to select a product'}
                                    </Text>
                                    <MaterialCommunityIcons name="chevron-down" size={18} color={COLORS.textSub} />
                                </TouchableOpacity>

                                <View style={styles.row}>
                                    <View style={styles.halfCol}>
                                        <Text style={styles.label}>Qty (sqft) <Text style={styles.required}>*</Text></Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="0"
                                            placeholderTextColor={COLORS.textSub}
                                            value={item.quantityInSqFt}
                                            onChangeText={v => updateItem(index, 'quantityInSqFt', v)}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                    <View style={styles.halfCol}>
                                        <Text style={styles.label}>Unit Price (LKR)</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="0"
                                            placeholderTextColor={COLORS.textSub}
                                            value={item.unitPrice}
                                            onChangeText={v => updateItem(index, 'unitPrice', v)}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                </View>

                                <Text style={styles.subtotalText}>
                                    Subtotal: LKR {calcSubtotal(item).toLocaleString()}
                                </Text>
                            </View>
                        ))}
                    </View>

                    {/* Extra Details */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Additional Details</Text>

                        <Text style={styles.label}>Expected Delivery Date</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor={COLORS.textSub}
                            value={expectedDeliveryDate}
                            onChangeText={setExpectedDeliveryDate}
                        />

                        <Text style={styles.label}>Notes</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Any special instructions..."
                            placeholderTextColor={COLORS.textSub}
                            value={notes}
                            onChangeText={setNotes}
                            multiline
                            numberOfLines={3}
                        />
                    </View>

                    {/* Total */}
                    <View style={styles.totalBox}>
                        <Text style={styles.totalLabel}>Total Amount</Text>
                        <Text style={styles.totalValue}>LKR {totalAmount.toLocaleString()}</Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                        onPress={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting
                            ? <ActivityIndicator color={COLORS.white} />
                            : <Text style={styles.submitBtnText}>Create Purchase Order</Text>
                        }
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
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

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '75%',
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    modalTitle: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },
    productRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        gap: 12,
    },
    productIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#e8f5f4',
        justifyContent: 'center',
        alignItems: 'center',
    },
    productInfo: { flex: 1 },
    productName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
    productMeta: { fontSize: 12, color: COLORS.textSub, marginTop: 2 },

    scrollContent: { padding: 16, paddingBottom: 40 },
    section: {
        backgroundColor: COLORS.white,
        borderRadius: 14,
        padding: 16,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: COLORS.textPrimary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
    },
    addItemBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.teal,
    },
    addItemText: { fontSize: 12, fontWeight: '700', color: COLORS.teal },

    label: { fontSize: 13, fontWeight: '600', color: COLORS.textSub, marginBottom: 6 },
    required: { color: COLORS.danger },

    input: {
        backgroundColor: COLORS.inputBg,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 14,
        color: COLORS.textPrimary,
        marginBottom: 12,
    },
    textArea: { height: 80, textAlignVertical: 'top' },

    productSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: COLORS.inputBg,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 12,
    },
    productSelectorFilled: {
        borderColor: COLORS.teal,
        backgroundColor: '#e8f5f4',
    },
    productSelectorText: { flex: 1, fontSize: 14, color: COLORS.textSub },
    productSelectorTextFilled: { color: COLORS.textPrimary, fontWeight: '600' },

    row: { flexDirection: 'row', gap: 10 },
    halfCol: { flex: 1 },

    itemCard: {
        backgroundColor: COLORS.bg,
        borderRadius: 10,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    itemCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    itemLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
    subtotalText: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.teal,
        textAlign: 'right',
        marginTop: -4,
    },

    totalBox: {
        backgroundColor: COLORS.dark,
        borderRadius: 14,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    totalLabel: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
    totalValue: { fontSize: 20, fontWeight: '800', color: COLORS.white },

    submitBtn: {
        backgroundColor: COLORS.teal,
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
    },
    submitBtnDisabled: { opacity: 0.6 },
    submitBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },

    emptyText: { textAlign: 'center', color: COLORS.textSub, marginTop: 30, fontSize: 14 },
});

export default AddPurchaseOrderScreen;
