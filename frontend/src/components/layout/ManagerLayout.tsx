import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, Package, Trash2, Users, Award,
  Settings, Menu as MenuIcon, ChefHat, Tag, Megaphone, LogOut, Bell, X, MessageSquare
} from 'lucide-react';
import { BkbLogo } from '../ui/BkbLogo';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/auth.service';
import toast from 'react-hot-toast';

// ─── Nav Item Definition ──────────────────────────────────────────────────────
interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/manager',                label: 'Dashboard',  icon: LayoutDashboard, exact: true },
  { path: '/manager/menu',           label: 'Menu',       icon: ShoppingBag },
  { path: '/manager/recipes',        label: 'Recipes',    icon: ChefHat },
  { path: '/manager/inventory',      label: 'Inventory',  icon: Package },
  { path: '/manager/waste',          label: 'Waste Log',  icon: Trash2 },
  { path: '/manager/users',          label: 'Users',      icon: Users },
  { path: '/manager/feedback',       label: 'Feedback',   icon: MessageSquare },
  { path: '/manager/loyalty',        label: 'Loyalty',    icon: Award },
  { path: '/manager/advertisements', label: 'Ads',        icon: Megaphone },
  { path: '/manager/categories',     label: 'Categories', icon: Tag },
];

// ─── Pill Nav ─────────────────────────────────────────────────────────────────
const PillNav: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const location = useLocation();
  const { user } = useAuthStore();

  const isActive = (item: NavItem) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname === item.path || location.pathname.startsWith(item.path + '/');
  };

  const items = NAV_ITEMS.filter(item => {
    if (item.adminOnly && user?.role !== 'ADMIN') return false;
    return true;
  });

  return (
    <nav className="flex items-center gap-1">
      {items.map(item => {
        const active = isActive(item);
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={`
              whitespace-nowrap px-3.5 py-1.5 rounded-md text-[13px] font-semibold
              transition-all duration-150 flex-shrink-0
              ${active
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}
            `}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
};

// ─── Layout Props ─────────────────────────────────────────────────────────────
export interface ManagerTab {
  id: string;
  label: string;
  active: boolean;
  onClick: () => void;
}

interface ManagerLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  tabs?: ManagerTab[];
  headerAction?: React.ReactNode;
}

// ─── Manager Layout ───────────────────────────────────────────────────────────
export const ManagerLayout: React.FC<ManagerLayoutProps> = ({
  children,
  title,
  subtitle,
  tabs,
  headerAction,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const preventBack = () => {
      window.history.pushState(null, '', window.location.href);
      toast('Navigation locked for security', { id: 'nav-lock-manager', icon: '🛡️' });
    };
    window.addEventListener('popstate', preventBack);
    return () => window.removeEventListener('popstate', preventBack);
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // ignore
    } finally {
      clearAuth();
      navigate('/login', { replace: true });
      toast.success('Logged out successfully');
    }
  };

  return (
    <div
      className="h-screen w-screen overflow-hidden flex flex-col bg-[#F0F2F5]"
      style={{ fontFamily: "'Inter', 'DM Sans', sans-serif" }}
    >
      {/* ── TOP NAVIGATION BAR ── */}
      <header className="flex-shrink-0 bg-white border-b border-gray-100 px-4 lg:px-8 h-[60px] flex items-center justify-between gap-4 z-50">

        {/* Left: Brand */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF6B00] to-[#E65100] flex items-center justify-center shadow">
            <BkbLogo size={16} showText={false} color="#fff" />
          </div>
          <span className="text-[15px] font-bold tracking-tight text-gray-900 hidden sm:block">BKB Admin</span>
        </div>

        {/* Center: Pill Navigation — desktop only */}
        <div className="hidden lg:flex flex-1 justify-center overflow-x-auto scrollbar-hide px-4">
          <PillNav />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Notification */}
          <button className="relative w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
            <Bell size={17} />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full ring-1 ring-white" />
          </button>

          {/* Profile + Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-gray-100 ml-1">
            <div className="hidden sm:block text-right">
              <div className="text-[13px] font-bold text-gray-900 leading-tight">{user?.name || 'Administrator'}</div>
              <div className="text-[11px] text-gray-400">{user?.email || 'admin@bkb.com'}</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-orange-100 border-2 border-white shadow flex items-center justify-center font-bold text-orange-600 text-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <button
              onClick={handleLogout}
              title="Log out"
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors ml-1"
            >
              <LogOut size={15} />
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 ml-1"
            onClick={() => setMobileMenuOpen(true)}
          >
            <MenuIcon size={18} />
          </button>
        </div>
      </header>

      {/* ── MOBILE DRAWER ── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-[999] bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="absolute top-0 left-0 h-full w-72 bg-white shadow-2xl flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 h-[60px] border-b border-gray-100">
              <span className="font-bold text-gray-900">Navigation</span>
              <button onClick={() => setMobileMenuOpen(false)} className="text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
              {NAV_ITEMS.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <item.icon size={17} />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* ── PAGE BODY ── */}
      <div className="flex-1 overflow-hidden flex flex-col p-3 lg:p-5">

        {/* White canvas */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden flex flex-col">

          {/* Page title bar */}
          <div className="flex-shrink-0 px-6 lg:px-8 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-[22px] font-bold tracking-tight text-gray-900 leading-tight">{title}</h1>
              {subtitle && <p className="text-[13px] text-gray-500 mt-0.5">{subtitle}</p>}
            </div>

            {/* Tabs + action on the right */}
            {(tabs && tabs.length > 0) || headerAction ? (
              <div className="flex items-center gap-3 flex-wrap">
                {tabs && tabs.length > 0 && (
                  <div className="flex items-center gap-1.5 bg-gray-100 rounded-xl p-1">
                    {tabs.map(tab => (
                      <button
                        key={tab.id}
                        onClick={tab.onClick}
                        className={`px-3.5 py-1.5 rounded-lg text-[12px] font-bold transition-all ${
                          tab.active
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-800'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}
                {headerAction && <div>{headerAction}</div>}
              </div>
            ) : null}
          </div>

          {/* Scrollable content */}
          <main className="flex-1 overflow-y-auto">
            <div className="p-6 lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};
