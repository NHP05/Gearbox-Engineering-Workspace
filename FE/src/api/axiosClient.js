import axios from 'axios';

const axiosClient = axios.create({
    baseURL: 'http://localhost:8082/api/v1', // URL của Backend Node.js
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor: Tự động đính kèm Token vào Header trước khi gửi request
axiosClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`📤 [API Request] ${config.method.toUpperCase()} ${config.url}`);
    return config;
}, (error) => {
    console.error(`❌ [API Error] Request failed:`, error.message);
    return Promise.reject(error);
});

// Interceptor: Log responses
axiosClient.interceptors.response.use((response) => {
    console.log(`📥 [API Response] ${response.status} ${response.config.url}`, response.data?.message || '');
    return response;
}, (error) => {
    if (error.response) {
        console.error(`❌ [API Error] ${error.response.status} ${error.config.url}`, error.response.data?.message || error.message);
    } else if (error.request) {
        console.error(`❌ [API Error] No response from ${error.config?.url}. Backend may be down.`);
    } else {
        console.error(`❌ [API Error]`, error.message);
    }
    return Promise.reject(error);
});

export default axiosClient;