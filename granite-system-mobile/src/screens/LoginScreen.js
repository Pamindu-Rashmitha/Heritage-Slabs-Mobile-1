import React, { useState } from 'react';
import { Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../api/axiosConfig'; 
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    StyleSheet,  
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({navigation}) => {
    // State to hold the user's typed input
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        try {
            // Send the POST request to /auth/login
            const response = await api.post('/auth/login', {
                email: email,
                password: password,
            });

            // If successful, extract the token
            const token = response.data.token;
            const role = response.data.role;

            await AsyncStorage.setItem('userToken', token);
            await AsyncStorage.setItem('userRole', role);
            
            if (role === 'Admin') {
                navigation.replace('AdminDashboard');
            } else {
                navigation.replace('CustomerCatalog');
            }

        } catch (error) {
            console.error(error);
            // Show the error message from your backend if it fails
            Alert.alert('Login Failed', error.response?.data?.message || 'Something went wrong');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.formContainer}>
                <Text style={styles.title}>Heritage Slabs</Text>
                <Text style={styles.subtitle}>ERP for granites</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Email Address"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none" // Stops the phone from capitalizing the first letter of the email
                />

                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry // Hides the password behind dots
                />

                {/* TouchableOpacity is a button that slightly fades when pressed */}
                <TouchableOpacity style={styles.button} onPress={handleLogin}>
                    <Text style={styles.buttonText}>Login</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={{ marginTop: 20, alignItems: 'center' }} 
                    onPress={() => navigation.navigate('Register')}
                >
                    <Text style={{ color: '#2b2d42', fontSize: 16, fontWeight: '600' }}>
                        Don't have an account? Sign Up
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

// React Native uses StyleSheet instead of standard CSS
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f4f4f4',
        justifyContent: 'center',
    },
    formContainer: {
        paddingHorizontal: 30,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 18,
        color: '#666',
        marginBottom: 40,
        textAlign: 'center',
    },
    input: {
        backgroundColor: '#fff',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 10,
        marginBottom: 15,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    button: {
        backgroundColor: '#2b2d42', // A sleek dark slate color
        paddingVertical: 15,
        borderRadius: 10,
        marginTop: 10,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default LoginScreen;