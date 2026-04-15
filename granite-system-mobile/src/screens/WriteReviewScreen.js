import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../api/axiosConfig';

const COLORS = {
    dark: '#1e2235',
    teal: '#2a9d8f',
    tealLight: '#e8f5f4',
    amber: '#f4a261',
    bg: '#f0f2f5',
    white: '#ffffff',
    textPrimary: '#1e2235',
    textSub: '#6b7280',
    border: '#e5e7eb',
    danger: '#e63946',
    star: '#f4a261',
};

const StarRating = ({ rating, setRating }) => (
    <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                activeOpacity={0.7}
                style={styles.starBtn}
            >
                <MaterialCommunityIcons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={40}
                    color={COLORS.star}
                />
            </TouchableOpacity>
        ))}
    </View>
);

const ratingLabel = (r) => {
    const labels = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Great', 5: 'Excellent' };
    return labels[r] || '';
};

const WriteReviewScreen = ({ navigation, route }) => {
    const { productId, productName } = route.params;

    const [rating, setRating] = useState(0);
    const [title, setTitle] = useState('');
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [submitted, setSubmitted] = useState(false);

    const hasLetter = (str) => /[a-zA-Z]/.test(str);

    const validate = (fields = {}) => {
        const r = fields.rating !== undefined ? fields.rating : rating;
        const t = fields.title !== undefined ? fields.title : title;
        const c = fields.comment !== undefined ? fields.comment : comment;
        const errs = {};
        if (r === 0) errs.rating = 'Please select a star rating.';
        if (!t.trim()) {
            errs.title = 'Title is required.';
        } else if (t.trim().length < 3) {
            errs.title = 'Title must be at least 3 characters.';
        } else if (!hasLetter(t)) {
            errs.title = 'Title must contain at least one letter.';
        }
        if (!c.trim()) {
            errs.comment = 'Comment is required.';
        } else if (c.trim().length < 5) {
            errs.comment = 'Comment must be more than 5 characters.';
        } else if (!hasLetter(c)) {
            errs.comment = 'Comment must contain at least one letter.';
        }
        return errs;
    };

    const handleRatingChange = (val) => {
        setRating(val);
        if (submitted) setErrors(validate({ rating: val }));
    };

    const handleTitleChange = (val) => {
        setTitle(val);
        if (submitted) setErrors(validate({ title: val }));
    };

    const handleCommentChange = (val) => {
        setComment(val);
        if (submitted) setErrors(validate({ comment: val }));
    };

    const handleSubmit = async () => {
        setSubmitted(true);
        const errs = validate();
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;

        setSubmitting(true);
        try {
            await api.post('/reviews', { productId, rating, title, comment });
            setSubmitted(false);
            navigation.goBack();
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to submit review.';
            setErrors({ server: msg });
        } finally {
            setSubmitting(false);
        }
    };

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
                    <Text style={styles.headerTitle}>Write a Review</Text>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Product name */}
                <View style={styles.productCard}>
                    <MaterialCommunityIcons name="layers-outline" size={22} color={COLORS.teal} />
                    <Text style={styles.productName} numberOfLines={1}>{productName}</Text>
                </View>

                {/* Star rating */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Your Rating</Text>
                    <StarRating rating={rating} setRating={handleRatingChange} />
                    {rating > 0 && (
                        <Text style={styles.ratingLabel}>{ratingLabel(rating)}</Text>
                    )}
                    {errors.rating ? <Text style={styles.errorText}>{errors.rating}</Text> : null}
                </View>

                {/* Title */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Review Title</Text>
                    <TextInput
                        style={[styles.input, errors.title && styles.inputError]}
                        placeholder="Summarise your experience"
                        placeholderTextColor={COLORS.textSub}
                        value={title}
                        onChangeText={handleTitleChange}
                        maxLength={100}
                    />
                    {errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : null}
                </View>

                {/* Comment */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Your Comment</Text>
                    <TextInput
                        style={[styles.input, styles.textArea, errors.comment && styles.inputError]}
                        placeholder="Tell us more about the product quality, texture, colour…"
                        placeholderTextColor={COLORS.textSub}
                        value={comment}
                        onChangeText={handleCommentChange}
                        multiline
                        numberOfLines={5}
                        maxLength={500}
                        textAlignVertical="top"
                    />
                    <Text style={styles.charCount}>{comment.length}/500</Text>
                    {errors.comment ? <Text style={styles.errorText}>{errors.comment}</Text> : null}
                </View>

                {/* Server error */}
                {errors.server ? (
                    <View style={styles.serverErrorBox}>
                        <Text style={styles.serverErrorText}>{errors.server}</Text>
                    </View>
                ) : null}

                {/* Submit */}
                <TouchableOpacity
                    style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                    onPress={handleSubmit}
                    activeOpacity={0.85}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color={COLORS.white} />
                    ) : (
                        <>
                            <MaterialCommunityIcons name="send" size={18} color={COLORS.white} />
                            <Text style={styles.submitText}>Submit Review</Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
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

    scrollContent: { padding: 20, paddingBottom: 40 },

    productCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.tealLight,
        borderRadius: 12,
        padding: 14,
        marginBottom: 24,
        gap: 10,
    },
    productName: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.teal,
    },

    section: { marginBottom: 22 },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.textSub,
        letterSpacing: 0.5,
        marginBottom: 10,
        textTransform: 'uppercase',
    },

    starRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
    },
    starBtn: { padding: 4 },
    ratingLabel: {
        textAlign: 'center',
        marginTop: 6,
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.star,
    },

    input: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        color: COLORS.textPrimary,
    },
    textArea: {
        height: 120,
        paddingTop: 12,
    },
    charCount: {
        textAlign: 'right',
        marginTop: 4,
        fontSize: 12,
        color: COLORS.textSub,
    },

    submitBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: COLORS.teal,
        borderRadius: 14,
        paddingVertical: 16,
        marginTop: 8,
    },
    submitBtnDisabled: { opacity: 0.5 },
    submitText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '800',
    },
    inputError: {
        borderColor: COLORS.danger,
    },
    errorText: {
        color: COLORS.danger,
        fontSize: 12,
        fontWeight: '600',
        marginTop: 5,
    },
    serverErrorBox: {
        backgroundColor: '#fceaea',
        borderRadius: 10,
        padding: 12,
        marginBottom: 14,
    },
    serverErrorText: {
        color: COLORS.danger,
        fontSize: 13,
        fontWeight: '600',
    },
});

export default WriteReviewScreen;
