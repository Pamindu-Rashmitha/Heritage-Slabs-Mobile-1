import { Platform } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Local backend (PORT from granite-system-backend) without ngrok.
// In Expo Go, use the dev machine LAN host from hostUri (e.g. 192.168.1.8).
const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    '';
const devHost = hostUri ? hostUri.split(':')[0] : '';

export const SERVER_URL = devHost
    ? `http://${devHost}:5000`
    : Platform.OS === 'android'
        ? 'http://10.0.2.2:5000'
        : 'http://localhost:5000';

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