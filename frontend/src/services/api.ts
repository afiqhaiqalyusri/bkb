import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { STORAGE_KEYS } from '../constants/storage';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:8081'),
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 15000, // 15 seconds request timeout
});

// Request interceptor — attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;

/** Request queue entry while a token refresh is in progress. */
interface QueuedRequest {
  resolve: (token: string | null) => void;
  reject: (error: unknown) => void;
}
let failedQueue: QueuedRequest[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor — handle 401 & auto refresh
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // If no refresh token exists, clear auth and redirect
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (!refreshToken) {
        useAuthStore.getState().clearAuth();
        window.location.href = '/';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise<string | null>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Use the same base URL as the api instance — works in both dev and prod via Nginx
        const refreshUrl = `${import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:8081')}/api/auth/refresh`;
        const res = await axios.post(refreshUrl, { refreshToken }, { withCredentials: true });
        const { accessToken: newAccess, refreshToken: newRefresh, user } = res.data.data;

        // Update Zustand store and localStorage
        useAuthStore.getState().setAuth(user, newAccess, newRefresh);

        processQueue(null, newAccess);

        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().clearAuth();
        window.location.href = '/';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
