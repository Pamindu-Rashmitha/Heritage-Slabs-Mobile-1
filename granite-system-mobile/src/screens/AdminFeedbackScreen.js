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
    KeyboardAvoidingView,
    Platform,
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
};

const STATUS_OPTIONS = ['PENDING', 'ONGOING', 'RESOLVED'];
const STATUS_COLORS = {
    PENDING: { bg: '#fdf3ea', text: '#f4a261' },
    ONGOING: { bg: '#e8f5f4', text: '#2a9d8f' },
    RESOLVED: { bg: '#f0f2f5', text: '#6b7280' },
};

// ─── Chat Detail View ─────────────────────────────────────────────────────────
const TicketDetailView = ({ ticket, onBack, onRefresh }) => {
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [togglingFreeze, setTogglingFreeze] = useState(false);
    const [freezeError, setFreezeError] = useState(false);
    const flatRef = useRef(null);

    const handleSend = async () => {
        if (!text.trim()) return;
        setSending(true);
        try {
            await api.post(`/feedback/admin/${ticket._id}/reply`, { text: text.trim() });
            setText('');
            onRefresh();
        } catch (err) {
            Alert.alert('Error', 'Could not send reply.');
        } finally {
            setSending(false);
        }
    };

    const handleStatusChange = async (newStatus) => {
        setUpdatingStatus(true);
        try {
            await api.patch(`/feedback/admin/${ticket._id}/status`, { status: newStatus });
            onRefresh();
        } catch {
            Alert.alert('Error', 'Could not update status.');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleToggleFreeze = async () => {
        setTogglingFreeze(true);
        try {
            await api.patch(`/feedback/admin/${ticket._id}/freeze`);
            onRefresh();
        } catch {
            setFreezeError(true);
            setTimeout(() => setFreezeError(false), 2000);
        } finally {
            setTogglingFreeze(false);
        }
    };

    const ss = STATUS_COLORS[ticket.status] || STATUS_COLORS.PENDING;

    return (
        <View style={{ flex: 1 }}>
            {/* Header */}
            <View style={styles.chatHeader}>
                <TouchableOpacity onPress={onBack} style={styles.backBtnSmall}>
                    <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.white} />
                </TouchableOpacity>
                <View style={styles.chatHeaderText}>
                    <Text style={styles.chatSubject} numberOfLines={1}>{ticket.subject}</Text>
                    <Text style={styles.chatUser}>
                        {ticket.user?.name || '—'} · {ticket.user?.email || '—'}
                    </Text>
                </View>
                <TouchableOpacity onPress={handleToggleFreeze} disabled={togglingFreeze}>
                    {togglingFreeze ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                        <MaterialCommunityIcons
                            name={ticket.isFrozen ? 'lock-open-outline' : 'lock-outline'}
                            size={22}
                            color={ticket.isFrozen ? COLORS.teal : COLORS.warning}
                        />
                    )}
                </TouchableOpacity>
            </View>

            {/* Status selector */}
            <View style={styles.statusRow}>
                {STATUS_OPTIONS.map((s) => (
                    <TouchableOpacity
                        key={s}
                        style={[
                            styles.statusChip,
                            ticket.status === s && { backgroundColor: STATUS_COLORS[s].bg, borderColor: STATUS_COLORS[s].text },
                        ]}
                        onPress={() => ticket.status !== s && handleStatusChange(s)}
                        disabled={updatingStatus || ticket.status === s}
                    >
                        <Text
                            style={[
                                styles.statusChipText,
                                { color: ticket.status === s ? STATUS_COLORS[s].text : COLORS.textSub },
                            ]}
                        >
                            {s}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Frozen banner */}
            {ticket.isFrozen && (
                <View style={styles.frozenBanner}>
                    <MaterialCommunityIcons name="lock" size={14} color={COLORS.warning} />
                    <Text style={styles.frozenText}>Conversation is frozen — user cannot reply</Text>
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
                    const isAdmin = item.sender === 'admin';
                    return (
                        <View style={[styles.bubbleRow, isAdmin ? styles.bubbleRowRight : styles.bubbleRowLeft]}>
                            {!isAdmin && (
                                <View style={styles.userAvatar}>
                                    <MaterialCommunityIcons name="account" size={14} color={COLORS.white} />
                                </View>
                            )}
                            <View style={[styles.bubble, isAdmin ? styles.bubbleAdmin : styles.bubbleUser]}>
                                <Text style={[styles.bubbleText, isAdmin ? styles.bubbleTextAdmin : styles.bubbleTextUser]}>
                                    {item.text}
                                </Text>
                                <Text style={[styles.bubbleTime, isAdmin ? { color: 'rgba(255,255,255,0.65)' } : { color: COLORS.textSub }]}>
                                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </View>
                        </View>
                    );
                }}
                showsVerticalScrollIndicator={false}
            />

            {/* Reply bar */}
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <View style={[styles.inputBar, ticket.isFrozen && { opacity: 0.45 }]}>
                    <TextInput
                        style={styles.chatInput}
                        placeholder={ticket.isFrozen ? 'Conversation is frozen' : 'Reply to customer…'}
                        placeholderTextColor={COLORS.textSub}
                        value={text}
                        onChangeText={setText}
                        multiline
                        editable={!ticket.isFrozen}
                    />
                    <TouchableOpacity
                        style={[styles.sendBtn, (!text.trim() || sending || ticket.isFrozen) && { opacity: 0.4 }]}
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
const AdminFeedbackScreen = ({ navigation }) => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [activeTicket, setActiveTicket] = useState(null);

    // activeTicketId is passed explicitly so the callback has no stale closure over state
    const fetchTickets = useCallback(async (activeTicketId = null) => {
        try {
            const res = await api.get('/feedback/admin/all');
            setTickets(res.data);
            if (activeTicketId) {
                const updated = res.data.find((t) => t._id === activeTicketId);
                if (updated) setActiveTicket(updated);
            }
        } catch {
            Alert.alert('Error', 'Could not load tickets.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchTickets(null); }, [fetchTickets]);

    const filtered = filterStatus === 'ALL'
        ? tickets
        : tickets.filter((t) => t.status === filterStatus);

    const counts = {
        ALL: tickets.length,
        PENDING: tickets.filter((t) => t.status === 'PENDING').length,
        ONGOING: tickets.filter((t) => t.status === 'ONGOING').length,
        RESOLVED: tickets.filter((t) => t.status === 'RESOLVED').length,
    };

    if (activeTicket) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
                <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />
                <TicketDetailView
                    ticket={activeTicket}
                    onBack={() => { setActiveTicket(null); fetchTickets(); }}
                    onRefresh={() => fetchTickets(activeTicket._id)}
                />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <View style={styles.headerText}>
                    <Text style={styles.headerEyebrow}>HERITAGE SLABS</Text>
                    <Text style={styles.headerTitle}>Support Tickets</Text>
                </View>
                {counts.PENDING > 0 && (
                    <View style={styles.pendingBadge}>
                        <Text style={styles.pendingBadgeText}>{counts.PENDING}</Text>
                    </View>
                )}
            </View>

            {/* Filter tabs */}
            <View style={styles.filterRow}>
                {['ALL', 'PENDING', 'ONGOING', 'RESOLVED'].map((s) => (
                    <TouchableOpacity
                        key={s}
                        style={[styles.filterTab, filterStatus === s && styles.filterTabActive]}
                        onPress={() => setFilterStatus(s)}
                    >
                        <Text style={[styles.filterTabText, filterStatus === s && styles.filterTabTextActive]}>
                            {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
                            {counts[s] > 0 && ` (${counts[s]})`}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={COLORS.teal} />
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => {
                        const ss = STATUS_COLORS[item.status] || STATUS_COLORS.PENDING;
                        const lastMsg = item.messages[item.messages.length - 1];
                        return (
                            <TouchableOpacity
                                style={[styles.ticketCard, item.isFrozen && styles.ticketFrozen]}
                                onPress={() => setActiveTicket(item)}
                                activeOpacity={0.8}
                            >
                                <View style={styles.ticketTop}>
                                    <View style={styles.ticketUserRow}>
                                        <View style={styles.avatarCircle}>
                                            <Text style={styles.avatarLetter}>
                                                {item.user?.name?.charAt(0)?.toUpperCase() || '?'}
                                            </Text>
                                        </View>
                                        <View>
                                            <Text style={styles.ticketUserName}>{item.user?.name || '—'}</Text>
                                            <Text style={styles.ticketUserEmail}>{item.user?.email || '—'}</Text>
                                        </View>
                                    </View>
                                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                                        <View style={[styles.statusPill, { backgroundColor: ss.bg }]}>
                                            <Text style={[styles.statusPillText, { color: ss.text }]}>{item.status}</Text>
                                        </View>
                                        {item.isFrozen && (
                                            <MaterialCommunityIcons name="lock" size={14} color={COLORS.warning} />
                                        )}
                                    </View>
                                </View>

                                <Text style={styles.ticketSubject} numberOfLines={1}>{item.subject}</Text>
                                {lastMsg && (
                                    <Text style={styles.ticketLastMsg} numberOfLines={1}>
                                        {lastMsg.sender === 'admin' ? 'You: ' : 'User: '}{lastMsg.text}
                                    </Text>
                                )}
                                <View style={styles.ticketBottom}>
                                    <Text style={styles.ticketDate}>
                                        {new Date(item.updatedAt).toLocaleDateString()}
                                    </Text>
                                    <MaterialCommunityIcons name="chevron-right" size={18} color={COLORS.textSub} />
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                    refreshing={loading}
                    onRefresh={fetchTickets}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyBox}>
                            <MaterialCommunityIcons name="message-outline" size={56} color={COLORS.border} />
                            <Text style={styles.emptyText}>No tickets found</Text>
                        </View>
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
        paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24,
        flexDirection: 'row', alignItems: 'center',
        borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    },
    backBtn: {
        backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 8, marginRight: 14,
    },
    headerText: { flex: 1 },
    headerEyebrow: {
        fontSize: 11, fontWeight: '700', color: COLORS.teal, letterSpacing: 2, marginBottom: 2,
    },
    headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white },
    pendingBadge: {
        backgroundColor: COLORS.warning, borderRadius: 12,
        minWidth: 24, height: 24, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6,
    },
    pendingBadgeText: { color: COLORS.white, fontSize: 12, fontWeight: '800' },

    filterRow: {
        flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8,
    },
    filterTab: {
        paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
        backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border,
    },
    filterTabActive: { backgroundColor: COLORS.teal, borderColor: COLORS.teal },
    filterTabText: { fontSize: 12, fontWeight: '700', color: COLORS.textSub },
    filterTabTextActive: { color: COLORS.white },

    listContent: { paddingHorizontal: 16, paddingBottom: 30 },

    ticketCard: {
        backgroundColor: COLORS.white, borderRadius: 16,
        padding: 16, marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    },
    ticketFrozen: { borderLeftWidth: 4, borderLeftColor: COLORS.warning },
    ticketTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    ticketUserRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    avatarCircle: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: COLORS.tealLight,
        justifyContent: 'center', alignItems: 'center',
    },
    avatarLetter: { fontSize: 14, fontWeight: '800', color: COLORS.teal },
    ticketUserName: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
    ticketUserEmail: { fontSize: 11, color: COLORS.textSub },
    statusPill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    statusPillText: { fontSize: 11, fontWeight: '700' },

    ticketSubject: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
    ticketLastMsg: { fontSize: 12, color: COLORS.textSub, marginBottom: 8 },
    ticketBottom: { flexDirection: 'row', alignItems: 'center' },
    ticketDate: { flex: 1, fontSize: 11, color: COLORS.textSub },

    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyBox: { alignItems: 'center', marginTop: 80 },
    emptyText: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginTop: 14 },

    // Chat
    chatHeader: {
        backgroundColor: COLORS.dark,
        paddingHorizontal: 16, paddingVertical: 14,
        flexDirection: 'row', alignItems: 'center', gap: 10,
    },
    backBtnSmall: {
        backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: 7, marginRight: 4,
    },
    chatHeaderText: { flex: 1 },
    chatSubject: { fontSize: 15, fontWeight: '700', color: COLORS.white },
    chatUser: { fontSize: 11, color: '#9ca3b8', marginTop: 2 },

    statusRow: {
        flexDirection: 'row', gap: 8, padding: 12,
        backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border,
    },
    statusChip: {
        flex: 1, paddingVertical: 8, borderRadius: 10,
        alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.border,
    },
    statusChipText: { fontSize: 11, fontWeight: '700' },

    frozenBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: COLORS.warningLight, padding: 10, paddingHorizontal: 16,
    },
    frozenText: { fontSize: 12, color: COLORS.warning, fontWeight: '600' },

    chatContent: { padding: 16, paddingBottom: 8 },
    bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },
    bubbleRowRight: { justifyContent: 'flex-end' },
    bubbleRowLeft: { justifyContent: 'flex-start' },
    userAvatar: {
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: COLORS.textSub,
        justifyContent: 'center', alignItems: 'center', marginRight: 8,
    },
    bubble: { maxWidth: '75%', borderRadius: 16, padding: 12 },
    bubbleAdmin: {
        backgroundColor: COLORS.teal, borderBottomRightRadius: 4,
    },
    bubbleUser: {
        backgroundColor: COLORS.white, borderBottomLeftRadius: 4,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    },
    bubbleText: { fontSize: 14, lineHeight: 20 },
    bubbleTextAdmin: { color: COLORS.white },
    bubbleTextUser: { color: COLORS.textPrimary },
    bubbleTime: { fontSize: 10, marginTop: 4, textAlign: 'right' },

    inputBar: {
        flexDirection: 'row', alignItems: 'flex-end',
        paddingHorizontal: 16, paddingVertical: 10,
        backgroundColor: COLORS.white,
        borderTopWidth: 1, borderTopColor: COLORS.border, gap: 10,
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

export default AdminFeedbackScreen;
