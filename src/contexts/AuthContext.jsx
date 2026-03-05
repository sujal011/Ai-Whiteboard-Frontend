import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../utils/api';
import { BACKEND_URL } from '../config';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('auth_token'));
    const [isLoading, setIsLoading] = useState(true);

    const logout = useCallback(() => {
        localStorage.removeItem('auth_token');
        setToken(null);
        setUser(null);
        toast.success('Logged out successfully');
    }, []);

    const fetchCurrentUser = useCallback(async () => {
        if (!token) {
            setIsLoading(false);
            return;
        }

        try {
            // There isn't an explicit /me endpoint in API doc, 
            // but we can verify token by trying to list workspaces
            const response = await apiFetch('/api/workspaces');
            if (response.ok) {
                // Since there's no /me, we just set a skeleton user for now
                // Alternatively, we could decode the JWT if needed
                setUser({ authenticated: true });
            } else if (response.status === 401) {
                logout();
            }
        } catch (error) {
            console.error('Failed to fetch user:', error);
        } finally {
            setIsLoading(false);
        }
    }, [token, logout]);

    useEffect(() => {
        fetchCurrentUser();
    }, [fetchCurrentUser]);

    const login = async (email, password) => {
        const formData = new URLSearchParams();
        formData.append('username', email); // backend expects 'username' for OAuth2 Form
        formData.append('password', password);

        const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
        });

        // Safe JSON parsing
        const text = await response.text();
        const data = text ? JSON.parse(text) : {};

        if (response.ok) {
            localStorage.setItem('auth_token', data.access_token);
            setToken(data.access_token);
            setUser({ authenticated: true });
            toast.success('Logged in successfully');
            return true;
        } else {
            throw new Error(data.detail || 'Login failed');
        }
    };

    const signup = async (email, password) => {
        const response = await apiFetch('/api/auth/signup', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });

        const text = await response.text();
        const data = text ? JSON.parse(text) : {};

        if (response.ok) {
            toast.success('Account created successfully! Please login.');
            return true;
        } else {
            throw new Error(data.detail || 'Signup failed');
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, signup, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
