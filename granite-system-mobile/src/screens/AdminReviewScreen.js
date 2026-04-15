import React, { useState, useEffect, useCallback } from 'react';
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
    star: '#f4a261',
    danger: '#e63946',
    dangerLight: '#fceaea',
    warning: '#f4a261',
    warningLight: '#fdf3ea',
};

const Stars = ({ rating }) => (
    <View style={{ flexDirection: 'row', gap: 2 }}>
        {[1, 2, 3, 4, 5].map((s) => (
            <MaterialCommunityIcons
                key={s}
                name={s <= rating ? 'star' : 'star-outline'}
                size={14}
                color={COLORS.star}
            />
        ))}
    </View>
);

// ─── Reply modal ──────────────────────────────────────────────────────────────
const ReplyModal = ({ visible, review, onClose, onSave }) => {
    const [text, setText] = useState('');
    const [saving, setSaving] = useState(false);
    const [replyError, setReplyError] = useState('');

    useEffect(() => {
        if (review) { setText(review.adminReply || ''); setReplyError(''); }
    }, [review]);

    const handleSave = async () => {
        if (!text.trim()) {
            setReplyError('Reply cannot be empty.');
            return;
        }
        setReplyError('');
        setSaving(true);
        try {
            await api.put(`/reviews/admin/${review._id}/reply`, { reply: text.trim() });
            onSave();
            onClose();
        } catch (err) {
            setReplyError('Could not save reply. Try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalCard}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Edit Admin Reply</Text>
                        <TouchableOpacity onPress={onClose}>
                            <MaterialCommunityIcons name="close" size={22} color={COLORS.textSub} />
                        </TouchableOpacity>
                    </View>

                    {review && (
                        <View style={styles.modalReviewSnippet}>
                            <Stars rating={review.rating} />
                            <Text style={styles.modalSnippetTitle}>{review.title}</Text>
                            <Text style={styles.modalSnippetComment} numberOfLines={2}>{review.comment}</Text>
                        </View>
                    )}

                    <TextInput
                        style={[styles.modalInput, replyError ? { borderColor: COLORS.danger } : {}]}
                        value={text}
                        onChangeText={(v) => { setText(v); if (replyError) setReplyError(''); }}
                        multiline
                        numberOfLines={5}
                        placeholder="Type your reply…"
                        placeholderTextColor={COLORS.textSub}
                        textAlignVertical="top"
                    />
                    {replyError ? <Text style={styles.inlineError}>{replyError}</Text> : null}

                    <TouchableOpacity
                        style={[styles.modalSaveBtn, saving && { opacity: 0.6 }]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator color={COLORS.white} />
                        ) : (
                            <>
                                <MaterialCommunityIcons name="content-save" size={16} color={COLORS.white} />
                                <Text style={styles.modalSaveBtnText}>Save Reply</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

// ─── Review Card ──────────────────────────────────────────────────────────────
const ReviewCard = ({ review, onFlag, onDelete, onReply }) => (
    <View style={[styles.card, review.isFlagged && styles.cardFlagged]}>
        {/* Top */}
        <View style={styles.cardTop}>
            <View style={styles.avatarCircle}>
                <Text style={styles.avatarLetter}>
                    {review.user?.name?.charAt(0)?.toUpperCase() || '?'}
                </Text>
            </View>
            <View style={styles.cardMeta}>
                <Text style={styles.reviewerName}>{review.user?.name || '—'}</Text>
                <Text style={styles.reviewerEmail}>{review.user?.email || '—'}</Text>
                <Text style={styles.reviewProduct}>{review.product?.stoneName || '—'}</Text>
            </View>
            <View style={styles.cardRight}>
                <Stars rating={review.rating} />
                <Text style={styles.reviewDate}>
                    {new Date(review.createdAt).toLocaleDateString()}
                </Text>
            </View>
        </View>

        {/* Content */}
        <Text style={styles.reviewTitle}>{review.title}</Text>
        <Text style={styles.reviewComment}>{review.comment}</Text>

        {/* Current reply */}
        {review.adminReply ? (
            <View style={styles.replyBox}>
                <View style={styles.replyHeader}>
                    <MaterialCommunityIcons name="shield-account" size={13} color={COLORS.teal} />
                    <Text style={styles.replyLabel}>Admin Reply</Text>
                </View>
                <Text style={styles.replyText} numberOfLines={3}>{review.adminReply}</Text>
            </View>
        ) : null}

        {/* Action buttons */}
        <View style={styles.actionRow}>
            <TouchableOpacity
                style={[styles.actionBtn, styles.replyBtn]}
                onPress={() => onReply(review)}
                activeOpacity={0.8}
            >
                <MaterialCommunityIcons name="reply" size={15} color={COLORS.teal} />
                <Text style={[styles.actionBtnText, { color: COLORS.teal }]}>
                    {review.adminReply ? 'Edit Reply' : 'Reply'}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.actionBtn, review.isFlagged ? styles.unflagBtn : styles.flagBtn]}
                onPress={() => onFlag(review._id)}
                activeOpacity={0.8}
            >
                <MaterialCommunityIcons
                    name={review.isFlagged ? 'flag' : 'flag-outline'}
                    size={15}
                    color={COLORS.warning}
                />
                <Text style={[styles.actionBtnText, { color: COLORS.warning }]}>
                    {review.isFlagged ? 'Unflag' : 'Flag'}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.actionBtn, styles.deleteBtn]}
                onPress={() => onDelete(review._id)}
                activeOpacity={0.8}
            >
                <MaterialCommunityIcons name="delete-outline" size={15} color={COLORS.danger} />
                <Text style={[styles.actionBtnText, { color: COLORS.danger }]}>Delete</Text>
            </TouchableOpacity>
        </View>
    </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
const AdminReviewScreen = ({ navigation }) => {
    const [allReviews, setAllReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFlagged, setShowFlagged] = useState(false);
    const [replyTarget, setReplyTarget] = useState(null);
    const [deleteError, setDeleteError] = useState(null);

    // Always fetch ALL reviews — filter client-side so both counts are always accurate
    const fetchReviews = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/reviews/admin/all');
            setAllReviews(res.data);
        } catch (err) {
            Alert.alert('Error', 'Could not load reviews.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchReviews(); }, [fetchReviews]);

    const handleFlag = async (id) => {
        try {
            await api.patch(`/reviews/admin/${id}/flag`);
            fetchReviews();
        } catch {
            Alert.alert('Error', 'Could not update flag.');
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/reviews/admin/${id}`);
            fetchReviews();
        } catch {
            setDeleteError(id);
            setTimeout(() => setDeleteError(null), 2000);
        }
    };

    const reviews = showFlagged ? allReviews.filter((r) => r.isFlagged) : allReviews;
    const allCount = allReviews.length;
    const flaggedCount = allReviews.filter((r) => r.isFlagged).length;

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <View style={styles.headerText}>
                    <Text style={styles.headerEyebrow}>HERITAGE SLABS</Text>
                    <Text style={styles.headerTitle}>Customer Reviews</Text>
                </View>
                {flaggedCount > 0 && (
                    <View style={styles.flagBadge}>
                        <Text style={styles.flagBadgeText}>{flaggedCount}</Text>
                    </View>
                )}
            </View>

            {/* Filter Tabs */}
            <View style={styles.tabRow}>
                <TouchableOpacity
                    style={[styles.tab, !showFlagged && styles.tabActive]}
                    onPress={() => setShowFlagged(false)}
                >
                    <Text style={[styles.tabText, !showFlagged && styles.tabTextActive]}>
                        All Reviews{allCount > 0 ? ` (${allCount})` : ''}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, showFlagged && styles.tabActive]}
                    onPress={() => setShowFlagged(true)}
                >
                    <MaterialCommunityIcons
                        name="flag"
                        size={14}
                        color={showFlagged ? COLORS.white : COLORS.textSub}
                    />
                    <Text style={[styles.tabText, showFlagged && styles.tabTextActive]}>
                        Flagged{flaggedCount > 0 ? ` (${flaggedCount})` : ''}
                    </Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={COLORS.teal} />
                </View>
            ) : (
                <FlatList
                    data={reviews}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => (
                        <ReviewCard
                            review={item}
                            onFlag={handleFlag}
                            onDelete={handleDelete}
                            onReply={setReplyTarget}
                        />
                    )}
                    refreshing={loading}
                    onRefresh={fetchReviews}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyBox}>
                            <MaterialCommunityIcons name="star-outline" size={56} color={COLORS.border} />
                            <Text style={styles.emptyText}>
                                {showFlagged ? 'No flagged reviews' : 'No reviews yet'}
                            </Text>
                        </View>
                    }
                />
            )}

            <ReplyModal
                visible={!!replyTarget}
                review={replyTarget}
                onClose={() => setReplyTarget(null)}
                onSave={fetchReviews}
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
    flagBadge: {
        backgroundColor: COLORS.danger,
        borderRadius: 12,
        minWidth: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    flagBadgeText: { color: COLORS.white, fontSize: 12, fontWeight: '800' },

    tabRow: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        margin: 16,
        borderRadius: 12,
        padding: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        paddingVertical: 10,
        borderRadius: 10,
    },
    tabActive: { backgroundColor: COLORS.teal },
    tabText: { fontSize: 13, fontWeight: '700', color: COLORS.textSub },
    tabTextActive: { color: COLORS.white },

    listContent: { paddingHorizontal: 16, paddingBottom: 30 },

    card: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    cardFlagged: { borderLeftWidth: 4, borderLeftColor: COLORS.warning },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
    avatarCircle: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: COLORS.tealLight,
        justifyContent: 'center', alignItems: 'center', marginRight: 10,
    },
    avatarLetter: { fontSize: 16, fontWeight: '800', color: COLORS.teal },
    cardMeta: { flex: 1 },
    reviewerName: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
    reviewerEmail: { fontSize: 11, color: COLORS.textSub, marginTop: 1 },
    reviewProduct: {
        fontSize: 11, color: COLORS.teal, fontWeight: '600', marginTop: 2,
    },
    cardRight: { alignItems: 'flex-end', gap: 3 },
    reviewDate: { fontSize: 11, color: COLORS.textSub },

    reviewTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
    reviewComment: { fontSize: 13, color: COLORS.textSub, lineHeight: 19 },

    replyBox: {
        marginTop: 10,
        backgroundColor: COLORS.tealLight,
        borderRadius: 10,
        padding: 10,
        borderLeftWidth: 3,
        borderLeftColor: COLORS.teal,
    },
    replyHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 },
    replyLabel: { fontSize: 11, fontWeight: '700', color: COLORS.teal },
    replyText: { fontSize: 12, color: COLORS.textPrimary, lineHeight: 17 },

    actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1.5,
    },
    actionBtnText: { fontSize: 12, fontWeight: '700' },
    replyBtn: { borderColor: COLORS.teal, backgroundColor: COLORS.tealLight },
    flagBtn: { borderColor: COLORS.warning, backgroundColor: COLORS.warningLight },
    unflagBtn: { borderColor: COLORS.warning, backgroundColor: COLORS.warningLight },
    deleteBtn: { borderColor: COLORS.danger, backgroundColor: COLORS.dangerLight },

    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyBox: { alignItems: 'center', marginTop: 80 },
    emptyText: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginTop: 14 },

    // Modal
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'flex-end',
    },
    modalCard: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 34,
    },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 16,
    },
    modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
    modalReviewSnippet: {
        backgroundColor: COLORS.bg, borderRadius: 10, padding: 12, marginBottom: 14, gap: 4,
    },
    modalSnippetTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
    modalSnippetComment: { fontSize: 12, color: COLORS.textSub },
    modalInput: {
        backgroundColor: COLORS.bg, borderRadius: 12,
        borderWidth: 1.5, borderColor: COLORS.border,
        paddingHorizontal: 16, paddingVertical: 12,
        fontSize: 14, color: COLORS.textPrimary,
        height: 120, marginBottom: 16, textAlignVertical: 'top',
    },
    modalSaveBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, backgroundColor: COLORS.teal, borderRadius: 12, paddingVertical: 14,
    },
    modalSaveBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '800' },
    inlineError: { color: COLORS.danger, fontSize: 12, fontWeight: '600', marginBottom: 10, marginTop: -10 },
});

export default AdminReviewScreen;
