import { createContext, useCallback, useContext, useState } from 'react';
import { auth } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async (username, password, role = 'general') => {
    setLoading(true);
    setError(null);
    try {
      let response;
      if (role === 'faculty') {
        response = await auth.facultyLogin({ username, password });
      } else if (role === 'student') {
        response = await auth.studentLogin({ username, password });
      } else if (role === 'admin') {
        response = await auth.adminLogin({ username, password });
      } else {
        response = await auth.login({ username, password });
      }

      const { tokens, user: userData } = response.data;
      localStorage.setItem('access_token', tokens.access);
      localStorage.setItem('refresh_token', tokens.refresh);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Login failed';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await auth.logout(refreshToken);
      }
    } catch (err) {
      // Silently ignore logout errors - still clear local session
      // This handles cases where server rejects logout request but user wants to logout anyway
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      setUser(null);
      setError(null);
    }
  }, []);

  const register = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await auth.register(userData);
      const { tokens, user: newUser } = response.data;
      localStorage.setItem('access_token', tokens.access);
      localStorage.setItem('refresh_token', tokens.refresh);
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
      return newUser;
    } catch (err) {
      let errorMsg = 'Registration failed';
      
      // Handle different error response formats
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.response?.data?.errors) {
        // Handle serializer validation errors
        const errors = err.response.data.errors;
        const errorMessages = Object.entries(errors)
          .map(([field, messages]) => {
            const msg = Array.isArray(messages) ? messages[0] : messages;
            return `${field}: ${msg}`;
          })
          .join(', ');
        errorMsg = errorMessages || 'Validation failed';
      } else if (err.response?.data) {
        // Generic error handling for other error formats
        errorMsg = JSON.stringify(err.response.data);
      }
      
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    register,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
