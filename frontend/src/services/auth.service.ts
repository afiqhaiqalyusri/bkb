import api from './api';
import { ApiResponse, AuthResponse } from '../types';

export const authService = {
  // ── Registration & Verification ─────────────────────────────
  register: (data: { name: string; email: string; phone?: string; password: string }) =>
    api.post<ApiResponse<void>>('/api/auth/register', data).then(r => r.data),

  verifyEmail: (email: string, code: string) =>
    api.post<ApiResponse<AuthResponse>>('/api/auth/verify-email', { email, code }).then(r => r.data),

  resendVerification: (email: string) =>
    api.post<ApiResponse<void>>('/api/auth/resend-verification', null, { params: { email } }).then(r => r.data),

  // ── Login ────────────────────────────────────────────────────
  login: (email: string, password: string) =>
    api.post<ApiResponse<AuthResponse>>('/api/auth/login', { email, password }).then(r => r.data),

  // ── Guest ────────────────────────────────────────────────────
  guest: (name: string, phone?: string) =>
    api.post<ApiResponse<AuthResponse>>('/api/auth/guest', { name, phone }).then(r => r.data),

  // ── Token Management ─────────────────────────────────────────
  refresh: (refreshToken: string) =>
    api.post<ApiResponse<AuthResponse>>('/api/auth/refresh', { refreshToken }).then(r => r.data),

  // ── Logout — now sends refresh token to fully revoke session ─
  logout: (refreshToken?: string | null, reason?: string) =>
    api.post('/api/auth/logout', { refreshToken: refreshToken ?? null }, {
      params: reason ? { reason } : undefined
    }),

  // ── Password Reset ───────────────────────────────────────────
  forgotPassword: (email: string) =>
    api.post<ApiResponse<void>>('/api/auth/forgot-password', { email }).then(r => r.data),

  resetPassword: (token: string, newPassword: string) =>
    api.post<ApiResponse<void>>('/api/auth/reset-password', { token, newPassword }).then(r => r.data),

  // ── Profile ──────────────────────────────────────────────────
  getProfile: () =>
    api.get<ApiResponse<AuthResponse['user']>>('/api/auth/profile').then(r => r.data),

  updateProfile: (data: { name: string; email: string; phone?: string }) =>
    api.put<ApiResponse<AuthResponse['user']>>('/api/auth/profile', data).then(r => r.data),

  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    api.post<ApiResponse<void>>('/api/auth/change-password', data).then(r => r.data),
};
