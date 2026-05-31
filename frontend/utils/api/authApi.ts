import api from './axiosInstance';
import { User } from '@/types';

// ─── Request Payload Types ──────────────────────────────────────────────────
export interface LoginPayload    { email: string; password: string; mfaToken?: string; }
export interface RegisterPayload { name: string; email: string; password: string; role?: string; department?: string; }
export interface UpdateMePayload { name?: string; email?: string; department?: string; }
export interface GoogleLoginPayload { token: string; role?: string; department?: string; }

// ─── Response Types ─────────────────────────────────────────────────────────
export interface AuthResponse    { success: boolean; token: string; data: User; require2FA?: boolean; message?: string; }
export interface MeResponse      { success: boolean; data: User; }

export const authApi = {
  register: (data: RegisterPayload) => api.post<AuthResponse>('/api/v1/auth/register', data),
  login:    (data: LoginPayload)    => api.post<AuthResponse>('/api/v1/auth/login',    data),
  googleLogin: (data: GoogleLoginPayload) => api.post<AuthResponse>('/api/v1/auth/google', data),
  logout:   ()                      => api.post<{ success: boolean; message: string }>('/api/v1/auth/logout'),
  getMe:    ()                      => api.get<MeResponse>('/api/v1/auth/me'),
  updateMe: (data: UpdateMePayload) => api.put<MeResponse>('/api/v1/auth/me', data),
  forgotPassword: (email: string) => api.post<{ success: boolean; message: string }>('/api/v1/auth/forgotpassword', { email }),
  resetPassword: (token: string, password: string) => api.put<AuthResponse>(`/api/v1/auth/resetpassword/${token}`, { password }),
  generate2FA: () => api.post<{ success: boolean; qrCodeUrl: string; secret: string }>('/api/v1/auth/2fa/generate'),
  verify2FA: (mfaToken: string) => api.post<{ success: boolean; message: string }>('/api/v1/auth/2fa/verify', { mfaToken }),
};
