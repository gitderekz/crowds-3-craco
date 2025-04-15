// src/hooks/useAuth.js
import { useState, useEffect,useCallback } from 'react';
import { api } from '../services/authService';

const useAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
  
    const validateAuth = useCallback(async () => {
      try {
        const response = await api.get('/auth/validate');
        setUser(response.data.user);
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }, []);
  
    useEffect(() => {
      // Only validate if we have a token
      if (localStorage.getItem('accessToken')) {
        validateAuth();
      } else {
        setLoading(false);
      }
    }, [validateAuth]);

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.clear();
      setIsAuthenticated(false);
      setUser(null);
      window.location.href = '/';
    }
  };

  return { isAuthenticated, user, loading, logout, validateAuth };
};

export default useAuth;