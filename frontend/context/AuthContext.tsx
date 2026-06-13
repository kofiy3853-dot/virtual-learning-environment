'use client';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { authApi } from '@/utils/api/authApi';
import { adminApi } from '@/utils/api/adminApi';
import { setAuthToken } from '@/utils/api/axiosInstance';
import {
  applySessionToken,
  clearSession,
  getRelayToken,
  getSessionToken,
} from '@/utils/auth/session';

import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, mfaToken?: string) => Promise<{ user?: User; require2FA?: boolean }>;
  loginWithGoogle: (googleToken: string, role?: string, department?: string) => Promise<User>;
  logout: () => void;
  isImpersonating: () => boolean;
  exitImpersonation: () => Promise<void>;
  updateUser: (updatedData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const IMPERSONATION_MAX_AGE = 900; // 15 minutes — matches backend JWT

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router                = useRouter();

  useEffect(() => {
    // Restore token from relay cookie into memory before calling getMe
    const relay = getRelayToken();
    if (relay) {
      setAuthToken(relay);
    }
    // Always attempt getMe — withCredentials: true sends HttpOnly cookie automatically
    // This handles cases where relay cookie is missing but backend session is valid
    authApi.getMe()
      .then(res => {
        setUser(res.data.data);
      })
      .catch(err => {
        // Only clear session on actual auth failure (not network errors)
        // Network errors (backend down) shouldn't log out the user
        if (err?.response?.status === 401) {
          clearSession();
          setUser(null);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string, mfaToken?: string) => {
    const res = await authApi.login({ email, password, mfaToken });
    const { data, token, require2FA } = res.data;

    if (require2FA) {
      return { require2FA: true };
    }

    applySessionToken(token);
    setUser(data);

    return { user: data };
  }, []);

  const loginWithGoogle = useCallback(async (googleToken: string, role?: string, department?: string) => {
    const res = await authApi.googleLogin({ token: googleToken, role, department });
    const { data, token } = res.data;

    applySessionToken(token);
    setUser(data);

    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clearSession();
      setUser(null);
      router.push('/auth/login');
    }
  }, [router]);

  const isImpersonating = useCallback(() => {
    try {
      const token = getSessionToken();
      if (!token) return false;
      const decoded = jwtDecode<{ isImpersonation?: boolean }>(token);
      return decoded.isImpersonation === true;
    } catch {
      return false;
    }
  }, []);

  const exitImpersonation = useCallback(async () => {
    try {
      const res = await adminApi.exitImpersonation();
      applySessionToken(res.data.token);
      const me = await authApi.getMe();
      setUser(me.data.data);
      router.push('/dashboard/admin');
    } catch {
      clearSession();
      setUser(null);
      router.push('/auth/login');
    }
  }, [router]);

  const updateUser = useCallback((updatedData: Partial<User>) => {
    setUser((prev) => prev ? ({ ...prev, ...updatedData }) : null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, loading, login, loginWithGoogle, logout, isImpersonating, exitImpersonation, updateUser
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

/** Apply tokens after admin impersonation (before full-page redirect). */
export function establishImpersonationSession(impersonationToken: string) {
  applySessionToken(impersonationToken, IMPERSONATION_MAX_AGE);
}
