import axios from 'axios';

// Membuat instance Axios terkonfigurasi untuk SORS
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
});

// Interceptor Request: Otomatis menyertakan token jika ada
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('sors_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor Response: Penanganan global error response
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const message = error.response?.data?.message || error.message || 'Terjadi kesalahan pada server.';
        console.error('API Error:', message);
        return Promise.reject(error);
    }
);

export default api;
