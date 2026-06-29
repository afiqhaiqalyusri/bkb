import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { SessionTimeoutManager } from './components/SessionTimeoutManager';
import { SessionSyncManager } from './components/SessionSyncManager';
import { ConfirmationProvider } from './components/ConfirmationProvider';
import { ErrorBoundary } from './components/ErrorBoundary';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { VerifyOtpPage } from './pages/VerifyOtpPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { VerifyResetOtpPage } from './pages/VerifyResetOtpPage';
import { MenuPage } from './pages/MenuPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { PaymentPage } from './pages/PaymentPage';
import { PaymentResultPage } from './pages/PaymentResultPage';
import { LoyaltyPage } from './pages/LoyaltyPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { OrderHistoryPage } from './pages/OrderHistoryPage';
import { KitchenPage } from './pages/kitchen/KitchenPage';
import { ManagerDashboard } from './pages/manager/ManagerDashboard';
import { ManagerMenu } from './pages/manager/ManagerMenu';
import { ManagerInventory } from './pages/manager/ManagerInventory';
import { ManagerWasteLog } from './pages/manager/ManagerWasteLog';
import { ManagerLoyalty } from './pages/manager/ManagerLoyalty';
import { ManagerSettings } from './pages/manager/ManagerSettings';
import { ManagerUsers } from './pages/manager/ManagerUsers';
import { ManagerCategories } from './pages/manager/ManagerCategories';
import { ManagerIngredients } from './pages/manager/ManagerIngredients';
import { ManagerRecipes } from './pages/manager/ManagerRecipes';
import { ManagerAdvertisements } from './pages/manager/ManagerAdvertisements';
import { SettingsPage } from './pages/SettingsPage';
import { FavouritesPage } from './pages/FavouritesPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';

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

const RootLayout: React.FC = () => {
  return (
    <ConfirmationProvider>
      <SessionTimeoutManager />
      <SessionSyncManager />
      <Outlet />
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
      { path: 'manager/ingredients', element: <ManagerGuard><ManagerIngredients /></ManagerGuard> },
      { path: 'manager/staff', element: <ManagerGuard><Navigate to="/manager/users?tab=staff" replace /></ManagerGuard> },
      { path: 'manager/loyalty', element: <ManagerGuard><ManagerLoyalty /></ManagerGuard> },
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
