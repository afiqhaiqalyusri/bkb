import api from './api';
import { ApiResponse, Recipe, RecipeIngredientRequest } from '../types';

const BASE = '/api/recipes';

export const recipeService = {
  /**
   * Get a summary list of all menu items with their recipe ingredient counts.
   */
  getAll: () =>
    api.get<ApiResponse<Recipe[]>>(BASE).then(r => r.data),

  /**
   * Get (or auto-create) the full recipe for a specific menu item.
   */
  getByMenuItem: (menuItemId: number) =>
    api.get<ApiResponse<Recipe>>(`${BASE}/menu/${menuItemId}`).then(r => r.data),

  /**
   * Update the preparation notes for a recipe.
   */
  updateNotes: (menuItemId: number, notes: string) =>
    api.patch<ApiResponse<Recipe>>(`${BASE}/menu/${menuItemId}/notes`, { notes }).then(r => r.data),

  /**
   * Add an ingredient to a menu item's recipe.
   */
  addIngredient: (menuItemId: number, request: RecipeIngredientRequest) =>
    api.post<ApiResponse<Recipe>>(`${BASE}/menu/${menuItemId}/ingredients`, request).then(r => r.data),

  /**
   * Add multiple ingredients to all menu items in a category.
   */
  addIngredientsToCategory: (category: string, requests: RecipeIngredientRequest[]) =>
    api.post<ApiResponse<Recipe[]>>(`${BASE}/category/${encodeURIComponent(category)}/ingredients`, requests).then(r => r.data),

  /**
   * Update an existing recipe ingredient (quantity, inventory item, or optional flag).
   */
  updateIngredient: (menuItemId: number, ingredientId: number, request: RecipeIngredientRequest) =>
    api.put<ApiResponse<Recipe>>(
      `${BASE}/menu/${menuItemId}/ingredients/${ingredientId}`,
      request
    ).then(r => r.data),

  /**
   * Remove an ingredient from a recipe.
   */
  removeIngredient: (menuItemId: number, ingredientId: number) =>
    api.delete<ApiResponse<Recipe>>(
      `${BASE}/menu/${menuItemId}/ingredients/${ingredientId}`
    ).then(r => r.data),
};
