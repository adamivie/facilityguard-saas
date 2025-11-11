'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from './api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Organization {
  id: string;
  name: string;
  plan: string;
  status: string;
  email?: string;
  phone?: string;
  website?: string;
}

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    organizationName: string;
  }) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('facilityguard_token');
          if (token) {
            apiClient.setToken(token);
            const profile = await apiClient.getProfile();
            setUser(profile.user);
            setOrganization(profile.organization);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        apiClient.logout();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const result = await apiClient.login({ email, password });
      setUser(result.user);
      setOrganization(result.organization);
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    name: string;
    organizationName: string;
  }) => {
    try {
      await apiClient.register(data);
      // After registration, log the user in
      await login(data.email, data.password);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    apiClient.logout();
    setUser(null);
    setOrganization(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  const refreshProfile = async () => {
    try {
      const profile = await apiClient.getProfile();
      setUser(profile.user);
      setOrganization(profile.organization);
    } catch (error) {
      console.error('Profile refresh failed:', error);
      logout();
    }
  };

  const value: AuthContextType = {
    user,
    organization,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}