import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator,
    TextInput,
    Modal,
    ScrollView,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api, { SERVER_URL } from '../api/axiosConfig';

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
};

const PROVINCE_CITY_MAP = {
    'Western': ['Colombo', 'Gampaha', 'Kalutara'],
    'Central': ['Kandy', 'Matale', 'Nuwara Eliya'],
    'Southern': ['Galle', 'Matara', 'Hambantota'],
    'Northern': ['Jaffna', 'Kilinochchi', 'Mannar', 'Mullaitivu', 'Vavuniya'],
    'Eastern': ['Trincomalee', 'Batticaloa', 'Ampara'],
    'North Western': ['Kurunegala', 'Puttalam'],
    'North Central': ['Anuradhapura', 'Polonnaruwa'],
    'Uva': ['Badulla', 'Monaragala'],
    'Sabaragamuwa': ['Ratnapura', 'Kegalle'],
};

const normalizeLabel = (value) =>
    String(value || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');

const CartScreen = ({ navigation }) => {
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const [checkoutVisible, setCheckoutVisible] = useState(false);
    const [selectorVisible, setSelectorVisible] = useState(false);
    const [selectorType, setSelectorType] = useState('province');

    // Form State
    const [shippingDetails, setShippingDetails] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        province: '',
        city: '',
        zip: '',
        country: 'Sri Lanka',
        orderNote: ''
    });

    useEffect(() => {
        fetchCart();
    }, []);

    const fetchCart = async () => {
        try {
            const response = await api.get('/cart');
            setCart(response.data);
        } catch (error) {
            console.error('Error fetching cart:', error);
            Alert.alert('Error', 'Failed to load cart');
        } finally {
            setLoading(false);
        }
    };

    const updateQuantity = async (itemId, newQty) => {
        if (newQty < 1) return;
        try {
            const response = await api.put(`/cart/${itemId}`, { quantity: newQty });
            setCart(response.data);
        } catch (error) {
            Alert.alert('Error', 'Failed to update quantity');
        }
    };

    const removeItem = async (itemId) => {
        try {
            const response = await api.delete(`/cart/${itemId}`);
            setCart(response.data);
        } catch (error) {
            Alert.alert('Error', 'Failed to remove item');
        }
    };

    const calculateTotal = () => {
        if (!cart) return 0;
        return cart.items.reduce((total, item) => total + (item.product.pricePerSqFt * item.quantity), 0);
    };

    const handleCheckoutSubmit = async () => {
        // Shipping validation
        const { firstName, lastName, email, phone, address, province, city, zip } = shippingDetails;
        if (!firstName || !lastName || !email || !phone || !address || !province || !city || !zip) {
            Alert.alert('Missing Info', 'Please fill in all required fields.');
            return;
        }

        const phoneDigits = phone.replace(/\D/g, '');
        const isValidSLPhone =
            /^(?:0\d{9}|94\d{9})$/.test(phoneDigits) ||
            /^(?:\+94)\d{9}$/.test(phone.trim());
        if (!isValidSLPhone) {
            Alert.alert('Invalid Phone Number', 'Use a valid Sri Lankan number (e.g. 07XXXXXXXX or +947XXXXXXXX).');
            return;
        }

        if (!/^\d{5}$/.test(zip.trim())) {
            Alert.alert('Invalid Postal Code', 'Postal code must be exactly 5 digits.');
            return;
        }

        const provinceKey = Object.keys(PROVINCE_CITY_MAP).find(
            (key) => normalizeLabel(key) === normalizeLabel(province)
        );
        if (!provinceKey) {
            Alert.alert(
                'Invalid Province',
                `Please enter a valid Sri Lankan province: ${Object.keys(PROVINCE_CITY_MAP).join(', ')}.`
            );
            return;
        }

        const selectedProvinceCities = PROVINCE_CITY_MAP[provinceKey];
        const cityIsValid = selectedProvinceCities.some(
            (provinceCity) => normalizeLabel(provinceCity) === normalizeLabel(city)
        );
        if (!cityIsValid) {
            Alert.alert(
                'Invalid City',
                `Please enter a city under ${provinceKey}: ${selectedProvinceCities.join(', ')}.`
            );
            return;
        }

        try {
            setLoading(true);
            setCheckoutVisible(false);

            // 1. Create Order
            const orderRes = await api.post('/orders', {
                shippingDetails: shippingDetails
            });

            const { _id: orderId, totalAmount } = orderRes.data;

            setLoading(false);
            navigation.navigate('SimulatedPayment', {
                orderId,
                amount: totalAmount,
            });
        } catch (error) {
            setLoading(false);
            const errorMsg = error.response?.data?.message || error.message;
            Alert.alert('Checkout Error', `Failed to process order: ${errorMsg}`);
        }
    };

    const openSelector = (type) => {
        setSelectorType(type);
        setSelectorVisible(true);
    };

    const provinceOptions = Object.keys(PROVINCE_CITY_MAP);
    const matchedProvinceKey = provinceOptions.find(
        (key) => normalizeLabel(key) === normalizeLabel(shippingDetails.province)
    );
    const cityOptions = matchedProvinceKey ? PROVINCE_CITY_MAP[matchedProvinceKey] : [];

    const selectOption = (value) => {
        if (selectorType === 'province') {
            setShippingDetails({ ...shippingDetails, province: value, city: '' });
        } else {
            setShippingDetails({ ...shippingDetails, city: value });
        }
        setSelectorVisible(false);
    };

    if (loading && !checkoutVisible) {
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
                <Text style={styles.headerTitle}>My Cart</Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                data={cart?.items || []}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                style={{ flex: 1 }}
                renderItem={({ item }) => (
                    <View style={styles.cartItem}>
                        <Image 
                            source={{ uri: item.product.imageUrl ? `${SERVER_URL}${item.product.imageUrl}` : 'https://via.placeholder.com/100' }} 
                            style={styles.itemImage} 
                        />
                        <View style={styles.itemDetails}>
                            <Text style={styles.itemName}>{item.product.stoneName}</Text>
                            <Text style={styles.itemPrice}>LKR {item.product.pricePerSqFt} / SqFt</Text>
                            
                            <View style={styles.qtyRow}>
                                <TouchableOpacity onPress={() => updateQuantity(item._id, item.quantity - 1)} style={styles.qtyBtn} activeOpacity={0.7}>
                                    <MaterialCommunityIcons name="minus" size={16} color={COLORS.teal} />
                                </TouchableOpacity>
                                <Text style={styles.qtyText}>{item.quantity}</Text>
                                <TouchableOpacity onPress={() => updateQuantity(item._id, item.quantity + 1)} style={styles.qtyBtn} activeOpacity={0.7}>
                                    <MaterialCommunityIcons name="plus" size={16} color={COLORS.teal} />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <TouchableOpacity onPress={() => removeItem(item._id)} style={styles.removeBtn} activeOpacity={0.7}>
                            <MaterialCommunityIcons name="delete-outline" size={24} color={COLORS.danger} />
                        </TouchableOpacity>
                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="cart-outline" size={64} color={COLORS.border} />
                        <Text style={styles.emptyText}>Your cart is empty</Text>
                    </View>
                }
            />

            {cart?.items && cart.items.length > 0 && (
                <View style={styles.footer}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total Amount</Text>
                        <Text style={styles.totalValue}>LKR {calculateTotal().toLocaleString()}</Text>
                    </View>
                    <TouchableOpacity 
                        style={[styles.checkoutBtn, { backgroundColor: loading ? '#ccc' : COLORS.teal }]} 
                        onPress={() => setCheckoutVisible(true)} 
                        disabled={loading}
                        activeOpacity={0.5}
                    >
                        <Text style={styles.checkoutText}>Proceed to Payment</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Checkout Modal */}
            <Modal
                visible={checkoutVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setCheckoutVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView 
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.modalContent}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Shipping Details</Text>
                            <TouchableOpacity onPress={() => setCheckoutVisible(false)}>
                                <MaterialCommunityIcons name="close" size={24} color={COLORS.dark} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
                            <Text style={styles.label}>Receiver Details</Text>
                            <View style={styles.row}>
                                <TextInput
                                    style={[styles.input, { flex: 1, marginRight: 8 }]}
                                    placeholder="First Name *"
                                    value={shippingDetails.firstName}
                                    onChangeText={(txt) => setShippingDetails({...shippingDetails, firstName: txt})}
                                />
                                <TextInput
                                    style={[styles.input, { flex: 1 }]}
                                    placeholder="Last Name *"
                                    value={shippingDetails.lastName}
                                    onChangeText={(txt) => setShippingDetails({...shippingDetails, lastName: txt})}
                                />
                            </View>

                            <TextInput
                                style={styles.input}
                                placeholder="Email Address *"
                                keyboardType="email-address"
                                value={shippingDetails.email}
                                onChangeText={(txt) => setShippingDetails({...shippingDetails, email: txt})}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Phone Number *"
                                keyboardType="phone-pad"
                                value={shippingDetails.phone}
                                onChangeText={(txt) => setShippingDetails({...shippingDetails, phone: txt})}
                            />

                            <Text style={styles.label}>Address Details</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Full Address *"
                                value={shippingDetails.address}
                                onChangeText={(txt) => setShippingDetails({...shippingDetails, address: txt})}
                            />
                            <View style={styles.row}>
                                <TouchableOpacity
                                    style={[styles.input, styles.selectInput, { flex: 1, marginRight: 8 }]}
                                    onPress={() => openSelector('province')}
                                    activeOpacity={0.7}
                                >
                                    <Text style={shippingDetails.province ? styles.selectText : styles.selectPlaceholder}>
                                        {shippingDetails.province || 'Province *'}
                                    </Text>
                                    <MaterialCommunityIcons name="chevron-down" size={20} color={COLORS.textSub} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.input, styles.selectInput, { flex: 1 }, !matchedProvinceKey && styles.selectDisabled]}
                                    onPress={() => openSelector('city')}
                                    activeOpacity={0.7}
                                    disabled={!matchedProvinceKey}
                                >
                                    <Text style={shippingDetails.city ? styles.selectText : styles.selectPlaceholder}>
                                        {shippingDetails.city || 'City *'}
                                    </Text>
                                    <MaterialCommunityIcons name="chevron-down" size={20} color={COLORS.textSub} />
                                </TouchableOpacity>
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="Postal Code (5 digits) *"
                                value={shippingDetails.zip}
                                onChangeText={(txt) => setShippingDetails({...shippingDetails, zip: txt})}
                                keyboardType="number-pad"
                                maxLength={5}
                            />

                            <TextInput
                                style={styles.input}
                                placeholder="Country"
                                value={shippingDetails.country}
                                onChangeText={(txt) => setShippingDetails({...shippingDetails, country: txt})}
                            />

                            <Text style={styles.label}>Additional Info</Text>
                            <TextInput
                                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                                placeholder="Order Notes (Optional)"
                                multiline
                                numberOfLines={3}
                                value={shippingDetails.orderNote}
                                onChangeText={(txt) => setShippingDetails({...shippingDetails, orderNote: txt})}
                            />

                            <TouchableOpacity 
                                style={styles.submitBtn} 
                                onPress={handleCheckoutSubmit}
                            >
                                <Text style={styles.submitBtnText}>Confirm and Pay LKR {calculateTotal().toLocaleString()}</Text>
                            </TouchableOpacity>
                            <View style={{ height: 40 }} />
                        </ScrollView>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
            <Modal
                visible={selectorVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setSelectorVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.selectorCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                Select {selectorType === 'province' ? 'Province' : 'City'}
                            </Text>
                            <TouchableOpacity onPress={() => setSelectorVisible(false)}>
                                <MaterialCommunityIcons name="close" size={24} color={COLORS.dark} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.formContainer}>
                            {(selectorType === 'province' ? provinceOptions : cityOptions).map((option) => (
                                <TouchableOpacity
                                    key={option}
                                    style={styles.optionItem}
                                    onPress={() => selectOption(option)}
                                >
                                    <Text style={styles.optionText}>{option}</Text>
                                </TouchableOpacity>
                            ))}
                            {selectorType === 'city' && cityOptions.length === 0 && (
                                <Text style={styles.helperText}>Select a province first.</Text>
                            )}
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
        backgroundColor: COLORS.dark, 
        padding: 20, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between' 
    },
    headerTitle: { color: COLORS.white, fontSize: 20, fontWeight: '800' },
    listContent: { padding: 16 },
    cartItem: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row',
        marginBottom: 16,
        alignItems: 'center',
    },
    itemImage: { width: 70, height: 70, borderRadius: 8, backgroundColor: COLORS.bg },
    itemDetails: { flex: 1, marginLeft: 12 },
    itemName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
    itemPrice: { fontSize: 13, color: COLORS.textSub, marginTop: 2 },
    qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 12 },
    qtyBtn: { 
        backgroundColor: COLORS.tealLight, 
        width: 28, 
        height: 28, 
        borderRadius: 14, 
        alignItems: 'center', 
        justifyContent: 'center' 
    },
    qtyText: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
    removeBtn: { padding: 8 },
    footer: { 
        backgroundColor: COLORS.white, 
        padding: 24, 
        borderTopWidth: 1, 
        borderTopColor: COLORS.border 
    },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    totalLabel: { fontSize: 16, color: COLORS.textSub },
    totalValue: { fontSize: 20, fontWeight: '800', color: COLORS.teal },
    checkoutBtn: { 
        backgroundColor: COLORS.teal, 
        borderRadius: 12, 
        paddingVertical: 16, 
        alignItems: 'center' 
    },
    checkoutText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    emptyText: { marginTop: 12, color: COLORS.textSub, fontSize: 16 },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 20,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.dark,
    },
    formContainer: {
        paddingHorizontal: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.textSub,
        marginBottom: 10,
        marginTop: 10,
        textTransform: 'uppercase',
    },
    row: {
        flexDirection: 'row',
    },
    input: {
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 14,
        color: COLORS.textPrimary,
        marginBottom: 12,
    },
    selectInput: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectText: {
        color: COLORS.textPrimary,
        fontSize: 14,
    },
    selectPlaceholder: {
        color: COLORS.textSub,
        fontSize: 14,
    },
    selectDisabled: {
        opacity: 0.6,
    },
    selectorCard: {
        backgroundColor: COLORS.white,
        marginHorizontal: 24,
        borderRadius: 16,
        maxHeight: '60%',
        paddingTop: 10,
        paddingBottom: 16,
    },
    optionItem: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    optionText: {
        fontSize: 15,
        color: COLORS.textPrimary,
    },
    helperText: {
        color: COLORS.textSub,
        fontSize: 14,
        paddingVertical: 12,
    },
    submitBtn: {
        backgroundColor: COLORS.teal,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 20,
    },
    submitBtnText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '800',
    }
});

export default CartScreen;
