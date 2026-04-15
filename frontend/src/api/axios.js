import axios from 'axios';

const api = axios.create({
    // Vite usará la variable de entorno en producción. Si no existe, cae en localhost.
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
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