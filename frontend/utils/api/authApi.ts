import api from './axiosInstance';
import { User } from '@/types';

// ─── Request Payload Types ──────────────────────────────────────────────────
export interface LoginPayload    { email: string; password: string; }
export interface RegisterPayload { name: string; email: string; password: string; role?: string; department?: string; }
export interface UpdateMePayload { name?: string; email?: string; department?: string; }
export interface GoogleLoginPayload { token: string; role?: string; department?: string; }

// ─── Response Types ─────────────────────────────────────────────────────────
export interface AuthResponse    { success: boolean; token: string; data: User; }
export interface MeResponse      { success: boolean; data: User; }

export const authApi = {
  register: (data: RegisterPayload) => api.post<AuthResponse>('/api/auth/register', data),
  login:    (data: LoginPayload)    => api.post<AuthResponse>('/api/auth/login',    data),
  googleLogin: (data: GoogleLoginPayload) => api.post<AuthResponse>('/api/auth/google', data),
  logout:   ()                      => api.post<{ success: boolean; message: string }>('/api/auth/logout'),
  getMe:    ()                      => api.get<MeResponse>('/api/auth/me'),
  updateMe: (data: UpdateMePayload) => api.put<MeResponse>('/api/auth/me', data),
};
