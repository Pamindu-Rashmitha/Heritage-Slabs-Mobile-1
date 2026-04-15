import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    StatusBar,
    Modal,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
    dangerLight: '#fceaea',
    warning: '#f4a261',
    warningLight: '#fdf3ea',
    adminBubble: '#1e2235',
    userBubble: '#2a9d8f',
};

const STATUS_COLORS = {
    PENDING: { bg: '#fdf3ea', text: '#f4a261' },
    ONGOING: { bg: '#e8f5f4', text: '#2a9d8f' },
    RESOLVED: { bg: '#f0f2f5', text: '#6b7280' },
};

// ─── New Ticket Modal ─────────────────────────────────────────────────────────
const NewTicketModal = ({ visible, onClose, onCreated }) => {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [attempted, setAttempted] = useState(false);

    const hasLetter = (str) => /[a-zA-Z]/.test(str);

    const validate = (fields = {}) => {
        const s = fields.subject !== undefined ? fields.subject : subject;
        const m = fields.message !== undefined ? fields.message : message;
        const errs = {};
        if (!s.trim()) {
            errs.subject = 'Subject is required.';
        } else if (!hasLetter(s)) {
            errs.subject = 'Subject must contain at least one letter.';
        } else if (s.trim().length < 3) {
            errs.subject = 'Subject must be at least 3 characters.';
        }
        if (!m.trim()) {
            errs.message = 'Message is required.';
        } else if (m.trim().length < 5) {
            errs.message = 'Message must be at least 5 characters.';
        }
        return errs;
    };

    const handleSubjectChange = (val) => {
        setSubject(val);
        if (attempted) setErrors(validate({ subject: val }));
    };

    const handleMessageChange = (val) => {
        setMessage(val);
        if (attempted) setErrors(validate({ message: val }));
    };

    const handleClose = () => {
        setSubject('');
        setMessage('');
        setErrors({});
        setAttempted(false);
        onClose();
    };

    const handleSubmit = async () => {
        setAttempted(true);
        const errs = validate();
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;

        setSubmitting(true);
        try {
            await api.post('/feedback', { subject: subject.trim(), message: message.trim() });
            setSubject('');
            setMessage('');
            setErrors({});
            setAttempted(false);
            onCreated();
            onClose();
        } catch (err) {
            setErrors({ server: err.response?.data?.message || 'Could not create ticket.' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>New Support Ticket</Text>
                            <TouchableOpacity onPress={handleClose}>
                                <MaterialCommunityIcons name="close" size={22} color={COLORS.textSub} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.fieldLabel}>Subject</Text>
                        <TextInput
                            style={[styles.input, errors.subject && styles.inputError]}
                            placeholder="What is this about?"
                            placeholderTextColor={COLORS.textSub}
                            value={subject}
                            onChangeText={handleSubjectChange}
                            maxLength={120}
                        />
                        {errors.subject ? <Text style={styles.fieldError}>{errors.subject}</Text> : null}

                        <Text style={styles.fieldLabel}>Message</Text>
                        <TextInput
                            style={[styles.input, styles.textArea, errors.message && styles.inputError]}
                            placeholder="Describe your issue or question…"
                            placeholderTextColor={COLORS.textSub}
                            value={message}
                            onChangeText={handleMessageChange}
                            multiline
                            numberOfLines={5}
                            textAlignVertical="top"
                        />
                        {errors.message ? <Text style={styles.fieldError}>{errors.message}</Text> : null}

                        {errors.server ? (
                            <View style={styles.serverErrorBox}>
                                <Text style={styles.fieldError}>{errors.server}</Text>
                            </View>
                        ) : null}

                        <TouchableOpacity
                            style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                            onPress={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator color={COLORS.white} />
                            ) : (
                                <>
                                    <MaterialCommunityIcons name="send" size={16} color={COLORS.white} />
                                    <Text style={styles.submitBtnText}>Submit Ticket</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

// ─── Chat View ────────────────────────────────────────────────────────────────
const ChatView = ({ ticket, onBack, onRefresh }) => {
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const flatRef = useRef(null);

    const handleSend = async () => {
        if (!text.trim()) return;
        if (ticket.isFrozen) {
            Alert.alert(
                'Conversation Closed',
                'This ticket has been closed by the admin. Please open a new ticket.',
                [{ text: 'OK' }]
            );
            return;
        }
        setSending(true);
        try {
            await api.post(`/feedback/${ticket._id}/message`, { text: text.trim() });
            setText('');
            onRefresh();
        } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Could not send message.');
        } finally {
            setSending(false);
        }
    };

    const statusStyle = STATUS_COLORS[ticket.status] || STATUS_COLORS.PENDING;

    return (
        <View style={{ flex: 1 }}>
            {/* Chat header */}
            <View style={styles.chatHeader}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.white} />
                </TouchableOpacity>
                <View style={styles.chatHeaderText}>
                    <Text style={styles.chatSubject} numberOfLines={1}>{ticket.subject}</Text>
                    <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
                        <Text style={[styles.statusPillText, { color: statusStyle.text }]}>
                            {ticket.status}
                        </Text>
                    </View>
                </View>
                {ticket.isFrozen && (
                    <MaterialCommunityIcons name="lock" size={20} color={COLORS.warning} />
                )}
            </View>

            {/* Frozen banner */}
            {ticket.isFrozen && (
                <View style={styles.frozenBanner}>
                    <MaterialCommunityIcons name="lock-outline" size={15} color={COLORS.warning} />
                    <Text style={styles.frozenText}>
                        This conversation has been closed. Open a new ticket to continue.
                    </Text>
                </View>
            )}

            {/* Messages */}
            <FlatList
                ref={flatRef}
                data={ticket.messages}
                keyExtractor={(_, i) => String(i)}
                contentContainerStyle={styles.chatContent}
                onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
                renderItem={({ item }) => {
                    const isUser = item.sender === 'user';
                    return (
                        <View style={[styles.bubbleRow, isUser ? styles.bubbleRowRight : styles.bubbleRowLeft]}>
                            {!isUser && (
                                <View style={styles.adminAvatar}>
                                    <MaterialCommunityIcons name="shield-account" size={16} color={COLORS.white} />
                                </View>
                            )}
                            <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAdmin]}>
                                <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAdmin]}>
                                    {item.text}
                                </Text>
                                <Text style={[styles.bubbleTime, isUser ? { color: 'rgba(255,255,255,0.65)' } : { color: COLORS.textSub }]}>
                                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </View>
                        </View>
                    );
                }}
                showsVerticalScrollIndicator={false}
            />

            {/* Input bar */}
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <View style={[styles.inputBar, ticket.isFrozen && { opacity: 0.5 }]}>
                    <TextInput
                        style={styles.chatInput}
                        placeholder={ticket.isFrozen ? 'Conversation closed' : 'Type a message…'}
                        placeholderTextColor={COLORS.textSub}
                        value={text}
                        onChangeText={setText}
                        editable={!ticket.isFrozen}
                        multiline
                    />
                    <TouchableOpacity
                        style={[styles.sendBtn, (!text.trim() || sending) && { opacity: 0.4 }]}
                        onPress={handleSend}
                        disabled={!text.trim() || sending || ticket.isFrozen}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color={COLORS.white} />
                        ) : (
                            <MaterialCommunityIcons name="send" size={20} color={COLORS.white} />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const FeedbackScreen = ({ navigation }) => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNew, setShowNew] = useState(false);
    const [activeTicket, setActiveTicket] = useState(null);

    // activeTicketId passed explicitly — no stale closure over state
    const fetchTickets = useCallback(async (activeTicketId = null) => {
        try {
            const res = await api.get('/feedback/mine');
            setTickets(res.data);
            if (activeTicketId) {
                const updated = res.data.find((t) => t._id === activeTicketId);
                if (updated) setActiveTicket(updated);
            }
        } catch (err) {
            Alert.alert('Error', 'Could not load tickets.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchTickets(null); }, [fetchTickets]);

    const statusStyle = (status) => STATUS_COLORS[status] || STATUS_COLORS.PENDING;

    if (activeTicket) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
                <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />
                <ChatView
                    ticket={activeTicket}
                    onBack={() => { setActiveTicket(null); fetchTickets(null); }}
                    onRefresh={() => fetchTickets(activeTicket._id)}
                />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <View style={styles.headerText}>
                    <Text style={styles.headerEyebrow}>HERITAGE SLABS</Text>
                    <Text style={styles.headerTitle}>Support</Text>
                </View>
                <TouchableOpacity
                    style={styles.newTicketBtn}
                    onPress={() => setShowNew(true)}
                >
                    <MaterialCommunityIcons name="plus" size={20} color={COLORS.white} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={COLORS.teal} />
                </View>
            ) : (
                <FlatList
                    data={tickets}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => {
                        const ss = statusStyle(item.status);
                        const lastMsg = item.messages[item.messages.length - 1];
                        return (
                            <TouchableOpacity
                                style={[styles.ticketCard, item.isFrozen && styles.ticketFrozen]}
                                onPress={() => setActiveTicket(item)}
                                activeOpacity={0.8}
                            >
                                <View style={styles.ticketTop}>
                                    <Text style={styles.ticketSubject} numberOfLines={1}>{item.subject}</Text>
                                    <View style={[styles.statusPill, { backgroundColor: ss.bg }]}>
                                        <Text style={[styles.statusPillText, { color: ss.text }]}>{item.status}</Text>
                                    </View>
                                </View>
                                {lastMsg && (
                                    <Text style={styles.ticketLastMsg} numberOfLines={1}>
                                        {lastMsg.sender === 'admin' ? 'Admin: ' : 'You: '}{lastMsg.text}
                                    </Text>
                                )}
                                <View style={styles.ticketBottom}>
                                    <Text style={styles.ticketDate}>
                                        {new Date(item.updatedAt).toLocaleDateString()}
                                    </Text>
                                    {item.isFrozen && (
                                        <View style={styles.frozenChip}>
                                            <MaterialCommunityIcons name="lock" size={11} color={COLORS.warning} />
                                            <Text style={styles.frozenChipText}>Closed</Text>
                                        </View>
                                    )}
                                    <MaterialCommunityIcons name="chevron-right" size={18} color={COLORS.textSub} />
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                    refreshing={loading}
                    onRefresh={() => fetchTickets(null)}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyBox}>
                            <MaterialCommunityIcons name="message-outline" size={56} color={COLORS.border} />
                            <Text style={styles.emptyText}>No support tickets yet</Text>
                            <TouchableOpacity style={styles.emptyNewBtn} onPress={() => setShowNew(true)}>
                                <Text style={styles.emptyNewBtnText}>Create a ticket</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}

            <NewTicketModal
                visible={showNew}
                onClose={() => setShowNew(false)}
                onCreated={() => fetchTickets(null)}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },

    header: {
        backgroundColor: COLORS.dark,
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 24,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    backBtn: {
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 12,
        padding: 8,
        marginRight: 14,
    },
    headerText: { flex: 1 },
    headerEyebrow: {
        fontSize: 11, fontWeight: '700', color: COLORS.teal, letterSpacing: 2, marginBottom: 2,
    },
    headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white },
    newTicketBtn: {
        backgroundColor: COLORS.teal,
        borderRadius: 12,
        padding: 10,
    },

    listContent: { padding: 16, paddingBottom: 30 },

    ticketCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    ticketFrozen: { borderLeftWidth: 4, borderLeftColor: COLORS.warning },
    ticketTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
    ticketSubject: { flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginRight: 8 },
    ticketLastMsg: { fontSize: 13, color: COLORS.textSub, marginBottom: 8 },
    ticketBottom: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    ticketDate: { flex: 1, fontSize: 11, color: COLORS.textSub },
    frozenChip: {
        flexDirection: 'row', alignItems: 'center', gap: 3,
        backgroundColor: COLORS.warningLight, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
    },
    frozenChipText: { fontSize: 10, fontWeight: '700', color: COLORS.warning },

    statusPill: {
        borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
    },
    statusPillText: { fontSize: 11, fontWeight: '700' },

    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyBox: { alignItems: 'center', marginTop: 80 },
    emptyText: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginTop: 14, marginBottom: 16 },
    emptyNewBtn: {
        backgroundColor: COLORS.teal, borderRadius: 12,
        paddingHorizontal: 24, paddingVertical: 12,
    },
    emptyNewBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },

    // Modal
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end',
    },
    modalCard: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: 24, paddingBottom: 34,
    },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 20,
    },
    modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
    fieldLabel: {
        fontSize: 12, fontWeight: '700', color: COLORS.textSub,
        textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6,
    },
    input: {
        backgroundColor: COLORS.bg,
        borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border,
        paddingHorizontal: 16, paddingVertical: 12,
        fontSize: 15, color: COLORS.textPrimary, marginBottom: 14,
    },
    textArea: { height: 110, textAlignVertical: 'top', paddingTop: 12 },
    submitBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, backgroundColor: COLORS.teal, borderRadius: 12, paddingVertical: 14,
    },
    submitBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '800' },
    inputError: { borderColor: COLORS.danger },
    fieldError: { color: COLORS.danger, fontSize: 12, fontWeight: '600', marginTop: -10, marginBottom: 10 },
    serverErrorBox: { backgroundColor: COLORS.dangerLight, borderRadius: 10, padding: 10, marginBottom: 10 },

    // Chat
    chatHeader: {
        backgroundColor: COLORS.dark,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    chatHeaderText: { flex: 1, gap: 4 },
    chatSubject: { fontSize: 15, fontWeight: '700', color: COLORS.white },

    frozenBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: COLORS.warningLight,
        padding: 12, paddingHorizontal: 16,
    },
    frozenText: { flex: 1, fontSize: 12, color: COLORS.warning, fontWeight: '600' },

    chatContent: { padding: 16, paddingBottom: 8 },
    bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },
    bubbleRowRight: { justifyContent: 'flex-end' },
    bubbleRowLeft: { justifyContent: 'flex-start' },
    adminAvatar: {
        width: 30, height: 30, borderRadius: 15,
        backgroundColor: COLORS.dark, justifyContent: 'center', alignItems: 'center',
        marginRight: 8,
    },
    bubble: {
        maxWidth: '75%', borderRadius: 16, padding: 12,
    },
    bubbleUser: {
        backgroundColor: COLORS.teal,
        borderBottomRightRadius: 4,
    },
    bubbleAdmin: {
        backgroundColor: COLORS.white,
        borderBottomLeftRadius: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    bubbleText: { fontSize: 14, lineHeight: 20 },
    bubbleTextUser: { color: COLORS.white },
    bubbleTextAdmin: { color: COLORS.textPrimary },
    bubbleTime: { fontSize: 10, marginTop: 4, textAlign: 'right' },

    inputBar: {
        flexDirection: 'row', alignItems: 'flex-end',
        paddingHorizontal: 16, paddingVertical: 10,
        backgroundColor: COLORS.white,
        borderTopWidth: 1, borderTopColor: COLORS.border,
        gap: 10,
    },
    chatInput: {
        flex: 1, backgroundColor: COLORS.bg,
        borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
        fontSize: 14, color: COLORS.textPrimary, maxHeight: 100,
    },
    sendBtn: {
        width: 42, height: 42, borderRadius: 21,
        backgroundColor: COLORS.teal,
        justifyContent: 'center', alignItems: 'center',
    },
});

export default FeedbackScreen;
