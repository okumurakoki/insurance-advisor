import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import api from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userId: string, password: string, accountType: 'parent' | 'child' | 'grandchild') => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await api.verifyToken();
        if (response.valid) {
          setUser(response.user);
        } else {
          localStorage.removeItem('token');
        }
      }
    } catch (error) {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (userId: string, password: string, accountType: 'parent' | 'child' | 'grandchild') => {
    const response = await api.login({ userId, password, accountType });
    localStorage.setItem('token', response.token);
    setUser(response.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/login';
  };

  const refreshUser = async () => {
    try {
      const profile = await api.getProfile();
      setUser(profile);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};