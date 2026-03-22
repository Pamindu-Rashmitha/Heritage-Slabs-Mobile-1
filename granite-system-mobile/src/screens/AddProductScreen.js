import React, { useState } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, StyleSheet, 
    Image, Alert, ActivityIndicator, ScrollView 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/axiosConfig';

const AddProductScreen = ({ navigation }) => {
    const [stoneName, setStoneName] = useState('');
    const [stock, setStock] = useState('');
    const [price, setPrice] = useState('');
    const [imageUri, setImageUri] = useState(null);
    const [loading, setLoading] = useState(false);

    // 1. Function to open the phone's photo gallery
    const pickImage = async () => {
        // Ask the user for permission to view their photos
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (permissionResult.granted === false) {
            Alert.alert('Permission Required', 'We need access to your photos to upload a slab.');
            return;
        }

        // Open the gallery
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true, // Lets them crop the image to a nice square
            aspect: [4, 3],
            quality: 0.8, // Compresses slightly so uploads are faster
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    // 2. Function to package and send the data to your Node.js backend
    const handleAddProduct = async () => {
        if (!stoneName || !stock || !price || !imageUri) {
            Alert.alert('Missing Info', 'Please fill out all fields and select an image.');
            return;
        }

        setLoading(true);

        try {
            // Get the Admin's secure passport
            const token = await AsyncStorage.getItem('userToken');

            // Construct FormData (The ONLY way to send files to a server)
            const formData = new FormData();
            formData.append('stoneName', stoneName);
            formData.append('stockInSqFt', stock);
            formData.append('pricePerSqFt', price);

            // React Native requires this specific format to send physical files
            const filename = imageUri.split('/').pop();
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : `image`;

            formData.append('image', {
                uri: imageUri,
                name: filename,
                type: type,
            });

            // Send the massive package to your backend!
            const response = await api.post('/products', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}` // Unlocks the protected backend route
                }
            });

            Alert.alert('Success!', 'New Granite Slab added to inventory.');
            navigation.goBack(); // Slides them back to the Admin Dashboard

        } catch (error) {
            console.error('Upload Error:', error);
            Alert.alert('Upload Failed', 'Make sure your backend is running and the route is correct.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.form}>
                <Text style={styles.title}>Add New Slab</Text>

                {/* The Image Picker Box */}
                <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                    {imageUri ? (
                        <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                    ) : (
                        <Text style={styles.imagePickerText}>+ Tap to Select Photo</Text>
                    )}
                </TouchableOpacity>

                <TextInput
                    style={styles.input}
                    placeholder="Stone Name (e.g., Black Galaxy)"
                    value={stoneName}
                    onChangeText={setStoneName}
                />
                
                <TextInput
                    style={styles.input}
                    placeholder="Stock in SqFt (e.g., 500)"
                    value={stock}
                    onChangeText={setStock}
                    keyboardType="numeric"
                />

                <TextInput
                    style={styles.input}
                    placeholder="Price per SqFt (e.g., 1200)"
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric"
                />

                <TouchableOpacity 
                    style={styles.uploadButton} 
                    onPress={handleAddProduct}
                    disabled={loading} // Disables the button while uploading
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Upload Product</Text>
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
        overflow: 'hidden'
    },
    imagePreview: { width: '100%', height: '100%' },
    imagePickerText: { color: '#666', fontSize: 16, fontWeight: 'bold' },
    input: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 16, borderWidth: 1, borderColor: '#ddd' },
    uploadButton: { backgroundColor: '#2a9d8f', padding: 15, borderRadius: 10, marginTop: 10, alignItems: 'center' },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

export default AddProductScreen;