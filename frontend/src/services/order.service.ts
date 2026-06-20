import api from './api';
import { ApiResponse, Order } from '../types';

export interface PlaceOrderPayload {
  items: Array<{ menuItemId: number; quantity: number; customisations?: Array<{ ingredient: string; level: string }>; }>;
  paymentMethod: 'ONLINE' | 'CASH';
  paymentChannel?: string;
  pickupTime?: string;
  notes?: string;
  guestName?: string;
  guestPhone?: string;
  promoCode?: string;
}

/**
 * Order lifecycle API calls (placing, tracking, status management).
 * Payment-specific operations (cash confirm, online confirm, simulate) are in payment.service.ts.
 */
export const orderService = {
  placeOrder: (payload: PlaceOrderPayload) =>
    api.post<ApiResponse<Order>>('/api/orders', payload).then(r => r.data),

  getMyOrders: () =>
    api.get<ApiResponse<Order[]>>('/api/orders/my').then(r => r.data),

  getById: (id: number) =>
    api.get<ApiResponse<Order>>(`/api/orders/${id}`).then(r => r.data),

  getAll: (status?: string) =>
    api.get<ApiResponse<Order[]>>('/api/orders', { params: { status } }).then(r => r.data),

  updateStatus: (id: number, status: string) =>
    api.patch<ApiResponse<Order>>(`/api/orders/${id}/status`, { status }).then(r => r.data),

  cancel: (id: number) =>
    api.delete<ApiResponse<Order>>(`/api/orders/${id}/cancel`).then(r => r.data),

  updateDetails: (id: number, payload: { guestName?: string; guestPhone?: string; notes?: string; pickupTime?: string }) =>
    api.patch<ApiResponse<Order>>(`/api/orders/${id}/details`, payload).then(r => r.data),

  getOrderByRef: (ref: string, token?: string) =>
    api.get<ApiResponse<Order>>(`/api/orders/ref/${ref}`, { params: { token } }).then(r => r.data),

  getStoreStatus: () =>
    api.get<ApiResponse<boolean>>('/api/orders/store-status').then(r => r.data),

  validatePromoCode: (code: string) =>
    api.get<ApiResponse<any>>(`/api/promotions/validate?code=${encodeURIComponent(code)}`).then(res => res.data),

  updateStoreStatus: (open: boolean) =>
    api.post<ApiResponse<boolean>>('/api/orders/store-status', { open }).then(r => r.data),

  getIncomingKitchenQueue: () =>
    api.get<ApiResponse<Order[]>>('/api/kitchen/incoming').then(r => r.data),

  getOnHoldOrders: () =>
    api.get<ApiResponse<Order[]>>('/api/orders/on-hold').then(r => r.data),

  getOnHoldCount: () =>
    api.get<ApiResponse<number>>('/api/orders/on-hold/count').then(r => r.data),

  cancelOnHoldOrder: (id: number) =>
    api.delete<ApiResponse<Order>>(`/api/orders/on-hold/${id}`).then(r => r.data),
};
