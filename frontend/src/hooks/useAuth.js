// src/hooks/useAuth.js
import { useState, useEffect, useCallback } from 'react';
import { api, clearTokens, getUser } from '../services/authService';

const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const validateAuth = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      setLoading(false);
      setIsAuthenticated(false);
      setUser(null);
      return;
    }
    
    try {
      const response = await api.get('/auth/validate');
      const userData = response.data.user;
      setUser(userData);
      setIsAuthenticated(true);
      // Update localStorage with latest user data
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Auth validation error:', error);
      // Clear invalid tokens
      clearTokens();
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    validateAuth();
  }, [validateAuth]);

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearTokens();
      setIsAuthenticated(false);
      setUser(null);
      window.location.href = '/';
    }
  };

  return { isAuthenticated, user, loading, logout, validateAuth };
};

export default useAuth;