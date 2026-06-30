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
    <aside className="w-24 min-h-full bg-transparent flex flex-col items-center flex-shrink-0 pt-4 pb-4 overflow-y-auto scrollbar-hide">
      {/* Brand */}
      <div className="mb-8 flex-shrink-0">
        <Link to="/manager" className="flex flex-col items-center gap-2 no-underline" onClick={onClose}>
          <div className="text-white flex items-center justify-center drop-shadow-md">
            <BkbLogo size={36} showText={false} color="#fff" />
          </div>
          <span className="text-[10px] font-bold text-white tracking-widest uppercase">BKB</span>
        </Link>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 flex flex-col gap-6 w-full items-center">
        {filteredNavItems.map(item => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`flex flex-col items-center gap-1.5 transition-all duration-200 group relative w-full ${active ? '' : 'opacity-50 hover:opacity-100'}`}
            >
              <div className={`w-11 h-11 flex items-center justify-center rounded-full transition-all duration-300 ${active ? 'bg-white text-slate-800 shadow-md' : 'text-white'}`}>
                <Icon size={18} strokeWidth={active ? 2.5 : 2} className={active ? '' : 'group-hover:scale-110 transition-transform'} />
              </div>
              <span className={`text-[9px] uppercase tracking-wider font-bold ${active ? 'text-white' : 'text-slate-300'}`}>
                {item.label}
              </span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute top-0 right-4 bg-primary text-white text-[9px] font-bold px-1.5 rounded-full border-2 border-slate-800">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* Separator */}
        <div className="w-8 h-px bg-slate-600/50 my-1 flex-shrink-0" />

        {BOTTOM_NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`flex flex-col items-center gap-1.5 transition-all duration-200 group relative w-full ${active ? '' : 'opacity-50 hover:opacity-100'}`}
            >
              <div className={`w-11 h-11 flex items-center justify-center rounded-full transition-all duration-300 ${active ? 'bg-white text-slate-800 shadow-md' : 'text-white'}`}>
                <Icon size={18} strokeWidth={active ? 2.5 : 2} className={active ? '' : 'group-hover:scale-110 transition-transform'} />
              </div>
              <span className={`text-[9px] uppercase tracking-wider font-bold ${active ? 'text-white' : 'text-slate-300'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile avatar at bottom */}
      <div className="mt-8 flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center border-2 border-slate-600 text-white font-bold text-sm shadow-md">
          {user?.name ? user.name.charAt(0).toUpperCase() : 'M'}
        </div>
      </div>
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
  const { clearAuth } = useAuthStore();
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
      <div className="flex items-center justify-center gap-8 flex-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={tab.onClick}
            className={`text-[11px] font-bold uppercase tracking-widest transition-colors pb-1 border-b-2 ${
              tab.active 
                ? 'border-white text-white' 
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="h-screen w-full bg-slate-800 flex text-white font-sans p-2 lg:p-4 overflow-hidden box-border" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex">
        <ManagerSidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/90 z-[200] flex backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        >
          <div onClick={e => e.stopPropagation()} className="z-[201] bg-slate-800 h-full">
            <ManagerSidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        
        {/* Top Header (Dark Area) */}
        <header className="h-[64px] flex items-center justify-between px-4 lg:px-6 flex-shrink-0 z-10 w-full mb-2">
          
          <div className="flex items-center gap-4 flex-1">
            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 -ml-2 rounded-lg text-white hover:bg-slate-700 transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>

            {/* Back Button / Title */}
            <div className="hidden lg:flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => window.history.back()}>
              <div className="w-6 h-6 rounded-full bg-white text-slate-800 flex items-center justify-center">
                <ChevronLeft size={14} strokeWidth={3} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-white">Back</span>
            </div>
            
            {/* If no tabs, we can show the title here */}
            {(!tabs || tabs.length === 0) && (
              <span className="lg:hidden text-sm font-bold uppercase tracking-wider ml-2">{title}</span>
            )}
          </div>

          {/* Central Tabs */}
          <div className="hidden md:flex flex-1 justify-center">
             {renderTabs()}
          </div>

          {/* Right Actions */}
          <div className="flex items-center justify-end gap-4 lg:gap-6 flex-1">
            <button className="text-slate-300 hover:text-white transition-colors">
              <Search size={18} />
            </button>
            <button className="text-slate-300 hover:text-white transition-colors relative">
              <Bell size={18} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-slate-800"></span>
            </button>

            {/* Simulated Team Members */}
            <div className="hidden lg:flex items-center gap-3">
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-orange-500 border-2 border-slate-800 flex items-center justify-center text-[8px] font-bold">M</div>
                <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-slate-800 flex items-center justify-center text-[8px] font-bold">S</div>
                <div className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-800 flex items-center justify-center text-[8px] font-bold">K</div>
              </div>
              <span className="text-[10px] font-semibold text-slate-300">12 members</span>
            </div>

            <button 
              onClick={handleLogout}
              className="p-1.5 text-slate-300 hover:text-red-400 transition-colors"
              title="Log out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Mobile Tabs */}
        <div className="md:hidden w-full px-4 mb-3">
           {renderTabs()}
        </div>

        {/* White Rounded Canvas */}
        <div className="flex-1 bg-white text-gray-900 dark:bg-slate-900 dark:text-gray-100 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden relative">
          
          {/* Header inside the white canvas for Page Title & Action */}
          <div className="px-8 lg:px-10 pt-8 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4 flex-shrink-0">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 font-medium">
                  {subtitle}
                </p>
              )}
            </div>
            {headerAction && <div>{headerAction}</div>}
          </div>

          {/* Scrollable Main Content */}
          <main className="flex-1 overflow-y-auto p-8 lg:p-10 pt-4">
            <div className="w-full">
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
