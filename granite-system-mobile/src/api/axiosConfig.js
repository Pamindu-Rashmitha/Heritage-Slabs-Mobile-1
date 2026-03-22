import axios from 'axios';


const BASE_URL = 'http://192.168.1.8:5000/api'; 

const api = axios.create({
    baseURL: BASE_URL,
});

export default api;