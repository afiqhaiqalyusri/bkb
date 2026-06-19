import api from './api';
import { ApiResponse, MenuItemIngredient } from '../types';

export interface IngredientOutage {
  name: string;
  outOfStock: boolean;
}

export const ingredientService = {
  getAll: () =>
    api.get<ApiResponse<IngredientOutage[]>>('/api/ingredients/outage').then(r => r.data),

  toggle: (name: string) =>
    api.patch<ApiResponse<IngredientOutage>>(`/api/ingredients/outage/${name}/toggle`).then(r => r.data),

  getByMenuItem: (menuItemId: number) =>
    api.get<ApiResponse<MenuItemIngredient[]>>(`/api/ingredients/item/${menuItemId}`).then(r => r.data),

  create: (data: { menuItemId: number; ingredientName: string; defaultLevel: string }) =>
    api.post<ApiResponse<MenuItemIngredient>>('/api/ingredients', data).then(r => r.data),

  update: (id: number, data: { menuItemId: number; ingredientName: string; defaultLevel: string }) =>
    api.put<ApiResponse<MenuItemIngredient>>(`/api/ingredients/${id}`, data).then(r => r.data),

  delete: (id: number) =>
    api.delete<ApiResponse<void>>(`/api/ingredients/${id}`).then(r => r.data),
};
