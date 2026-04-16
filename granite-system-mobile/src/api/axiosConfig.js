import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Dynamically resolves to your Mac's current LAN IP via the Expo dev server host.
// Falls back to 10.0.2.2 for Android emulator, or localhost for iOS simulator.
const hostUri = Constants.expoConfig?.hostUri ?? '';
const devHost = hostUri ? hostUri.split(':')[0] : null;

export const SERVER_URL = devHost
    ? `http://${devHost}:5001`
    : Platform.OS === 'android'
        ? 'http://10.0.2.2:5001'
        : 'http://localhost:5001';

const BASE_URL = `${SERVER_URL}/api`;

const api = axios.create({
    baseURL: BASE_URL,
});

// Add a request interceptor
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;