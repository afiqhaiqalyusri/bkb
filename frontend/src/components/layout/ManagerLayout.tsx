import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, Package, Trash2, Users, Award,
  Settings, Menu, ChefHat, Tag, Megaphone, LogOut, Bell, Search, Calendar, ChevronDown
} from 'lucide-react';
import { BkbLogo } from '../ui/BkbLogo';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/auth.service';
import toast from 'react-hot-toast';
import { RoleBadge } from '../shared/RoleBadge';

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

// ─── Sidebar ─────────────────────────────────────────────────────────────────
interface ManagerSidebarProps {
  onClose?: () => void;
}

export const ManagerSidebar: React.FC<ManagerSidebarProps> = ({ onClose }) => {
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
    <aside className="w-64 min-h-screen bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col flex-shrink-0 sticky top-0 h-screen overflow-y-auto">
      {/* Brand */}
      <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex-shrink-0">
        <Link to="/manager" className="flex items-center gap-3 no-underline" onClick={onClose}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-red-dark flex items-center justify-center flex-shrink-0 shadow-sm">
            <BkbLogo size={22} showText={false} color="#fff" />
          </div>
          <div>
            <div className="text-base font-bold text-gray-900 dark:text-white tracking-tight">
              {user?.role === 'ADMIN' ? 'Admin Portal' : 'Manager Portal'}
            </div>
            <div className="mt-1">
              <RoleBadge role={user?.role || 'MANAGER'} size="sm" />
            </div>
          </div>
        </Link>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 p-4 flex flex-col gap-1">
        <div className="text-[0.65rem] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest px-3 py-2 mb-1">
          Menu
        </div>
        {filteredNavItems.map(item => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                active 
                  ? 'bg-orange-50 text-primary dark:bg-orange-900/20 dark:text-primary' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
              }`}
            >
              <Icon size={18} className={`${active ? 'text-primary' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
              <span className={`flex-1 text-sm ${active ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="bg-red-500 text-white text-[0.6rem] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* Separator */}
        <div className="h-px bg-gray-100 dark:bg-slate-800 my-4 mx-2" />
        <div className="text-[0.65rem] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest px-3 py-2 mb-1">
          System
        </div>
        {BOTTOM_NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                active 
                  ? 'bg-orange-50 text-primary dark:bg-orange-900/20 dark:text-primary' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
              }`}
            >
              <Icon size={18} className={`${active ? 'text-primary' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
              <span className={`flex-1 text-sm ${active ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  // Prevent browser back navigation in manager area
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

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex text-gray-900 dark:text-gray-100 font-sans" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <ManagerSidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[200] flex"
          onClick={() => setSidebarOpen(false)}
        >
          <div onClick={e => e.stopPropagation()} className="z-[201]">
            <ManagerSidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Top Navigation Bar */}
        <header className="h-[72px] px-6 lg:px-8 bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between flex-shrink-0 z-10 shadow-sm">
          
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>

            {/* Global Search (Visual Only for now) */}
            <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg w-64 text-sm text-gray-400">
              <Search size={16} />
              <span>Search...</span>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4 lg:gap-6">
            
            {/* Date Display */}
            <div className="hidden lg:flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
              <Calendar size={16} />
              <span>{today}</span>
            </div>
            
            <div className="hidden lg:block w-px h-6 bg-gray-200 dark:bg-slate-700"></div>

            {/* Notifications */}
            <button className="relative p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-800"></span>
            </button>

            {/* Profile Dropdown (Simplified for layout) */}
            <div className="flex items-center gap-3 pl-2 lg:pl-0">
              <div className="w-9 h-9 rounded-full bg-orange-100 text-primary dark:bg-orange-900/30 flex items-center justify-center font-bold text-sm border border-orange-200 dark:border-orange-800">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'M'}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-semibold text-gray-900 dark:text-white leading-tight mb-1">
                  {user?.name || 'Manager'}
                </div>
                <RoleBadge role={user?.role || 'MANAGER'} size="sm" />
              </div>
              <button 
                onClick={handleLogout}
                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors ml-1"
                title="Log out"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* Page Header Area (Title & Tabs) */}
        <div className="bg-white dark:bg-slate-800 px-6 lg:px-8 py-5 border-b border-gray-100 dark:border-slate-700 flex flex-col gap-4 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
            {headerAction && <div>{headerAction}</div>}
          </div>

          {/* Tabs */}
          {tabs && tabs.length > 0 && (
            <div className="flex overflow-x-auto scrollbar-hide -mb-5 gap-6 border-t border-gray-100 dark:border-slate-700 pt-1 mt-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={tab.onClick}
                  className={`py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    tab.active 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-slate-400 dark:hover:text-gray-300 dark:hover:border-slate-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-900 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto w-full">
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
