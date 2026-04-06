import axios from 'axios';

const axiosClient = axios.create({
    baseURL: 'http://localhost:8080/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Tạm thời bỏ interceptor check Token để dễ dàng test API
axiosClient.interceptors.request.use((config) => {
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default axiosClient;