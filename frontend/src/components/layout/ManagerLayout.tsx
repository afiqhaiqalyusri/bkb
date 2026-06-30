import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, Package, Trash2, Users, Award,
  Settings, Menu, ChefHat, Tag, Megaphone, LogOut, Bell, Search, ChevronLeft
} from 'lucide-react';
import { BkbLogo } from '../ui/BkbLogo';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/auth.service';
import toast from 'react-hot-toast';

// ─── Nav Item Definition ─────────────────────────────────────────────────────
interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  badge?: number;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/manager',           label: 'Dashboard',    icon: LayoutDashboard, exact: true },
  { path: '/manager/menu',      label: 'Menu',         icon: ShoppingBag },
  { path: '/manager/recipes',   label: 'Recipes',      icon: ChefHat },
  { path: '/manager/inventory', label: 'Inventory',    icon: Package },
  { path: '/manager/waste',     label: 'Waste Log',    icon: Trash2 },
  { path: '/manager/users',     label: 'Users',        icon: Users },
  { path: '/manager/loyalty',   label: 'Loyalty',      icon: Award },
  { path: '/manager/advertisements', label: 'Ads',     icon: Megaphone },
  { path: '/manager/categories',label: 'Categories',   icon: Tag },
];

const BOTTOM_NAV_ITEMS: NavItem[] = [
  { path: '/manager/settings',  label: 'Settings',     icon: Settings },
];

// ─── Header Navigation ───────────────────────────────────────────────────────
const HeaderNavigation: React.FC = () => {
  const location = useLocation();
  const { user } = useAuthStore();

  const isActive = (item: NavItem) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname === item.path || location.pathname.startsWith(item.path + '/');
  };

  const filteredNavItems = NAV_ITEMS.filter(item => {
    if (item.adminOnly && user?.role !== 'ADMIN') return false;
    return true;
  });

  return (
    <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-1">
      {filteredNavItems.map(item => {
        const active = isActive(item);
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-colors flex items-center gap-2 ${
              active 
                ? 'bg-[#111111] text-white shadow-sm' 
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
};

// ─── Manager Layout ───────────────────────────────────────────────────────────
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

export const ManagerLayout: React.FC<ManagerLayoutProps> = ({
  children,
  title,
  subtitle,
  tabs,
  headerAction,
}) => {
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

  const renderTabs = () => {
    if (!tabs || tabs.length === 0) return null;
    return (
      <div className="flex items-center gap-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={tab.onClick}
            className={`text-[13px] font-bold px-4 py-2 rounded-lg transition-colors border ${
              tab.active 
                ? 'bg-gray-900 text-white border-gray-900 shadow-sm' 
                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="h-screen w-full bg-[#F3F4F6] flex p-3 lg:p-6 overflow-hidden box-border font-sans text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* Massive White Floating Canvas */}
      <div className="flex-1 bg-white rounded-[32px] shadow-sm flex flex-col min-w-0 h-full relative overflow-hidden border border-gray-100">
        
        {/* Top Header */}
        <header className="h-20 flex items-center justify-between px-6 lg:px-10 flex-shrink-0 z-10 w-full border-b border-gray-50 bg-white">
          
          {/* Left: Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B00] to-[#E65100] flex items-center justify-center shadow-sm">
               <BkbLogo size={20} showText={false} color="#fff" />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900 hidden lg:block">BKB Admin</span>
          </div>

          {/* Center: Main Navigation */}
          <div className="hidden lg:flex flex-1 justify-center max-w-3xl mx-8">
            <HeaderNavigation />
          </div>

          {/* Right: Actions & Profile */}
          <div className="flex items-center justify-end gap-3 lg:gap-5 flex-shrink-0">
            <button onClick={handleLogout} title="Log out" className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors">
              <LogOut size={18} />
            </button>
            <button className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors relative">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <button className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors">
              <Settings size={18} />
            </button>

            {/* Profile */}
            <div className="hidden sm:flex items-center gap-3 ml-2 border-l border-gray-200 pl-5">
              <div className="text-right">
                <div className="text-sm font-bold text-gray-900">{user?.name || 'Administrator'}</div>
                <div className="text-xs text-gray-500 font-medium">{user?.email || 'admin@bkb.com'}</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center border-2 border-white shadow-sm font-bold text-orange-600">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Navigation (Scrollable) */}
        <div className="lg:hidden w-full px-4 py-2 border-b border-gray-50 bg-white">
          <HeaderNavigation />
        </div>

        {/* Inner Header (Page Title & Tabs) */}
        <div className="px-6 lg:px-10 pt-8 pb-4 flex flex-col lg:flex-row lg:items-end justify-between gap-6 flex-shrink-0 bg-white">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-1">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-gray-500 font-medium">
                {subtitle}
              </p>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
             {renderTabs()}
             {headerAction && <div>{headerAction}</div>}
          </div>
        </div>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 bg-white">
          <div className="w-full max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};
