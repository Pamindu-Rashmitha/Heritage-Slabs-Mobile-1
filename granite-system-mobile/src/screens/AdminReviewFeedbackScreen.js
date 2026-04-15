import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const COLORS = {
    dark: '#1e2235',
    teal: '#2a9d8f',
    tealLight: '#e8f5f4',
    bg: '#f0f2f5',
    white: '#ffffff',
    textPrimary: '#1e2235',
    textSub: '#6b7280',
    border: '#e5e7eb',
    amber: '#e9c46a',
    amberLight: '#fdf8e8',
    blue: '#4361ee',
    blueLight: '#eaedfc',
};

const AdminReviewFeedbackScreen = ({ navigation }) => {
    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <View style={styles.headerText}>
                    <Text style={styles.headerEyebrow}>HERITAGE SLABS</Text>
                    <Text style={styles.headerTitle}>Reviews & Tickets</Text>
                </View>
            </View>

            <View style={styles.content}>
                <Text style={styles.sectionLabel}>MANAGE</Text>

                <TouchableOpacity
                    style={styles.card}
                    onPress={() => navigation.replace('AdminReview')}
                    activeOpacity={0.82}
                >
                    <View style={[styles.iconCircle, { backgroundColor: COLORS.amberLight }]}>
                        <MaterialCommunityIcons name="star-outline" size={30} color={COLORS.amber} />
                    </View>
                    <View style={styles.cardText}>
                        <Text style={styles.cardTitle}>Customer Reviews</Text>
                        <Text style={styles.cardSub}>View, reply, flag and delete reviews</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.textSub} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.card}
                    onPress={() => navigation.replace('AdminFeedback')}
                    activeOpacity={0.82}
                >
                    <View style={[styles.iconCircle, { backgroundColor: COLORS.blueLight }]}>
                        <MaterialCommunityIcons name="message-text-outline" size={30} color={COLORS.blue} />
                    </View>
                    <View style={styles.cardText}>
                        <Text style={styles.cardTitle}>Support Tickets</Text>
                        <Text style={styles.cardSub}>Reply to users, change status, freeze conversations</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.textSub} />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    header: {
        backgroundColor: COLORS.dark,
        paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28,
        flexDirection: 'row', alignItems: 'center',
        borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    },
    backBtn: {
        backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 8, marginRight: 14,
    },
    headerText: { flex: 1 },
    headerEyebrow: { fontSize: 11, fontWeight: '700', color: COLORS.teal, letterSpacing: 2, marginBottom: 2 },
    headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.white },
    content: { padding: 20, paddingTop: 24 },
    sectionLabel: {
        fontSize: 12, fontWeight: '700', color: COLORS.textSub,
        letterSpacing: 1.5, marginBottom: 14,
    },
    card: {
        backgroundColor: COLORS.white, borderRadius: 16,
        flexDirection: 'row', alignItems: 'center',
        padding: 18, marginBottom: 14,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
    },
    iconCircle: {
        width: 58, height: 58, borderRadius: 16,
        justifyContent: 'center', alignItems: 'center', marginRight: 16,
    },
    cardText: { flex: 1 },
    cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
    cardSub: { fontSize: 12, color: COLORS.textSub, lineHeight: 17 },
});

export default AdminReviewFeedbackScreen;
