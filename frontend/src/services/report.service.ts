import api from './api';
import { ApiResponse, SalesReport } from '../types';

export const reportService = {
  getDailySales: (from: string, to: string) =>
    api.get<ApiResponse<SalesReport>>('/api/reports/sales/daily', { params: { from, to } }).then(r => r.data),

  getTopSelling: (days = 30) =>
    api.get<ApiResponse<SalesReport>>('/api/reports/items/top-selling', { params: { days } }).then(r => r.data),

  getExecutiveDashboard: (from: string, to: string) =>
    api.get<ApiResponse<any>>('/api/reports/executive', { params: { from, to } }).then(r => r.data),

  getMenuAnalytics: (from: string, to: string) =>
    api.get<ApiResponse<any>>('/api/reports/menu-analytics', { params: { from, to } }).then(r => r.data),

  exportCsv: (from: string, to: string) =>
    api.get('/api/reports/export', { params: { type: 'csv', from, to }, responseType: 'blob' }),

  getStaffPerformance: (from: string, to: string) =>
    api.get<ApiResponse<any>>('/api/reports/staff-performance', { params: { from, to } }).then(r => r.data),
};
