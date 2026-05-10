'use client';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { authApi } from '@/utils/api/authApi';
import { setAuthToken, getAuthToken } from '@/utils/api/axiosInstance';

import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  isImpersonating: () => boolean;
  updateUser: (updatedData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router                = useRouter();

  useEffect(() => {
    // On load, always try to fetch the current user.
    // The browser will automatically send the HttpOnly 'token' cookie if it exists.
    authApi.getMe()
      .then(res => {
        const { data } = res.data;
        setUser(data);
        // If the backend returned a new token in the body (fallback), set it in headers
        if (res.data.token) setAuthToken(res.data.token);
      })
      .catch(() => {
        setAuthToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    const { data, token } = res.data;
    
    // 1. Set the token in Axios headers for immediate subsequent requests
    setAuthToken(token);
    
    // 2. Update local state
    setUser(data);
    
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setAuthToken(null);
      setUser(null);
      router.push('/auth/login');
    }
  }, [router]);

  const isImpersonating = useCallback(() => {
    try {
      // Token is HttpOnly, but is also returned in the login response body.
      // We detect impersonation from the user object's flag if available.
      const token = (user as any)?._impersonationToken;
      if (!token) return false;
      const decoded = jwtDecode<{ isImpersonation?: boolean }>(token);
      return decoded.isImpersonation === true;
    } catch { return false; }
  }, [user]);

  const updateUser = useCallback((updatedData: Partial<User>) => {
    setUser((prev) => prev ? ({ ...prev, ...updatedData }) : null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, loading, login, logout, isImpersonating, updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
