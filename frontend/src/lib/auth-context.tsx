'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'owner' | 'labourer';
  factory_id?: string;
  owner_id?: string;
  name?: string;
  employee_id?: string;
  department?: string;
  factory_name?: string;
  factory_type?: string;
}

interface AuthResponse {
  status: 'success' | 'error';
  user?: User;
  session_token?: string;
  message?: string;
}

interface AuthContextType {
  user: User | null;
  sessionToken: string | null;
  login: (email: string, password: string, role: 'admin' | 'owner' | 'labourer') => Promise<{ success: boolean; message?: string }>;
  register: (email: string, password: string, role: 'admin' | 'owner' | 'labourer') => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem('session_token');
    if (token) {
      verifySession(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifySession = async (token: string) => {
    try {
      const response = await axios.post<AuthResponse>('http://localhost:5001/auth/verify', {
        session_token: token
      });
      
      if (response.data.status === 'success' && response.data.user) {
        setUser(response.data.user);
        setSessionToken(token);
        localStorage.setItem('session_token', token);
      } else {
        localStorage.removeItem('session_token');
      }
    } catch (error) {
      console.error('Session verification failed:', error);
      localStorage.removeItem('session_token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, role: 'admin' | 'owner' | 'labourer'): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await axios.post<AuthResponse>('http://localhost:5001/auth/login', {
        email,
        password,
        role
      });

      if (response.data.status === 'success' && response.data.user && response.data.session_token) {
        // Store user data and session token
        const userData = response.data.user;
        const token = response.data.session_token;
        
        // Save to state
        setUser(userData);
        setSessionToken(token);
        
        // Save to localStorage
        localStorage.setItem('session_token', token);
        
        // Redirect based on role
        switch (userData.role) {
          case 'admin':
            router.push('/admin');
            break;
          case 'owner':
            router.push('/owner');
            break;
          case 'labourer':
            router.push('/dashboard/labourer');
            break;
        }

        return { success: true };
      }
      return { success: false, message: response.data.message || 'Login failed' };
    } catch (error: unknown) {
      console.error('Login failed:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { message?: string } }; code?: string };
        if (axiosError.response?.status === 401) {
          return { success: false, message: 'Invalid credentials. Please check your email, password, and role, or register a new account.' };
        } else if (axiosError.response?.status === 403) {
          return { success: false, message: 'Role mismatch. Please select the correct role for your account.' };
        } else if (axiosError.code === 'ECONNREFUSED') {
          return { success: false, message: 'Cannot connect to server. Please check if the backend is running.' };
        } else {
          return { success: false, message: axiosError.response?.data?.message || 'Login failed. Please try again.' };
        }
      }
      return { success: false, message: 'An unexpected error occurred' };
    }
  };

  const register = async (email: string, password: string, role: 'admin' | 'owner' | 'labourer'): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await axios.post<AuthResponse>('http://localhost:5001/auth/register', {
        email,
        password,
        role
      });

      if (response.data.status === 'success' && response.data.user && response.data.session_token) {
        setUser(response.data.user);
        setSessionToken(response.data.session_token);
        localStorage.setItem('session_token', response.data.session_token);
        return { success: true };
      }
      return { success: false, message: response.data.message || 'Registration failed' };
    } catch (error: unknown) {
      console.error('Registration failed:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { message?: string } }; code?: string };
        if (axiosError.response?.status === 409) {
          return { success: false, message: 'User already exists with this email. Please try logging in instead.' };
        } else if (axiosError.response?.status === 400) {
          return { success: false, message: 'Invalid data provided. Please check your email, password, and role.' };
        } else if (axiosError.code === 'ECONNREFUSED') {
          return { success: false, message: 'Cannot connect to server. Please check if the backend is running.' };
        } else {
          return { success: false, message: axiosError.response?.data?.message || 'Registration failed. Please try again.' };
        }
      }
      return { success: false, message: 'An unexpected error occurred' };
    }
  };

  const logout = () => {
    setUser(null);
    setSessionToken(null);
    localStorage.removeItem('session_token');
  };

  return (
    <AuthContext.Provider value={{ user, sessionToken, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
