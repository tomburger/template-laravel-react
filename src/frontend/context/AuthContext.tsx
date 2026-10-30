import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import i18n, { LANGUAGE_KEY, isSupportedLanguage } from '../i18n';

const AUTH_TOKEN_KEY = 'auth_token';

interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  is_admin: boolean;
  is_deactivated: boolean;
  language: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  isDefaultAdminActive: boolean;
  setDefaultAdminActive: (isActive: boolean) => void;
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
  setLanguage: (language: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isDefaultAdminActive, setIsDefaultAdminActive] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiClient = axios.create({
    baseURL: '/api',
    withCredentials: true,
  });

  apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);

    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  });

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        if (!token) {
          setUser(null);
          setIsDefaultAdminActive(false);
          setIsAuthenticated(false);
          return;
        }

        const response = await apiClient.get('/user');
        setUser(response.data.user);
        setIsDefaultAdminActive(Boolean(response.data.is_default_admin_active));
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        setUser(null);
        setIsDefaultAdminActive(false);
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

      const token = response.data?.token;
      if (token) {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
      }

      setUser(response.data.user);
      setIsDefaultAdminActive(Boolean(response.data.is_default_admin_active));
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
      localStorage.removeItem(AUTH_TOKEN_KEY);
      setUser(null);
      setIsDefaultAdminActive(false);
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
      setIsDefaultAdminActive(Boolean(response.data.is_default_admin_active));
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

  // The user's saved language takes precedence once logged in
  useEffect(() => {
    if (isAuthenticated && isSupportedLanguage(user?.language)) {
      localStorage.setItem(LANGUAGE_KEY, user.language);
      i18n.changeLanguage(user.language);
    }
  }, [isAuthenticated, user?.language]);

  const setLanguage = async (language: string) => {
    if (!isSupportedLanguage(language)) return;
    localStorage.setItem(LANGUAGE_KEY, language);
    await i18n.changeLanguage(language);

    if (isAuthenticated) {
      try {
        const response = await apiClient.put('/user/language', { language });
        setUser(response.data.user);
      } catch (err: any) {
        const message = err.response?.data?.message || 'Failed to update language';
        setError(message);
        throw new Error(message);
      }
    }
  };

  const value: AuthContextType = {
    user,
    isDefaultAdminActive,
    setDefaultAdminActive: setIsDefaultAdminActive,
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
    setLanguage,
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
