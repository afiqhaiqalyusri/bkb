import api from './api';
import { ApiResponse } from '../types';

/** Shape of the payment status response from the backend. */
export interface PaymentStatus {
  orderId: number;
  orderNumber: string;
  paymentStatus: 'UNPAID' | 'PAID' | 'FAILED';
  orderStatus: string;
  paymentChannel?: string;
  transactionRef?: string;
  paidAt?: string;
}

/**
 * Payment-specific API calls.
 * Separated from orderService to follow the Single Responsibility Principle —
 * orderService manages order lifecycle, paymentService manages payment operations.
 */
export const paymentService = {
  confirmCash: (orderId: number) =>
    api.patch(`/api/payments/${orderId}/cash-confirm`),

  unconfirmCash: (orderId: number) =>
    api.patch(`/api/payments/${orderId}/cash-unconfirm`),

  confirmOnline: (orderId: number) =>
    api.patch<ApiResponse<void>>(`/api/payments/${orderId}/online-confirm`).then(r => r.data),

  confirmOnlinePost: (ref: string) =>
    api.post<ApiResponse<void>>(`/api/payments/${ref}/online-confirm`).then(r => r.data),

  simulateSuccess: (ref: string) =>
    api.post<ApiResponse<void>>(`/api/payments/${ref}/simulate-success`).then(r => r.data),

  simulateFailure: (ref: string) =>
    api.post<ApiResponse<void>>(`/api/payments/${ref}/simulate-failure`).then(r => r.data),

  getPaymentStatus: (ref: string) =>
    api.get<ApiResponse<PaymentStatus>>(`/api/payments/${ref}/status`).then(r => r.data),
};
