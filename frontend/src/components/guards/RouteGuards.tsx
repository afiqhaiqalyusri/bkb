import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { STORAGE_KEYS } from '../../constants/storage';

const ALLOWED_STAFF_ROLES = ['STAFF', 'MANAGER', 'ADMIN'] as const;
const ALLOWED_MANAGER_ROLES = ['MANAGER', 'ADMIN'] as const;

/**
 * Shared loading spinner rendered while the Zustand auth store is hydrating from
 * localStorage. Prevents a premature redirect before authentication state is ready.
 */
const AuthLoadingSpinner: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--background)' }}>
    <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
  </div>
);

/**
 * Redirects authenticated non-customer staff to their appropriate home area.
 * Customers and guests are passed through unchanged.
 */
export const CustomerGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated && user?.role !== 'CUSTOMER' && user?.role !== 'GUEST') {
    if (user?.role === 'MANAGER' || user?.role === 'ADMIN') return <Navigate to="/manager" replace />;
    if (user?.role === 'STAFF') return <Navigate to="/kitchen" replace />;
  }
  return <>{children}</>;
};

/**
 * Requires authentication. Redirects to /login for unauthenticated users.
 * Shows a loading spinner when a token exists but the store has not yet hydrated.
 */
export const CustomerRouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  const hasToken = !!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

  if (hasToken && !isAuthenticated) return <AuthLoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

/**
 * Requires STAFF, MANAGER, or ADMIN role. Redirects to /login otherwise.
 * Shows a loading spinner when a token exists but the store has not yet hydrated.
 */
export const StaffGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  const hasToken = !!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

  if (hasToken && !isAuthenticated) return <AuthLoadingSpinner />;
  if (!isAuthenticated || !user?.role || !(ALLOWED_STAFF_ROLES as readonly string[]).includes(user.role)) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

/**
 * Requires MANAGER or ADMIN role. Redirects to /login otherwise.
 * Shows a loading spinner when a token exists but the store has not yet hydrated.
 */
export const ManagerGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  const hasToken = !!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

  if (hasToken && !isAuthenticated) return <AuthLoadingSpinner />;
  if (!isAuthenticated || !user?.role || !(ALLOWED_MANAGER_ROLES as readonly string[]).includes(user.role)) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

/**
 * Requires ADMIN role. Redirects to /manager for any other authenticated role.
 * Shows a loading spinner when a token exists but the store has not yet hydrated.
 */
export const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  const hasToken = !!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

  if (hasToken && !isAuthenticated) return <AuthLoadingSpinner />;
  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return <Navigate to="/manager" replace />;
  }
  return <>{children}</>;
};
