import api from './api';
import { ApiResponse, InventoryItem } from '../types';

export const inventoryService = {
  getAll: () =>
    api.get<ApiResponse<InventoryItem[]>>('/api/inventory').then(r => r.data),

  getLowStock: () =>
    api.get<ApiResponse<InventoryItem[]>>('/api/inventory/low-stock').then(r => r.data),

  create: (data: Partial<InventoryItem>) =>
    api.post<ApiResponse<InventoryItem>>('/api/inventory', data).then(r => r.data),

  update: (id: number, data: Partial<InventoryItem>) =>
    api.put<ApiResponse<InventoryItem>>(`/api/inventory/${id}`, data).then(r => r.data),

  adjust: (id: number, quantity: number, type: string, reason?: string) =>
    api.post<ApiResponse<InventoryItem>>(`/api/inventory/${id}/adjust`, { quantity, type, reason }),
};
