import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/axiosConfig';

// Decode JWT payload without a library (works on web & RN)
const decodeToken = (token) => {
    try {
        const payload = token.split('.')[1];
        const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(decoded);
    } catch {
        return null;
    }
};

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
    amber: '#f4a261',
    danger: '#e63946',
};

const Stars = ({ rating }) => (
    <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((s) => (
            <MaterialCommunityIcons
                key={s}
                name={s <= rating ? 'star' : 'star-outline'}
                size={16}
                color={COLORS.star}
            />
        ))}
    </View>
);

const ReviewCard = ({ review }) => (
    <View style={styles.card}>
        {/* Top row */}
        <View style={styles.cardTop}>
            <View style={styles.avatarCircle}>
                <Text style={styles.avatarLetter}>
                    {review.user?.name?.charAt(0)?.toUpperCase() || '?'}
                </Text>
            </View>
            <View style={styles.cardMeta}>
                <Text style={styles.reviewerName}>{review.user?.name || 'Customer'}</Text>
                <Text style={styles.reviewDate}>
                    {new Date(review.createdAt).toLocaleDateString()}
                </Text>
            </View>
            <Stars rating={review.rating} />
        </View>

        {/* Title + comment */}
        <Text style={styles.reviewTitle}>{review.title}</Text>
        <Text style={styles.reviewComment}>{review.comment}</Text>

        {/* Admin reply */}
        {review.adminReply ? (
            <View style={styles.replyBox}>
                <View style={styles.replyHeader}>
                    <MaterialCommunityIcons name="shield-account" size={14} color={COLORS.teal} />
                    <Text style={styles.replyLabel}>Heritage Slabs Team</Text>
                </View>
                <Text style={styles.replyText}>{review.adminReply}</Text>
            </View>
        ) : null}
    </View>
);

const AverageBar = ({ reviews }) => {
    if (!reviews.length) return null;
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    return (
        <View style={styles.avgBox}>
            <Text style={styles.avgScore}>{avg.toFixed(1)}</Text>
            <View>
                <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((s) => (
                        <MaterialCommunityIcons
                            key={s}
                            name={s <= Math.round(avg) ? 'star' : 'star-outline'}
                            size={20}
                            color={COLORS.star}
                        />
                    ))}
                </View>
                <Text style={styles.avgCount}>{reviews.length} review{reviews.length !== 1 ? 's' : ''}</Text>
            </View>
        </View>
    );
};

