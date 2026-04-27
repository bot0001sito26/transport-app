import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000', // El puerto de tu backend en FastAPI
});

// Este interceptor asegura que si el usuario ya inició sesión, 
// su "Token de seguridad" viaje en todas las peticiones futuras.
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;