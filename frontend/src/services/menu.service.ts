import api from './api';
import { ApiResponse, MenuItem, Promotion } from '../types';

export const menuService = {
  getAll: () =>
    api.get<ApiResponse<MenuItem[]>>('/api/menu').then(r => r.data),

  // Returns all items including unavailable — staff only
  getAllItems: () =>
    api.get<ApiResponse<MenuItem[]>>('/api/menu/all').then(r => r.data),

  getById: (id: number) =>
    api.get<ApiResponse<MenuItem>>(`/api/menu/${id}`).then(r => r.data),

  getCategories: () =>
    api.get<ApiResponse<string[]>>('/api/menu/categories').then(r => r.data),

  getPromotions: () =>
    api.get<ApiResponse<Promotion[]>>('/api/menu/promotions').then(r => r.data),

  create: (data: Partial<MenuItem>) =>
    api.post<ApiResponse<MenuItem>>('/api/menu', data).then(r => r.data),

  update: (id: number, data: Partial<MenuItem>) =>
    api.put<ApiResponse<MenuItem>>(`/api/menu/${id}`, data).then(r => r.data),

  toggle: (id: number) =>
    api.patch<ApiResponse<MenuItem>>(`/api/menu/${id}/toggle`).then(r => r.data),

  delete: (id: number) =>
    api.delete(`/api/menu/${id}`),
};
