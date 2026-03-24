import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const COLORS = {
    dark: '#1e2235',
    teal: '#2a9d8f',
    bg: '#f0f2f5',
    white: '#ffffff',
    textPrimary: '#1e2235',
    textSub: '#6b7280',
    border: '#e5e7eb',
};


const SECTIONS = [
    {
        key: 'products',
        title: 'Manage Products',
        subtitle: 'Add, edit & remove slabs',
        icon: 'package-variant-closed',
        color: '#2a9d8f',
        bg: '#e8f5f4',
        functional: true,
        route: 'ProductManagement',
    },
    {
        key: 'orders',
        title: 'Manage Orders',
        subtitle: 'Track customer orders',
        icon: 'clipboard-list-outline',
        color: '#4361ee',
        bg: '#eaedfc',
        functional: false,
    },
    {
        key: 'deliveries',
        title: 'Manage Deliveries',
        subtitle: 'Monitor deliveries & ETAs',
        icon: 'truck-delivery-outline',
        color: '#f4a261',
        bg: '#fdf3ea',
        functional: false,
    },
    {
        key: 'vehicles',
        title: 'Manage Vehicles',
        subtitle: 'Fleet tracking & status',
        icon: 'car-outline',
        color: '#7b2d8b',
        bg: '#f3e8f8',
        functional: false,
    },
    {
        key: 'suppliers',
        title: 'Manage Suppliers',
        subtitle: 'Supplier contacts & info',
        icon: 'factory',
        color: '#e76f51',
        bg: '#fdecea',
        functional: false,
    },
    {
        key: 'reviews',
        title: 'Reviews & Tickets',
        subtitle: 'Customer feedback & support',
        icon: 'face-agent',
        color: '#e9c46a',
        bg: '#fdf8e8',
        functional: false,
    },
    {
        key: 'users',
        title: 'Manage Users',
        subtitle: 'View, edit & remove users',
        icon: 'account-group-outline',
        color: '#d62828',
        bg: '#fceaea',
        functional: true,
        route: 'UserManagement',
    },
];


const SectionCard = ({ section, onPress }) => (
    <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        activeOpacity={0.82}
    >
        {/* Icon circle */}
        <View style={[styles.iconCircle, { backgroundColor: section.bg }]}>
            <MaterialCommunityIcons name={section.icon} size={30} color={section.color} />
        </View>

        {/* Text */}
        <View style={styles.cardText}>
            <Text style={styles.cardTitle}>{section.title}</Text>
            <Text style={styles.cardSub}>{section.subtitle}</Text>
        </View>


        {section.functional ? (
            <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.textSub} />
        ) : (
            <View style={styles.soonBadge}>
                <Text style={styles.soonText}>Soon</Text>
            </View>
        )}
    </TouchableOpacity>
);


const AdminDashboardScreen = ({ navigation }) => {

    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userRole');
            navigation.replace('Login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const handleSectionPress = (section) => {
        if (section.functional && section.route) {
            navigation.navigate(section.route);
        } else {
            Alert.alert(section.title, 'This module is coming soon.', [{ text: 'OK' }]);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

            {/* ── Header ── */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerEyebrow}>HERITAGE SLABS</Text>
                    <Text style={styles.headerTitle}>Manager Portal</Text>
                </View>
                <TouchableOpacity style={styles.logoutIcon} onPress={handleLogout}>
                    <MaterialCommunityIcons name="logout" size={22} color={COLORS.white} />
                </TouchableOpacity>
            </View>

            {/* Section Grid */}
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {SECTIONS.map((section) => (
                    <SectionCard
                        key={section.key}
                        section={section}
                        onPress={() => handleSectionPress(section)}
                    />
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },

    // Header
    header: {
        backgroundColor: COLORS.dark,
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 28,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerEyebrow: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.teal,
        letterSpacing: 2,
        marginBottom: 4,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: COLORS.white,
    },
    headerSub: {
        fontSize: 13,
        color: '#9ca3b8',
        marginTop: 2,
    },
    logoutIcon: {
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 12,
        padding: 10,
        marginTop: 4,
    },

    // Content
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    sectionHeading: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.textSub,
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 14,
    },

    // Card
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
        elevation: 3,
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    cardText: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: 3,
    },
    cardSub: {
        fontSize: 12,
        color: COLORS.textSub,
    },

    soonBadge: {
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    soonText: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.textSub,
    },
});

export default AdminDashboardScreen;