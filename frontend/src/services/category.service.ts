import api from './api';
import { ApiResponse, Category } from '../types';

export const categoryService = {
  getAll: () =>
    api.get<ApiResponse<Category[]>>('/api/categories').then(r => r.data),

  create: (name: string) =>
    api.post<ApiResponse<Category>>('/api/categories', { name }).then(r => r.data),

  delete: (id: number) =>
    api.delete<ApiResponse<void>>(`/api/categories/${id}`).then(r => r.data),
};
