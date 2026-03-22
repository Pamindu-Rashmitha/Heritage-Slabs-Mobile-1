import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Alert,
    StatusBar,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/axiosConfig';

const COLORS = {
    dark: '#1e2235',
    teal: '#2a9d8f',
    tealLight: '#e8f5f4',
    danger: '#e63946',
    dangerLight: '#fdecea',
    bg: '#f0f2f5',
    white: '#ffffff',
    textPrimary: '#1e2235',
    textSub: '#6b7280',
    border: '#e5e7eb',
};


const StatsBar = ({ count }) => (
    <View style={styles.statsBar}>
        <Text style={styles.statsText}>
            {count} {count === 1 ? 'Product' : 'Products'} in Inventory
        </Text>
    </View>
);

const getFullImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    const serverUrl = api.defaults.baseURL.replace(/\/api$/, '');
    const formattedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${serverUrl}${formattedPath}`;
};

const ProductRow = ({ item, onUpdate, onDelete }) => (
    <View style={styles.row}>

        {/* Product Thumbnail */}
        <View style={styles.thumbContainer}>
            {item.imageUrl ? (
                <Image
                    source={{ uri: getFullImageUrl(item.imageUrl) }}
                    style={styles.thumb}
                    resizeMode="cover"
                />
            ) : (
                <View style={styles.thumbPlaceholder}>
                    <MaterialCommunityIcons name="image-off-outline" size={28} color={COLORS.border} />
                </View>
            )}
        </View>

        <View style={styles.rowBody}>
            <View style={styles.rowInfo}>
                <Text style={styles.rowName} numberOfLines={1}>{item.stoneName}</Text>
                <View style={styles.rowMeta}>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>LKR {item.pricePerSqFt}/SqFt</Text>
                    </View>
                    <Text style={styles.stockText}>{item.stockInSqFt} SqFt</Text>
                </View>
            </View>

            <View style={styles.rowActions}>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.updateBtn]}
                    onPress={() => onUpdate(item)}
                    activeOpacity={0.8}
                >
                    <MaterialCommunityIcons name="pencil-outline" size={18} color={COLORS.teal} />
                    <Text style={[styles.actionText, { color: COLORS.teal }]}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => onDelete(item)}
                    activeOpacity={0.8}
                >
                    <MaterialCommunityIcons name="trash-can-outline" size={18} color={COLORS.danger} />
                    <Text style={[styles.actionText, { color: COLORS.danger }]}>Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    </View>
);


const EmptyState = () => (
    <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="package-variant" size={72} color={COLORS.border} />
        <Text style={styles.emptyTitle}>No Products Yet</Text>
        <Text style={styles.emptySub}>Tap the + button to add your first slab.</Text>
    </View>
);

const ProductManagementScreen = ({ navigation }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useFocusEffect(
        useCallback(() => {
            fetchProducts();
        }, [])
    );

    const fetchProducts = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const response = await api.get('/products');
            const data = response.data.products ?? response.data;
            setProducts(Array.isArray(data) ? data : []);
        } catch (error) {
            Alert.alert('Fetch Error', 'Could not load products. Check your connection.');
            console.error('Fetch products error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleUpdate = (item) => {
        navigation.navigate('EditProduct', { product: item });
    };

    const handleDelete = (item) => {
        Alert.alert(
            'Delete Product',
            `Are you sure you want to remove "${item.stoneName}" from inventory?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('userToken');
                            await api.delete(`/products/${item._id}`, {
                                headers: { Authorization: `Bearer ${token}` },
                            });
                            setProducts((prev) => prev.filter((p) => p._id !== item._id));
                        } catch (error) {
                            Alert.alert('Delete Failed', 'Could not delete the product. Please try again.');
                            console.error('Delete error:', error);
                        }
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.white} />
                </TouchableOpacity>
                <View style={styles.headerText}>
                    <Text style={styles.headerEyebrow}>ADMIN</Text>
                    <Text style={styles.headerTitle}>Manage Products</Text>
                </View>
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={COLORS.teal} />
                    <Text style={styles.loadingText}>Loading Inventory…</Text>
                </View>
            ) : (
                <>
                    <StatsBar count={products.length} />

                    <FlatList
                        data={products}
                        keyExtractor={(item) => item._id}
                        renderItem={({ item }) => (
                            <ProductRow
                                item={item}
                                onUpdate={handleUpdate}
                                onDelete={handleDelete}
                            />
                        )}
                        contentContainerStyle={[
                            styles.listContent,
                            products.length === 0 && styles.listContentEmpty,
                        ]}
                        ListEmptyComponent={<EmptyState />}
                        refreshing={refreshing}
                        onRefresh={() => fetchProducts(true)}
                        showsVerticalScrollIndicator={false}
                    />
                </>
            )}

            {/* Floating Add Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('AddProduct')}
                activeOpacity={0.85}
            >
                <MaterialCommunityIcons name="plus" size={30} color={COLORS.white} />
            </TouchableOpacity>
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
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 24,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    backBtn: {
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 12,
        padding: 9,
    },
    headerText: {
        flex: 1,
    },
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

    // Stats
    statsBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 6,
    },
    statsText: {
        fontSize: 13,
        color: COLORS.textSub,
        fontWeight: '500',
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

    // List
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 100,
    },
    listContentEmpty: {
        flex: 1,
    },

    // Product row
    row: {
        backgroundColor: COLORS.white,
        borderRadius: 14,
        marginBottom: 12,
        flexDirection: 'row',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
        elevation: 3,
    },
    thumbContainer: {
        width: 72,
        height: 72,
        margin: 10,
        borderRadius: 10,
        overflow: 'hidden',
        alignSelf: 'center',
    },
    thumb: {
        width: '100%',
        height: '100%',
    },
    thumbPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: COLORS.bg,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
    },
    rowBody: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 14,
        gap: 10,
    },
    rowInfo: {
        flex: 1,
    },
    rowName: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: 6,
    },
    rowMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    badge: {
        backgroundColor: COLORS.tealLight,
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.teal,
    },
    stockText: {
        fontSize: 12,
        color: COLORS.textSub,
    },

    // Row actions
    rowActions: {
        flexDirection: 'column',
        gap: 6,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        minWidth: 70,
        justifyContent: 'center',
    },
    updateBtn: {
        backgroundColor: COLORS.tealLight,
    },
    deleteBtn: {
        backgroundColor: COLORS.dangerLight,
    },
    actionText: {
        fontSize: 12,
        fontWeight: '700',
    },

    // Empty state
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 80,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginTop: 16,
    },
    emptySub: {
        fontSize: 14,
        color: COLORS.textSub,
        marginTop: 6,
        textAlign: 'center',
    },

    // FAB
    fab: {
        position: 'absolute',
        bottom: 28,
        right: 24,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.teal,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.teal,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.45,
        shadowRadius: 10,
        elevation: 10,
    },
});

export default ProductManagementScreen;
