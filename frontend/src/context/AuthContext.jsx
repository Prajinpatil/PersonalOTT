import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('ott_token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        setUser(res.data.user);
      } catch (err) {
        console.error('Failed to verify token', err);
        setToken(null);
        setUser(null);
        localStorage.removeItem('ott_token');
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, [token]);

  const login = async (email, password) => {
    setError(null);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token: newToken, user: userData } = res.data;
      localStorage.setItem('ott_token', newToken);
      setToken(newToken);
      setUser(userData);
      return userData;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Login failed. Please check credentials.';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const register = async (name, email, password, role = 'user') => {
    setError(null);
    try {
      const res = await api.post('/auth/register', { name, email, password, role });
      const { token: newToken, user: userData } = res.data;
      localStorage.setItem('ott_token', newToken);
      setToken(newToken);
      setUser(userData);
      return userData;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Registration failed.';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const logout = () => {
    localStorage.removeItem('ott_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        register,
        logout,
        isAdmin: user?.role === 'admin',
      }}
    >
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
