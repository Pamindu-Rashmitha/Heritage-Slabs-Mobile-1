import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Update this IP to your Mac's local IP address (run `ipconfig getifaddr en0` on Mac)
export const SERVER_URL = 'http://10.77.126.199:5001';

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