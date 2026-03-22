import React, { useState } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    StyleSheet, 
    Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/axiosConfig';

const RegisterScreen = ({ navigation }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleRegister = async () => {
        if (!name || !email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        try {
            const response = await api.post('/auth/register', { name, email, password });

            const token = response.data.token;
            const role = response.data.role || 'customer'; 
            
            // THE SAFETY NET: If the backend didn't send a token, send them to Login
            if (!token) {
                Alert.alert('Account Created!', 'Please log in with your new credentials.');
                navigation.replace('Login');
                return; // Stop the code here so it doesn't hit AsyncStorage
            }

            // If token exists, proceed as normal
            await AsyncStorage.setItem('userToken', token);
            await AsyncStorage.setItem('userRole', role);
            
            Alert.alert('Success!', `Welcome to the Granite Catalog, ${response.data.name}!`);
            navigation.replace('CustomerCatalog');

        } catch (error) {
            console.error(error);
            Alert.alert('Registration Failed', error.response?.data?.message || 'Something went wrong');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.formContainer}>
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>Join to view premium granite slabs</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    value={name}
                    onChangeText={setName}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Email Address"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <TouchableOpacity style={styles.button} onPress={handleRegister}>
                    <Text style={styles.buttonText}>Sign Up</Text>
                </TouchableOpacity>

                {/* A link to go back to the Login screen if they already have an account */}
                <TouchableOpacity 
                    style={styles.linkButton} 
                    onPress={() => navigation.navigate('Login')}
                >
                    <Text style={styles.linkText}>Already have an account? Log In</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f4f4', justifyContent: 'center' },
    formContainer: { paddingHorizontal: 30 },
    title: { fontSize: 32, fontWeight: 'bold', color: '#333', marginBottom: 5, textAlign: 'center' },
    subtitle: { fontSize: 16, color: '#666', marginBottom: 40, textAlign: 'center' },
    input: { backgroundColor: '#fff', paddingVertical: 15, paddingHorizontal: 20, borderRadius: 10, marginBottom: 15, fontSize: 16, borderWidth: 1, borderColor: '#ddd' },
    button: { backgroundColor: '#2a9d8f', paddingVertical: 15, borderRadius: 10, marginTop: 10, alignItems: 'center' },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    linkButton: { marginTop: 20, alignItems: 'center' },
    linkText: { color: '#2b2d42', fontSize: 16, fontWeight: '600' }
});

export default RegisterScreen;