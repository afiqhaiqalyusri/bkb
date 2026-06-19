import api from './api';
import {
  ApiResponse,
  StaffMember,
  WasteEntry,
  LoyaltyReward,
  LoyaltyAccountManagerDetail,
  PageResponse,
  SecurityLog
} from '../types';

export const staffService = {
  getAll: () =>
    api.get<ApiResponse<StaffMember[]>>('/api/staff').then(r => r.data),

  add: (staff: Record<string, string>) =>
    api.post<ApiResponse<StaffMember>>('/api/staff', staff).then(r => r.data),

  update: (id: number, data: Record<string, string>) =>
    api.put<ApiResponse<StaffMember>>(`/api/staff/${id}`, data).then(r => r.data),

  delete: (id: number) =>
    api.delete<ApiResponse<void>>(`/api/staff/${id}`).then(r => r.data),

  updateDocuments: (id: number, docs: Record<string, string>) =>
    api.put<ApiResponse<void>>(`/api/staff/${id}/documents`, docs).then(r => r.data),
  
  getSecurityLogs: (page = 0, size = 50) =>
    api.get<ApiResponse<PageResponse<SecurityLog>>>(`/api/staff/security-logs?page=${page}&size=${size}`).then(r => r.data),

  toggleStatus: (id: number) =>
    api.put<ApiResponse<void>>(`/api/staff/${id}/status`).then(r => r.data),
};

export const wasteService = {
  getWasteLog: (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    return api.get<ApiResponse<WasteEntry[]>>(`/api/inventory/transactions/waste?${params}`).then(r => r.data);
  },
};

export const loyaltyManagerService = {
  getAllRewards: () =>
    api.get<ApiResponse<LoyaltyReward[]>>('/api/loyalty/rewards/all').then(r => r.data),

  getAllAccounts: () =>
    api.get<ApiResponse<LoyaltyAccountManagerDetail[]>>('/api/loyalty/accounts').then(r => r.data),

  createReward: (name: string, pointsCost: number, menuItemId?: number | null, description?: string | null, imageUrl?: string | null) =>
    api.post<ApiResponse<LoyaltyReward>>('/api/loyalty/rewards', { name, pointsCost, menuItemId, description, imageUrl }).then(r => r.data),

  updateReward: (id: number, data: { name?: string; pointsCost?: number; isActive?: boolean; menuItemId?: number | null; description?: string | null; imageUrl?: string | null }) =>
    api.put<ApiResponse<LoyaltyReward>>(`/api/loyalty/rewards/${id}`, data).then(r => r.data),

  deleteReward: (id: number) =>
    api.delete<ApiResponse<void>>(`/api/loyalty/rewards/${id}`).then(r => r.data),

  adjustPoints: (id: number, points: number, reason?: string) =>
    api.post<ApiResponse<void>>(`/api/loyalty/accounts/${id}/adjust`, { points, reason }).then(r => r.data),
};
