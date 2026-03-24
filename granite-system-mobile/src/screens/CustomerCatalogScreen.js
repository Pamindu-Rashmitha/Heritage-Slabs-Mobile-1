import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    Alert,
    TouchableOpacity,
    Image,
    StatusBar,
    Dimensions,
    TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../api/axiosConfig';
const SERVER_URL = 'http://192.168.1.8:5000';
const { width: SCREEN_WIDTH } = Dimensions.get('window');


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
    navBg: '#ffffff',
    navActive: '#2a9d8f',
    navInactive: '#9ca3af',
    danger: '#e63946',
};


const NavItem = ({ icon, label, color, onPress }) => (
    <TouchableOpacity style={styles.navItem} onPress={onPress} activeOpacity={0.7}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
        <Text style={[styles.navLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
);

const BottomNavBar = ({ onLogout, onNavigateProfile }) => (
    <View style={styles.bottomNav}>

        <NavItem
            icon="account-outline"
            label="Profile"
            color={COLORS.navInactive}
            onPress={onNavigateProfile}
        />

        <NavItem
            icon="cart-outline"
            label="Cart"
            color={COLORS.navInactive}
            onPress={() => { }}
        />

        <NavItem
            icon="history"
            label="Orders"
            color={COLORS.navInactive}
            onPress={() => { }}
        />

        <NavItem
            icon="message-outline"
            label="Support"
            color={COLORS.navInactive}
            onPress={() => { }}
        />

        <NavItem
            icon="logout"
            label="Logout"
            color={COLORS.danger}
            onPress={onLogout}
        />
    </View>
);


const SlabCard = ({ item }) => {
    const finalImageUrl = item.imageUrl
        ? `${SERVER_URL}${item.imageUrl}`
        : 'https://via.placeholder.com/800x600?text=No+Image';

    return (
        <View style={styles.card}>
            {/* Slab Image */}
            <Image
                source={{ uri: finalImageUrl }}
                style={styles.slabImage}
                resizeMode="cover"
            />

            {/* Gradient-like overlay tag */}
            <View style={styles.categoryTag}>
                <Text style={styles.categoryTagText}>Granite Slab</Text>
            </View>

            {/* Card Content */}
            <View style={styles.cardContent}>
                <Text style={styles.stoneName} numberOfLines={1}>{item.stoneName}</Text>

                <View style={styles.metaRow}>
                    {/* Stock */}
                    <View style={styles.metaChip}>
                        <MaterialCommunityIcons name="layers-outline" size={13} color={COLORS.textSub} />
                        <Text style={styles.metaChipText}>{item.stockInSqFt} SqFt</Text>
                    </View>

                    {/* Price badge */}
                    <View style={styles.priceBadge}>
                        <Text style={styles.priceText}>LKR {item.pricePerSqFt}<Text style={styles.priceSub}>/SqFt</Text></Text>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.cardActions}>

                    <TouchableOpacity
                        style={styles.addCartBtn}
                        onPress={() => { }}
                        activeOpacity={0.85}
                    >
                        <MaterialCommunityIcons name="cart-plus" size={16} color={COLORS.white} />
                        <Text style={styles.addCartText}>Add to Cart</Text>
                    </TouchableOpacity>


                    <TouchableOpacity
                        style={styles.reviewBtn}
                        onPress={() => { }}
                        activeOpacity={0.85}
                    >
                        <MaterialCommunityIcons name="star-outline" size={16} color={COLORS.teal} />
                        <Text style={styles.reviewText}>Review</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};


const CatalogHeader = ({ isSearchActive, setIsSearchActive, searchQuery, setSearchQuery }) => (
    <View style={styles.header}>
        {isSearchActive ? (
            <TextInput
                style={styles.searchInput}
                placeholder="Search slabs..."
                placeholderTextColor={COLORS.navInactive}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
            />
        ) : (
            <View>
                <Text style={styles.headerEyebrow}>HERITAGE SLABS</Text>
                <Text style={styles.headerTitle}>Stone Catalogue</Text>
            </View>
        )}
        <TouchableOpacity
            style={styles.searchBtn}
            activeOpacity={0.8}
            onPress={() => {
                if (isSearchActive) {
                    setSearchQuery('');
                    setIsSearchActive(false);
                } else {
                    setIsSearchActive(true);
                }
            }}
        >
            <MaterialCommunityIcons
                name={isSearchActive ? "close" : "magnify"}
                size={22}
                color={COLORS.white}
            />
        </TouchableOpacity>
    </View>
);


const CustomerCatalogScreen = ({ navigation }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchActive, setIsSearchActive] = useState(false);

    useEffect(() => {
        fetchInventory();
    }, []);

    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userRole');
            navigation.replace('Login');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const fetchInventory = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const response = await api.get('/products');
            const data = response.data.products ?? response.data;
            setProducts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Network/Backend Error:', error.response?.data || error.message);
            Alert.alert('Error', 'Failed to fetch inventory from the server.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const filteredProducts = products.filter((product) =>
        product.stoneName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
                <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />
                <CatalogHeader
                    isSearchActive={isSearchActive}
                    setIsSearchActive={setIsSearchActive}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                />
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={COLORS.teal} />
                    <Text style={styles.loadingText}>Loading Catalogue…</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

            <CatalogHeader
                isSearchActive={isSearchActive}
                setIsSearchActive={setIsSearchActive}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
            />

            <FlatList
                data={filteredProducts}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => <SlabCard item={item} />}
                contentContainerStyle={styles.listContent}
                refreshing={refreshing}
                onRefresh={() => fetchInventory(true)}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.centered}>
                        <MaterialCommunityIcons name="package-variant" size={64} color={COLORS.border} />
                        <Text style={styles.emptyText}>No slabs available yet.</Text>
                    </View>
                }
            />

            <BottomNavBar
                onLogout={handleLogout}
                onNavigateProfile={() => navigation.navigate('Profile')}
            />
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
        paddingBottom: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerEyebrow: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.teal,
        letterSpacing: 2,
        marginBottom: 2,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.white,
    },
    searchBtn: {
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 12,
        padding: 10,
    },
    searchInput: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 10,
        color: COLORS.white,
        fontSize: 16,
        marginRight: 10,
    },

    // Loading
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: COLORS.textSub,
        fontSize: 14,
    },
    emptyText: {
        marginTop: 12,
        color: COLORS.textSub,
        fontSize: 15,
    },

    // List
    listContent: {
        padding: 16,
        paddingBottom: 20,
    },

    // Product Card
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 18,
        marginBottom: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.09,
        shadowRadius: 10,
        elevation: 5,
    },
    slabImage: {
        width: '100%',
        height: 200,
        backgroundColor: COLORS.border,
    },
    categoryTag: {
        position: 'absolute',
        top: 14,
        left: 14,
        backgroundColor: 'rgba(30,34,53,0.72)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    categoryTagText: {
        color: COLORS.white,
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    cardContent: {
        padding: 16,
    },
    stoneName: {
        fontSize: 20,
        fontWeight: '800',
        color: COLORS.textPrimary,
        marginBottom: 10,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    metaChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.bg,
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 5,
        gap: 4,
    },
    metaChipText: {
        fontSize: 13,
        color: COLORS.textSub,
        fontWeight: '500',
    },
    priceBadge: {
        backgroundColor: COLORS.tealLight,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    priceText: {
        fontSize: 15,
        fontWeight: '800',
        color: COLORS.teal,
    },
    priceSub: {
        fontSize: 12,
        fontWeight: '500',
        color: COLORS.teal,
    },

    // Card action buttons
    cardActions: {
        flexDirection: 'row',
        gap: 10,
    },
    addCartBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: COLORS.teal,
        borderRadius: 10,
        paddingVertical: 11,
    },
    addCartText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '700',
    },
    reviewBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderWidth: 1.5,
        borderColor: COLORS.teal,
        borderRadius: 10,
        paddingVertical: 11,
        backgroundColor: COLORS.tealLight,
    },
    reviewText: {
        color: COLORS.teal,
        fontSize: 14,
        fontWeight: '700',
    },

    // Bottom Navigation Bar
    bottomNav: {
        flexDirection: 'row',
        backgroundColor: COLORS.navBg,
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 12,
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        paddingVertical: 4,
    },
    navLabel: {
        fontSize: 11,
        fontWeight: '600',
    },
});

export default CustomerCatalogScreen;