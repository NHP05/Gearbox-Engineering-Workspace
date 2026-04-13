import axios from 'axios';

const defaultApiBaseUrl = 'http://localhost:8080/api/v1';
const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl;

const normalizeApiBaseUrl = (value) => {
    const normalized = String(value || '').trim().replace(/\/+$/, '');
    if (!normalized) return defaultApiBaseUrl;

    if (/\/api\/v\d+$/i.test(normalized)) {
        return normalized;
    }

    if (/\/api$/i.test(normalized)) {
        return `${normalized}/v1`;
    }

    return `${normalized}/api/v1`;
};

const apiBaseUrl = normalizeApiBaseUrl(rawApiBaseUrl);

const axiosClient = axios.create({
    baseURL: apiBaseUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});

axiosClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    let userLanguage = '';
    try {
        const user = JSON.parse(localStorage.getItem('gearbox_user') || '{}');
        userLanguage = String(user?.language || '').toLowerCase();
    } catch (error) {
        userLanguage = '';
    }

    const language = String(localStorage.getItem('gearbox_language') || userLanguage || '').toLowerCase();
    if (language === 'vi' || language === 'en') {
        config.headers['X-Client-Language'] = language;
    }

    return config;
}, (error) => {
    return Promise.reject(error);
});

export default axiosClient;