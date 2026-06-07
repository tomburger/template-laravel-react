import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, passwordConfirmation: string) => Promise<void>;
  logout: () => Promise<void>;
  verifyEmail: (email: string, token: string) => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, token: string, password: string, passwordConfirmation: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  const apiClient = axios.create({
    baseURL: apiUrl,
    withCredentials: true,
  });

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/user');
        setUser(response.data.user);
        setIsAuthenticated(true);
      } catch {
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const response = await apiClient.post('/login', {
        email,
        password,
      });
      setUser(response.data.user);
      setIsAuthenticated(true);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      throw new Error(message);
    }
  };

  const register = async (name: string, email: string, password: string, passwordConfirmation: string) => {
    try {
      setError(null);
      const response = await apiClient.post('/register', {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      setUser(response.data.user);
      setIsAuthenticated(false); // Wait for email verification
    } catch (err: any) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      throw new Error(message);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await apiClient.post('/logout');
      setUser(null);
      setIsAuthenticated(false);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Logout failed';
      setError(message);
      throw new Error(message);
    }
  };

  const verifyEmail = async (email: string, token: string) => {
    try {
      setError(null);
      const response = await apiClient.post('/verify-email', {
        email,
        token,
      });
      setUser(response.data.user);
      setIsAuthenticated(false); // User needs to login after verification
    } catch (err: any) {
      const message = err.response?.data?.message || 'Email verification failed';
      setError(message);
      throw new Error(message);
    }
  };

  const resendVerificationEmail = async (email: string) => {
    try {
      setError(null);
      await apiClient.post('/resend-verification-email', { email });
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to resend verification email';
      setError(message);
      throw new Error(message);
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      setError(null);
      await apiClient.post('/forgot-password', { email });
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to send password reset email';
      setError(message);
      throw new Error(message);
    }
  };

  const resetPassword = async (email: string, token: string, password: string, passwordConfirmation: string) => {
    try {
      setError(null);
      await apiClient.post('/reset-password', {
        email,
        token,
        password,
        password_confirmation: passwordConfirmation,
      });
    } catch (err: any) {
      const message = err.response?.data?.message || 'Password reset failed';
      setError(message);
      throw new Error(message);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout,
    verifyEmail,
    resendVerificationEmail,
    forgotPassword,
    resetPassword,
    clearError,
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
