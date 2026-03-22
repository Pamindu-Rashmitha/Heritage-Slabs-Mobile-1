import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    Alert, ActivityIndicator, ScrollView, Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/axiosConfig';

const getFullImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    const serverUrl = api.defaults.baseURL.replace(/\/api$/, '');
    const formattedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${serverUrl}${formattedPath}`;
};

const EditProductScreen = ({ route, navigation }) => {
    const { product } = route.params;

    const [stoneName, setStoneName] = useState(product.stoneName);
    const [stock, setStock] = useState(product.stockInSqFt.toString());
    const [price, setPrice] = useState(product.pricePerSqFt.toString());
    const [loading, setLoading] = useState(false);

    const handleUpdateProduct = async () => {
        if (!stoneName || !stock || !price) {
            Alert.alert('Missing Info', 'Please fill out all fields.');
            return;
        }

        setLoading(true);

        try {
            const token = await AsyncStorage.getItem('userToken');

            const updatedData = {
                stoneName,
                stockInSqFt: Number(stock),
                pricePerSqFt: Number(price),
            };

            await api.put(`/products/${product._id}`, updatedData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            Alert.alert('Success!', 'Slab details updated successfully.');
            // Route back
            navigation.goBack();

        } catch (error) {
            console.error('Update Error:', error);
            Alert.alert('Update Failed', 'Make sure your backend is running and the route is correct.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.form}>
                <Text style={styles.title}>Edit Slab Details</Text>

                {/* The Image Preview (Read Only for now) */}
                {product.imageUrl && (
                    <View style={styles.imagePicker}>
                        <Image source={{ uri: getFullImageUrl(product.imageUrl) }} style={styles.imagePreview} />
                    </View>
                )}

                <Text style={styles.label}>Stone Name</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Stone Name"
                    value={stoneName}
                    onChangeText={setStoneName}
                />

                <Text style={styles.label}>Stock in SqFt</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Stock in SqFt"
                    value={stock}
                    onChangeText={setStock}
                    keyboardType="numeric"
                />

                <Text style={styles.label}>Price per SqFt</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Price per SqFt"
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric"
                />

                <TouchableOpacity
                    style={styles.updateButton}
                    onPress={handleUpdateProduct}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Save Changes</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f4f4' },
    form: { padding: 30 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 20 },
    imagePicker: {
        height: 200,
        backgroundColor: '#e1e4e8',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        overflow: 'hidden',
        position: 'relative'
    },
    imagePreview: { width: '100%', height: '100%' },
    label: { fontSize: 14, color: '#555', marginBottom: 5, fontWeight: '600', marginLeft: 5 },
    input: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 16, borderWidth: 1, borderColor: '#ddd' },
    updateButton: { backgroundColor: '#2a9d8f', padding: 15, borderRadius: 10, marginTop: 10, alignItems: 'center' },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

export default EditProductScreen;
