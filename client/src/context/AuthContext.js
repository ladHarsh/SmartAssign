import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../config/api.config';

const AuthContext = createContext(null);
//done 
export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [userName, setUserName] = useState(null);
    const [loading, setLoading] = useState(true);

    // Modified sessionId logic to be more persistent
    const [sessionId] = useState(() => {
        // First check sessionStorage
        let existingId = sessionStorage.getItem('sessionId');
        
        if (!existingId) {
            // If no sessionId in sessionStorage, check if we have valid token data
            const allKeys = Object.keys(sessionStorage);
            const tokenKey = allKeys.find(key => key.startsWith('token_'));
            
            if (tokenKey) {
                // Extract sessionId from existing token key
                existingId = tokenKey.split('token_')[1];
                sessionStorage.setItem('sessionId', existingId);
            } else {
                // If no existing token, create new sessionId
                existingId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                sessionStorage.setItem('sessionId', existingId);
            }
        }
        
        return existingId;
    });

    // Move the axios interceptor inside the component
    useEffect(() => {
        const interceptor = axios.interceptors.request.use(
            (config) => {
                const token = sessionStorage.getItem(`token_${sessionId}`);
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Cleanup function to remove the interceptor when component unmounts
        return () => {
            axios.interceptors.request.eject(interceptor);
        };
    }, [sessionId]);

    const checkAuthStatus = async () => {
        try {
            const token = sessionStorage.getItem(`token_${sessionId}`);
            
            if (!token) {
                // Check if there's a token with a different sessionId
                const allKeys = Object.keys(sessionStorage);
                const tokenKey = allKeys.find(key => key.startsWith('token_'));
                
                if (tokenKey) {
                    // If found, migrate the old session data to new sessionId
                    const oldSessionId = tokenKey.split('token_')[1];
                    const oldToken = sessionStorage.getItem(`token_${oldSessionId}`);
                    const oldRole = sessionStorage.getItem(`userRole_${oldSessionId}`);
                    const oldName = sessionStorage.getItem(`userName_${oldSessionId}`);
                    
                    // Set new session data
                    sessionStorage.setItem(`token_${sessionId}`, oldToken);
                    sessionStorage.setItem(`userRole_${sessionId}`, oldRole);
                    sessionStorage.setItem(`userName_${sessionId}`, oldName);
                    
                    // Remove old session data
                    sessionStorage.removeItem(`token_${oldSessionId}`);
                    sessionStorage.removeItem(`userRole_${oldSessionId}`);
                    sessionStorage.removeItem(`userName_${oldSessionId}`);
                    
                    // Update state
                    setIsAuthenticated(true);
                    setUserRole(oldRole);
                    setUserName(oldName);
                    setLoading(false);
                    return;
                }
                
                clearSessionData();
                return;
            }

            const response = await axios.get(getApiUrl('/auth/status'), {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.isAuthenticated) {
                setIsAuthenticated(true);
                setUserRole(response.data.userRole);
                setUserName(response.data.userName);
            } else {
                clearSessionData();
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            clearSessionData();
        } finally {
            setLoading(false);
        }
    };

    const clearSessionData = () => {
        const currentSessionId = sessionStorage.getItem('sessionId');
        sessionStorage.removeItem(`token_${currentSessionId}`);
        sessionStorage.removeItem(`userRole_${currentSessionId}`);
        sessionStorage.removeItem(`userName_${currentSessionId}`);
        setIsAuthenticated(false);
        setUserRole(null);
        setUserName(null);
    };

    useEffect(() => {
        checkAuthStatus();
    }, [sessionId]);

    const login = (token, role, name) => {
        sessionStorage.setItem(`token_${sessionId}`, token);
        sessionStorage.setItem(`userRole_${sessionId}`, role);
        sessionStorage.setItem(`userName_${sessionId}`, name);
        setIsAuthenticated(true);
        setUserRole(role);
        setUserName(name);
    };

    const logout = async () => {
        try {
            const token = sessionStorage.getItem(`token_${sessionId}`);
            await axios.post(getApiUrl('/auth/logout'), {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'X-Session-ID': sessionId
                }
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            clearSessionData();
            window.location.href = '/login';
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            userRole,
            userName,
            login,
            logout,
            checkAuthStatus
        }}>
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