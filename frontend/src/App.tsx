import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { SessionTimeoutManager } from './components/SessionTimeoutManager';
import { SessionSyncManager } from './components/SessionSyncManager';
import { ConfirmationProvider } from './components/ConfirmationProvider';
import { ErrorBoundary } from './components/ErrorBoundary';

// Pages - Lazy Loaded
const lazyImport = <T extends React.ComponentType<any>>(
  factory: () => Promise<{ [key: string]: T }>,
  name: string
) => React.lazy(() => factory().then((module) => ({ default: module[name] })));

const LandingPage = lazyImport(() => import('./pages/LandingPage'), 'LandingPage');
const LoginPage = lazyImport(() => import('./pages/LoginPage'), 'LoginPage');
const RegisterPage = lazyImport(() => import('./pages/RegisterPage'), 'RegisterPage');
const VerifyOtpPage = lazyImport(() => import('./pages/VerifyOtpPage'), 'VerifyOtpPage');
const ForgotPasswordPage = lazyImport(() => import('./pages/ForgotPasswordPage'), 'ForgotPasswordPage');
const VerifyResetOtpPage = lazyImport(() => import('./pages/VerifyResetOtpPage'), 'VerifyResetOtpPage');
const MenuPage = lazyImport(() => import('./pages/MenuPage'), 'MenuPage');
const CartPage = lazyImport(() => import('./pages/CartPage'), 'CartPage');
const CheckoutPage = lazyImport(() => import('./pages/CheckoutPage'), 'CheckoutPage');
const PaymentPage = lazyImport(() => import('./pages/PaymentPage'), 'PaymentPage');
const PaymentResultPage = lazyImport(() => import('./pages/PaymentResultPage'), 'PaymentResultPage');
const LoyaltyPage = lazyImport(() => import('./pages/LoyaltyPage'), 'LoyaltyPage');
const OrderTrackingPage = lazyImport(() => import('./pages/OrderTrackingPage'), 'OrderTrackingPage');
const OrderHistoryPage = lazyImport(() => import('./pages/OrderHistoryPage'), 'OrderHistoryPage');
const KitchenPage = lazyImport(() => import('./pages/kitchen/KitchenPage'), 'KitchenPage');
const ManagerDashboard = lazyImport(() => import('./pages/manager/ManagerDashboard'), 'ManagerDashboard');
const ManagerMenu = lazyImport(() => import('./pages/manager/ManagerMenu'), 'ManagerMenu');
const ManagerInventory = lazyImport(() => import('./pages/manager/ManagerInventory'), 'ManagerInventory');
const ManagerWasteLog = lazyImport(() => import('./pages/manager/ManagerWasteLog'), 'ManagerWasteLog');
const ManagerLoyalty = lazyImport(() => import('./pages/manager/ManagerLoyalty'), 'ManagerLoyalty');
const ManagerFeedback = lazyImport(() => import('./pages/manager/ManagerFeedback'), 'ManagerFeedback');
const ManagerSettings = lazyImport(() => import('./pages/manager/ManagerSettings'), 'ManagerSettings');
const ManagerUsers = lazyImport(() => import('./pages/manager/ManagerUsers'), 'ManagerUsers');
const ManagerCategories = lazyImport(() => import('./pages/manager/ManagerCategories'), 'ManagerCategories');
const ManagerRecipes = lazyImport(() => import('./pages/manager/ManagerRecipes'), 'ManagerRecipes');
const ManagerAdvertisements = lazyImport(() => import('./pages/manager/ManagerAdvertisements'), 'ManagerAdvertisements');
const SettingsPage = lazyImport(() => import('./pages/SettingsPage'), 'SettingsPage');
const FavouritesPage = lazyImport(() => import('./pages/FavouritesPage'), 'FavouritesPage');
const ResetPasswordPage = lazyImport(() => import('./pages/ResetPasswordPage'), 'ResetPasswordPage');

// Error Pages
import { NotFoundPage } from './pages/errors/NotFoundPage';
import { AccessDeniedPage } from './pages/errors/AccessDeniedPage';
import { UnauthorizedPage } from './pages/errors/UnauthorizedPage';
import { ServerErrorPage } from './pages/errors/ServerErrorPage';
import { ServiceUnavailablePage } from './pages/errors/ServiceUnavailablePage';
import { PaymentErrorPage } from './pages/errors/PaymentErrorPage';
import { OrderNotFoundPage } from './pages/errors/OrderNotFoundPage';

// Route Guards
import {
  CustomerGuard,
  CustomerRouteGuard,
  StaffGuard,
  ManagerGuard,
  AdminGuard
} from './components/guards/RouteGuards';

const LoadingFallback = () => (
  <div className="flex h-screen w-full items-center justify-center bg-[var(--cream)]">
    <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent"></div>
  </div>
);