const ProductReviewsScreen = ({ navigation, route }) => {
    const { productId, productName } = route.params;
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [canReview, setCanReview] = useState(false);   // has purchased & not yet reviewed
    const [alreadyReviewed, setAlreadyReviewed] = useState(false);

    const fetchReviews = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/reviews/product/${productId}`);
            setReviews(res.data);
        } catch {
            // silently fail — show empty list
        } finally {
            setLoading(false);
        }
    }, [productId]);

    // Check whether the logged-in user can write a review for this product
    const checkCanReview = useCallback(async () => {
        try {
            // Get userId from stored JWT
            const token = await AsyncStorage.getItem('userToken');
            if (!token) return;
            const payload = decodeToken(token);
            const userId = payload?.id;
            if (!userId) return;

            // Check eligible orders
            const ordersRes = await api.get('/orders/myorders');
            const orders = ordersRes.data;
            const eligibleStatuses = ['Paid', 'Shipped', 'Delivered'];
            const hasPurchased = orders.some(
                (o) =>
                    eligibleStatuses.includes(o.status) &&
                    o.items.some((i) => (i.product?._id || i.product) === productId)
            );
            if (!hasPurchased) { setCanReview(false); return; }

            // Check if already reviewed (reviews are already fetched into `reviews` state,
            // but fetch them fresh here to be safe)
            const reviewsRes = await api.get(`/reviews/product/${productId}`);
            const hasReviewed = reviewsRes.data.some(
                (r) => (r.user?._id || r.user) === userId
            );
            setAlreadyReviewed(hasReviewed);
            setCanReview(!hasReviewed);
        } catch {
            setCanReview(false);
        }
    }, [productId]);

    useEffect(() => {
        fetchReviews();
        checkCanReview();
    }, [fetchReviews, checkCanReview]);

    // Re-check when the screen comes back into focus (e.g. after writing a review)
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchReviews();
            checkCanReview();
        });
        return unsubscribe;
    }, [navigation, fetchReviews, checkCanReview]);

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
                    <Text style={styles.headerTitle} numberOfLines={1}>Reviews</Text>
                    <Text style={styles.headerSub} numberOfLines={1}>{productName}</Text>
                </View>
                {canReview && (
                    <TouchableOpacity
                        style={styles.writeBtn}
                        onPress={() => navigation.navigate('WriteReview', { productId, productName })}
                        activeOpacity={0.85}
                    >
                        <MaterialCommunityIcons name="pencil-plus" size={18} color={COLORS.white} />
                    </TouchableOpacity>
                )}
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
                    ListHeaderComponent={
                        <>
                            <AverageBar reviews={reviews} />
                            {canReview && (
                                <TouchableOpacity
                                    style={styles.writeReviewBanner}
                                    onPress={() => navigation.navigate('WriteReview', { productId, productName })}
                                    activeOpacity={0.85}
                                >
                                    <MaterialCommunityIcons name="pencil-plus-outline" size={20} color={COLORS.white} />
                                    <Text style={styles.writeReviewBannerText}>Write a Review</Text>
                                    <MaterialCommunityIcons name="chevron-right" size={18} color="rgba(255,255,255,0.7)" />
                                </TouchableOpacity>
                            )}
                            {alreadyReviewed && (
                                <View style={styles.alreadyReviewedBanner}>
                                    <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.teal} />
                                    <Text style={styles.alreadyReviewedText}>You have reviewed this product</Text>
                                </View>
                            )}
                        </>
                    }
                    renderItem={({ item }) => <ReviewCard review={item} />}
                    refreshing={loading}
                    onRefresh={fetchReviews}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyBox}>
                            <MaterialCommunityIcons name="star-outline" size={56} color={COLORS.border} />
                            <Text style={styles.emptyText}>No reviews yet</Text>
                            {canReview ? (
                                <TouchableOpacity
                                    style={styles.emptyWriteBtn}
                                    onPress={() => navigation.navigate('WriteReview', { productId, productName })}
                                >
                                    <MaterialCommunityIcons name="pencil-plus" size={16} color={COLORS.white} />
                                    <Text style={styles.emptyWriteBtnText}>Be the first to review</Text>
                                </TouchableOpacity>
                            ) : (
                                <Text style={styles.emptySubText}>
                                    {alreadyReviewed ? 'You have already reviewed this product' : 'Purchase this product to leave a review'}
                                </Text>
                            )}
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
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.teal,
        letterSpacing: 2,
        marginBottom: 2,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: COLORS.white,
    },
    headerSub: {
        fontSize: 13,
        color: '#9ca3b8',
        marginTop: 2,
    },

    listContent: { padding: 16, paddingBottom: 30 },

    avgBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 18,
        marginBottom: 16,
        gap: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    avgScore: {
        fontSize: 44,
        fontWeight: '800',
        color: COLORS.textPrimary,
    },
    avgCount: {
        fontSize: 12,
        color: COLORS.textSub,
        marginTop: 2,
    },

    card: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    cardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatarCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.tealLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    avatarLetter: {
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.teal,
    },
    cardMeta: { flex: 1 },
    reviewerName: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    reviewDate: {
        fontSize: 11,
        color: COLORS.textSub,
        marginTop: 1,
    },
    starsRow: { flexDirection: 'row', gap: 1 },

    reviewTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: 5,
    },
    reviewComment: {
        fontSize: 14,
        color: COLORS.textSub,
        lineHeight: 20,
    },

    replyBox: {
        marginTop: 12,
        backgroundColor: COLORS.tealLight,
        borderRadius: 10,
        padding: 12,
        borderLeftWidth: 3,
        borderLeftColor: COLORS.teal,
    },
    replyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginBottom: 5,
    },
    replyLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.teal,
    },
    replyText: {
        fontSize: 13,
        color: COLORS.textPrimary,
        lineHeight: 18,
    },

    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyBox: { alignItems: 'center', marginTop: 80 },
    emptyText: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginTop: 14,
    },
    emptySubText: {
        fontSize: 13,
        color: COLORS.textSub,
        marginTop: 6,
        textAlign: 'center',
        paddingHorizontal: 30,
    },
    writeBtn: {
        backgroundColor: COLORS.teal,
        borderRadius: 12,
        padding: 10,
        marginLeft: 10,
    },
    writeReviewBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: COLORS.teal,
        borderRadius: 14,
        padding: 14,
        marginBottom: 16,
    },
    writeReviewBannerText: {
        flex: 1,
        color: COLORS.white,
        fontSize: 15,
        fontWeight: '700',
    },
    alreadyReviewedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: COLORS.tealLight,
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    alreadyReviewedText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.teal,
    },
    emptyWriteBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: COLORS.teal,
        borderRadius: 12,
        paddingHorizontal: 20,
        paddingVertical: 12,
        marginTop: 16,
    },
    emptyWriteBtnText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '700',
    },
});

export default ProductReviewsScreen;
