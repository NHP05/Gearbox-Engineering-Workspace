import axios from 'axios';

const axiosClient = axios.create({
    baseURL: 'http://localhost:8080/api/v1', // URL của Backend Node.js
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
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default axiosClient;