const RootLayout: React.FC = () => {
  return (
    <ConfirmationProvider>
      <SessionTimeoutManager />
      <SessionSyncManager />
      <React.Suspense fallback={<LoadingFallback />}>
        <Outlet />
      </React.Suspense>
    </ConfirmationProvider>
  );
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <ServerErrorPage />,
    children: [
      { path: '', element: <LandingPage /> },
      { path: 'login', element: <CustomerGuard><LoginPage /></CustomerGuard> },
      { path: 'register', element: <CustomerGuard><RegisterPage /></CustomerGuard> },
      { path: 'verify-otp', element: <CustomerGuard><VerifyOtpPage /></CustomerGuard> },
      { path: 'forgot-password', element: <CustomerGuard><ForgotPasswordPage /></CustomerGuard> },
      { path: 'verify-reset-otp', element: <CustomerGuard><VerifyResetOtpPage /></CustomerGuard> },
      { path: 'menu', element: <CustomerGuard><MenuPage /></CustomerGuard> },
      { path: 'cart', element: <CustomerGuard><CartPage /></CustomerGuard> },
      { path: 'checkout', element: <CustomerGuard><CheckoutPage /></CustomerGuard> },
      { path: 'payment/result', element: <PaymentResultPage /> },
      { path: 'payment/:orderId', element: <CustomerGuard><PaymentPage /></CustomerGuard> },
      { path: 'payment/error', element: <PaymentErrorPage /> },
      { path: 'loyalty', element: <CustomerRouteGuard><LoyaltyPage /></CustomerRouteGuard> },
      { path: 'order/:id/tracking', element: <CustomerGuard><OrderTrackingPage /></CustomerGuard> },
      { path: 'track/:token', element: <OrderTrackingPage /> },
      { path: 'order/not-found', element: <OrderNotFoundPage /> },
      { path: 'history', element: <CustomerRouteGuard><OrderHistoryPage /></CustomerRouteGuard> },
      { path: 'settings', element: <CustomerRouteGuard><SettingsPage /></CustomerRouteGuard> },
      { path: 'favourites', element: <CustomerRouteGuard><FavouritesPage /></CustomerRouteGuard> },
      
      { path: 'kitchen', element: <StaffGuard><KitchenPage /></StaffGuard> },
      
      { path: 'manager', element: <ManagerGuard><ManagerDashboard /></ManagerGuard> },
      { path: 'manager/menu', element: <ManagerGuard><ManagerMenu /></ManagerGuard> },
      { path: 'manager/inventory', element: <ManagerGuard><ManagerInventory /></ManagerGuard> },
      { path: 'manager/waste', element: <ManagerGuard><ManagerWasteLog /></ManagerGuard> },
      { path: 'manager/categories', element: <ManagerGuard><ManagerCategories /></ManagerGuard> },
      { path: 'manager/ingredients', element: <ManagerGuard><Navigate to="/manager/recipes" replace /></ManagerGuard> },
      { path: 'manager/staff', element: <ManagerGuard><Navigate to="/manager/users?tab=staff" replace /></ManagerGuard> },
      { path: 'manager/loyalty', element: <ManagerGuard><ManagerLoyalty /></ManagerGuard> },
      { path: 'manager/feedback', element: <ManagerGuard><ManagerFeedback /></ManagerGuard> },
      { path: 'manager/users', element: <ManagerGuard><ManagerUsers /></ManagerGuard> },
      { path: 'manager/settings', element: <ManagerGuard><ManagerSettings /></ManagerGuard> },
      { path: 'manager/customers', element: <ManagerGuard><Navigate to="/manager/users?tab=customers" replace /></ManagerGuard> },
      { path: 'manager/recipes', element: <ManagerGuard><ManagerRecipes /></ManagerGuard> },
      { path: 'manager/advertisements', element: <ManagerGuard><ManagerAdvertisements /></ManagerGuard> },
      
      { path: 'reset-password', element: <ResetPasswordPage /> },
      { path: '403', element: <AccessDeniedPage /> },
      { path: '401', element: <UnauthorizedPage /> },
      { path: '500', element: <ServerErrorPage /> },
      { path: '503', element: <ServiceUnavailablePage /> },
      { path: '404', element: <NotFoundPage /> },
      { path: '*', element: <NotFoundPage /> }
    ]
  }
]);

export const App: React.FC = () => {
  React.useEffect(() => {
    let theme = localStorage.getItem('bkb-theme');
    if (!theme) {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      theme = prefersDark ? 'dark' : 'light';
      localStorage.setItem('bkb-theme', theme);
    }
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
      <Toaster position="top-center" toastOptions={{ style: { background: '#333', color: '#fff' } }} />
    </ErrorBoundary>
  );
};

export default App;
