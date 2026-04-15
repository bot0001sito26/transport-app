import { createContext, useState, useEffect } from 'react';
import api from '../api/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [impersonatedUser, setImpersonatedUser] = useState(null); // NUEVO: Estado del usuario espiado
    const [loading, setLoading] = useState(true);

    const fetchUserProfile = async () => {
        try {
            const response = await api.get('/users/me');
            setUser(response.data); // Aquí guardamos todo: id, email, role, etc.
        } catch (error) {
            console.error("Error obteniendo perfil:", error);
            localStorage.removeItem('token');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchUserProfile(); // Si hay token, traemos el perfil al recargar
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (username, password) => {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        const response = await api.post('/auth/login', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        localStorage.setItem('token', response.data.access_token);
        await fetchUserProfile(); // Una vez logueado, traemos su perfil y su rol
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setImpersonatedUser(null); // Limpiamos la impersonación al salir
    };

    // Funciones para iniciar/detener la simulación de vista
    const impersonate = (targetUser) => setImpersonatedUser(targetUser);
    const stopImpersonation = () => setImpersonatedUser(null);

    return (
        <AuthContext.Provider value={{
            user,
            impersonatedUser,
            impersonate,
            stopImpersonation,
            login,
            logout,
            loading
        }}>
            {children}
        </AuthContext.Provider>
    );
};