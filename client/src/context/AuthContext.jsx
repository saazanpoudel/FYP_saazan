import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// Create consistent API client
export const api = axios.create({
    baseURL: '/api',
});

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const loadUser = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                const res = await api.get('/auth/me');
                setUser(res.data.user);
                setIsAuthenticated(true);
                return res.data.user;
            } catch (error) {
                localStorage.removeItem('token');
                delete api.defaults.headers.common['Authorization'];
                setUser(null);
                setIsAuthenticated(false);
            }
        }
        return null;
    };

    useEffect(() => {
        loadUser().finally(() => setLoading(false));
    }, []);

    const login = async (email, password) => {
        const res = await api.post('/auth/login', {
            email,
            password,
        });
        localStorage.setItem('token', res.data.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        setUser(res.data.user);
        setIsAuthenticated(true);
        return res.data;
    };

    const register = async (userData) => {
        const res = await api.post('/auth/register', userData);
        localStorage.setItem('token', res.data.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        setUser(res.data.user);
        setIsAuthenticated(true);
        return res.data;
    };

    const googleLoginCustom = async (accessToken) => {
        const res = await api.post('/auth/google-access-token', { accessToken });
        localStorage.setItem('token', res.data.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        setUser(res.data.user);
        setIsAuthenticated(true);
        return res.data;
    };

    const updateProfile = async (userData) => {
        const res = await api.put('/auth/profile', userData);
        setUser(res.data.user);
        return res.data;
    };

    const becomeGuide = async () => {
        const res = await api.put('/auth/become-guide');
        setUser(res.data.user);
        return res.data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
        setIsAuthenticated(false);
    };

    const value = {
        user,
        loading,
        isAuthenticated,
        login,
        register,
        googleLoginCustom,
        updateProfile,
        becomeGuide,
        logout,
        loadUser
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
