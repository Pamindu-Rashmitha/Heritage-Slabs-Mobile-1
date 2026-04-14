import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Animated,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../api/axiosConfig';

const COLORS = {
    dark: '#1e2235',
    teal: '#2a9d8f',
    tealDark: '#238b7f',
    bg: '#eef1f6',
    white: '#ffffff',
    textPrimary: '#1a1d2e',
    textSub: '#6b7280',
    border: '#d8dde6',
    error: '#dc2626',
    success: '#16a34a',
    successBg: '#ecfdf3',
    cardShadow: 'rgba(15, 23, 42, 0.08)',
};

function digitsOnly(s) {
    return String(s || '').replace(/\D/g, '');
}

function formatCardDisplay(digits) {
    const d = digitsOnly(digits).slice(0, 16);
    return d.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

function formatExpiryDisplay(raw) {
    const d = digitsOnly(raw).slice(0, 4);
    if (d.length <= 2) return d;
    return `${d.slice(0, 2)}/${d.slice(2)}`;
}

function validateExpiry(mmYY) {
    const d = digitsOnly(mmYY);
    if (d.length !== 4) {
        return 'Enter expiry as MM/YY';
    }
    const mm = parseInt(d.slice(0, 2), 10);
    const yy = parseInt(d.slice(2, 4), 10);
    if (mm < 1 || mm > 12) {
        return 'Invalid month';
    }
    const now = new Date();
    const curYY = now.getFullYear() % 100;
    const curMM = now.getMonth() + 1;
    if (yy < curYY || (yy === curYY && mm < curMM)) {
        return 'Card has expired';
    }
    return null;
}

function validateForm(cardDigits, expiryRaw, cvv, nameOnCard) {
    const errors = {};

    if (cardDigits.length !== 16) {
        errors.cardNumber = 'Card number must be exactly 16 digits';
    }

    const expErr = validateExpiry(expiryRaw);
    if (expErr) errors.expiry = expErr;

    if (digitsOnly(cvv).length !== 3) {
        errors.cvv = 'CVV must be 3 digits';
    }

    if (!nameOnCard.trim()) {
        errors.nameOnCard = 'Name on card is required';
    }

    return errors;
}

const SimulatedPaymentScreen = ({ route, navigation }) => {
    const { orderId, amount } = route.params || {};
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [nameOnCard, setNameOnCard] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [step, setStep] = useState('form');
    const [transactionId, setTransactionId] = useState('');

    const checkScale = useRef(new Animated.Value(0)).current;
    const checkOpacity = useRef(new Animated.Value(0)).current;
    const ringScale = useRef(new Animated.Value(0.6)).current;

    useEffect(() => {
        if (step !== 'success') return;
        checkScale.setValue(0);
        checkOpacity.setValue(0);
        ringScale.setValue(0.6);
        Animated.parallel([
            Animated.spring(ringScale, {
                toValue: 1,
                friction: 7,
                tension: 80,
                useNativeDriver: true,
            }),
            Animated.sequence([
                Animated.delay(120),
                Animated.parallel([
                    Animated.spring(checkScale, {
                        toValue: 1,
                        friction: 6,
                        tension: 120,
                        useNativeDriver: true,
                    }),
                    Animated.timing(checkOpacity, {
                        toValue: 1,
                        duration: 280,
                        useNativeDriver: true,
                    }),
                ]),
            ]),
        ]).start();
    }, [step, checkScale, checkOpacity, ringScale]);

    const clearFieldError = (key) => {
        setFieldErrors((prev) => {
            if (!prev[key]) return prev;
            const next = { ...prev };
            delete next[key];
            return next;
        });
    };

    const onChangeCard = (text) => {
        const d = digitsOnly(text).slice(0, 16);
        setCardNumber(formatCardDisplay(d));
        clearFieldError('cardNumber');
    };

    const onChangeExpiry = (text) => {
        setExpiry(formatExpiryDisplay(text));
        clearFieldError('expiry');
    };

    const onChangeCvv = (text) => {
        setCvv(digitsOnly(text).slice(0, 3));
        clearFieldError('cvv');
    };

    const onChangeName = (text) => {
        setNameOnCard(text);
        clearFieldError('nameOnCard');
    };

    const handlePayNow = () => {
        const cardDigits = digitsOnly(cardNumber);
        const errors = validateForm(cardDigits, expiry, cvv, nameOnCard);
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) return;

        const txnId = `TXN${Date.now()}${Math.floor(Math.random() * 1e6)
            .toString()
            .padStart(6, '0')}`;

        setStep('processing');
        setTimeout(async () => {
            try {
                await api.post(`/orders/${orderId}/simulate-payment`, {
                    transactionId: txnId,
                });
                setTransactionId(txnId);
                setStep('success');
            } catch (error) {
                setStep('form');
                const msg = error.response?.data?.message || error.message || 'Could not complete payment';
                Alert.alert('Payment failed', msg);
            }
        }, 2000);
    };

    const amountNum = typeof amount === 'number' ? amount : Number(amount) || 0;
    const amountLabel = `LKR ${amountNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    if (!orderId) {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.centered}>
                    <Text style={styles.missingParams}>Missing order information.</Text>
                    <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.goBack()}>
                        <Text style={styles.primaryBtnText}>Go back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (step === 'processing') {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.processingWrap}>
                    <View style={styles.processingCard}>
                        <ActivityIndicator size="large" color={COLORS.teal} />
                        <Text style={styles.processingTitle}>Processing payment</Text>
                        <Text style={styles.processingSub}>Please wait — do not close this screen.</Text>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    if (step === 'success') {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.successWrap}>
                    <Animated.View
                        style={[
                            styles.successRing,
                            {
                                opacity: checkOpacity,
                                transform: [{ scale: ringScale }],
                            },
                        ]}
                    >
                        <Animated.View
                            style={[
                                styles.successInner,
                                {
                                    opacity: checkOpacity,
                                    transform: [{ scale: checkScale }],
                                },
                            ]}
                        >
                            <MaterialCommunityIcons name="check" size={56} color={COLORS.white} />
                        </Animated.View>
                    </Animated.View>
                    <Text style={styles.successTitle}>Payment Successful!</Text>
                    <Text style={styles.successAmount}>{amountLabel}</Text>
                    <View style={styles.txnBox}>
                        <Text style={styles.txnLabel}>Transaction ID</Text>
                        <Text style={styles.txnValue} selectable>
                            {transactionId}
                        </Text>
                    </View>
                    <Text style={styles.successHint}>A confirmation has been sent to your order email.</Text>
                    <TouchableOpacity
                        style={styles.primaryBtn}
                        onPress={() => navigation.navigate('CustomerCatalog', { paymentSuccess: true })}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.primaryBtnText}>Back to Home</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
            >
                <View style={styles.topBar}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backHit} hitSlop={12}>
                        <MaterialCommunityIcons name="chevron-left" size={28} color={COLORS.dark} />
                    </TouchableOpacity>
                    <Text style={styles.topTitle}>Secure checkout</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.amountBanner}>
                        <Text style={styles.amountLabel}>Amount due</Text>
                        <Text style={styles.amountValue}>{amountLabel}</Text>
                    </View>

                    <View style={styles.cardPanel}>
                        <View style={styles.panelHeader}>
                            <MaterialCommunityIcons name="credit-card-outline" size={22} color={COLORS.teal} />
                            <Text style={styles.panelTitle}>Card details</Text>
                        </View>
                        <Text style={styles.inputLabel}>Card number</Text>
                        <TextInput
                            style={[styles.input, fieldErrors.cardNumber && styles.inputError]}
                            placeholder="0000 0000 0000 0000"
                            placeholderTextColor={COLORS.textSub}
                            keyboardType="number-pad"
                            value={cardNumber}
                            onChangeText={onChangeCard}
                            maxLength={19}
                            autoComplete="cc-number"
                        />
                        {fieldErrors.cardNumber ? <Text style={styles.errorText}>{fieldErrors.cardNumber}</Text> : null}

                        <View style={styles.rowGap}>
                            <View style={styles.expiryCol}>
                                <Text style={styles.inputLabel}>Expiry</Text>
                                <TextInput
                                    style={[styles.input, fieldErrors.expiry && styles.inputError]}
                                    placeholder="MM/YY"
                                    placeholderTextColor={COLORS.textSub}
                                    keyboardType="number-pad"
                                    value={expiry}
                                    onChangeText={onChangeExpiry}
                                    maxLength={5}
                                    autoComplete="cc-exp"
                                />
                                {fieldErrors.expiry ? <Text style={styles.errorText}>{fieldErrors.expiry}</Text> : null}
                            </View>
                            <View style={styles.cvvCol}>
                                <Text style={styles.inputLabel}>CVV</Text>
                                <TextInput
                                    style={[styles.input, fieldErrors.cvv && styles.inputError]}
                                    placeholder="•••"
                                    placeholderTextColor={COLORS.textSub}
                                    keyboardType="number-pad"
                                    value={cvv}
                                    onChangeText={onChangeCvv}
                                    maxLength={3}
                                    secureTextEntry
                                    autoComplete="cc-csc"
                                />
                                {fieldErrors.cvv ? <Text style={styles.errorText}>{fieldErrors.cvv}</Text> : null}
                            </View>
                        </View>

                        <Text style={styles.inputLabel}>Name on card</Text>
                        <TextInput
                            style={[styles.input, fieldErrors.nameOnCard && styles.inputError]}
                            placeholder="As shown on card"
                            placeholderTextColor={COLORS.textSub}
                            value={nameOnCard}
                            onChangeText={onChangeName}
                            autoCapitalize="words"
                            autoComplete="name"
                        />
                        {fieldErrors.nameOnCard ? <Text style={styles.errorText}>{fieldErrors.nameOnCard}</Text> : null}

                        <View style={styles.lockRow}>
                            <MaterialCommunityIcons name="lock-outline" size={18} color={COLORS.textSub} />
                            <Text style={styles.lockText}>Your details are encrypted for this demo checkout.</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.payBtn} onPress={handlePayNow} activeOpacity={0.9}>
                        <Text style={styles.payBtnText}>Pay now</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.bg },
    flex: { flex: 1 },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingVertical: 8,
        backgroundColor: COLORS.bg,
    },
    backHit: { padding: 8 },
    topTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 32 },
    amountBanner: {
        backgroundColor: COLORS.dark,
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: COLORS.cardShadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 20,
        elevation: 6,
    },
    amountLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },
    amountValue: { color: COLORS.white, fontSize: 26, fontWeight: '800', marginTop: 6 },
    cardPanel: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: COLORS.cardShadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 16,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(216, 221, 230, 0.6)',
    },
    panelHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
    panelTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
    inputLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textSub, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 },
    input: {
        backgroundColor: '#f8fafc',
        borderWidth: 1.5,
        borderColor: COLORS.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    inputError: { borderColor: COLORS.error, backgroundColor: '#fef2f2' },
    errorText: { color: COLORS.error, fontSize: 13, marginBottom: 12, marginTop: 2 },
    rowGap: { flexDirection: 'row', gap: 14 },
    expiryCol: { flex: 1.2 },
    cvvCol: { flex: 0.9 },
    lockRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
    lockText: { flex: 1, fontSize: 12, color: COLORS.textSub, lineHeight: 18 },
    payBtn: {
        backgroundColor: COLORS.teal,
        borderRadius: 14,
        paddingVertical: 17,
        alignItems: 'center',
        shadowColor: COLORS.tealDark,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 6,
    },
    payBtnText: { color: COLORS.white, fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },
    processingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    processingCard: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 40,
        alignItems: 'center',
        minWidth: '86%',
        shadowColor: COLORS.cardShadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 24,
        elevation: 8,
    },
    processingTitle: { marginTop: 20, fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
    processingSub: { marginTop: 8, fontSize: 14, color: COLORS.textSub, textAlign: 'center' },
    successWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 28,
    },
    successRing: {
        width: 112,
        height: 112,
        borderRadius: 56,
        backgroundColor: COLORS.successBg,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 28,
    },
    successInner: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: COLORS.success,
        alignItems: 'center',
        justifyContent: 'center',
    },
    successTitle: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 8 },
    successAmount: { fontSize: 20, fontWeight: '700', color: COLORS.teal, marginBottom: 24 },
    txnBox: {
        width: '100%',
        backgroundColor: COLORS.white,
        borderRadius: 14,
        padding: 18,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 16,
    },
    txnLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textSub, textTransform: 'uppercase', letterSpacing: 0.5 },
    txnValue: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginTop: 8, letterSpacing: 0.5 },
    successHint: { fontSize: 13, color: COLORS.textSub, textAlign: 'center', marginBottom: 28, lineHeight: 20 },
    primaryBtn: {
        backgroundColor: COLORS.dark,
        borderRadius: 14,
        paddingVertical: 16,
        paddingHorizontal: 48,
        minWidth: '100%',
        alignItems: 'center',
    },
    primaryBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    missingParams: { fontSize: 16, color: COLORS.textSub, marginBottom: 20, textAlign: 'center' },
});

export default SimulatedPaymentScreen;
