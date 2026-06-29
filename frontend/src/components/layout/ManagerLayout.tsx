import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, Package, Trash2, Users, Award,
  Settings, Menu, ChefHat, Tag, Megaphone, LogOut, Bell, Search, Calendar,
  ChevronLeft, ChevronRight, Sparkles, Plus, AlertTriangle, Database, Activity, RefreshCw
} from 'lucide-react';
import { BkbLogo } from '../ui/BkbLogo';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/auth.service';
import toast from 'react-hot-toast';
import { RoleBadge } from '../shared/RoleBadge';
import { useConfirmation } from '../ConfirmationProvider';

// ─── Nav Item Definition ─────────────────────────────────────────────────────
interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  badge?: number;
  exact?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Dashboard',
    items: [
      { path: '/manager', label: 'Executive Overview', icon: LayoutDashboard, exact: true },
    ]
  },
  {
    title: 'Operations',
    items: [
      { path: '/kitchen', label: 'Kitchen Console', icon: Activity },
    ]
  },
  {
    title: 'Menu & Customization',
    items: [
      { path: '/manager/menu', label: 'Menu Items', icon: ShoppingBag },
      { path: '/manager/categories', label: 'Categories', icon: Tag },
      { path: '/manager/recipes', label: 'Recipes', icon: ChefHat },
    ]
  },
  {
    title: 'Inventory & Waste',
    items: [
      { path: '/manager/inventory', label: 'Stock Control', icon: Package },
      { path: '/manager/waste', label: 'Waste Log', icon: Trash2 },
    ]
  },
  {
    title: 'CRM & Loyalty',
    items: [
      { path: '/manager/users', label: 'Users & Staff', icon: Users },
      { path: '/manager/loyalty', label: 'Loyalty Rewards', icon: Award },
    ]
  },
  {
    title: 'Marketing',
    items: [
      { path: '/manager/advertisements', label: 'Ads & Campaigns', icon: Megaphone },
    ]
  },
  {
    title: 'System',
    items: [
      { path: '/manager/settings', label: 'Settings', icon: Settings },
    ]
  }
];

// ─── Sidebar ─────────────────────────────────────────────────────────────────
interface ManagerSidebarProps {
  onClose?: () => void;
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
}

export const ManagerSidebar: React.FC<ManagerSidebarProps> = ({ onClose, collapsed, setCollapsed }) => {
  const location = useLocation();
  const { user } = useAuthStore();

  const isActive = (item: NavItem) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname === item.path || location.pathname.startsWith(item.path + '/');
  };

  return (
    <aside className={`min-h-screen bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0 sticky top-0 h-screen overflow-y-auto transition-all duration-300 z-30 ${collapsed ? 'w-20' : 'w-64'}`}>
      
      {/* Brand & Logo */}
      <div className={`p-5 flex-shrink-0 flex items-center justify-between border-b border-slate-800/80 ${collapsed ? 'justify-center' : ''}`}>
        <Link to="/manager" className="flex items-center gap-3 no-underline" onClick={onClose}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-red-dark flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-500/10">
            <BkbLogo size={20} showText={false} color="#fff" />
          </div>
          {!collapsed && (
            <div>
              <div className="text-sm font-extrabold text-white tracking-wider uppercase leading-none">BKB Resto</div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mt-1">Management</span>
            </div>
          )}
        </Link>
        {!collapsed && (
          <button 
            onClick={() => setCollapsed(true)} 
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Collapse Sidebar"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Main Nav */}
      <nav className="flex-1 p-4 flex flex-col gap-5 overflow-x-hidden">
        {NAV_GROUPS.map((group, groupIdx) => {
          const visibleItems = group.items.filter(item => {
            if (item.adminOnly && user?.role !== 'ADMIN') return false;
            return true;
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={groupIdx} className="flex flex-col gap-1.5">
              {!collapsed ? (
                <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest px-3 py-1">
                  {group.title}
                </div>
              ) : (
                <div className="h-px bg-slate-800 my-1 mx-2" />
              )}
              
              {visibleItems.map(item => {
                const Icon = item.icon;
                const active = isActive(item);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group relative ${
                      active 
                        ? 'bg-primary text-white shadow-md shadow-orange-500/10' 
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                    } ${collapsed ? 'justify-center' : ''}`}
                  >
                    <Icon size={18} className={`${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                    {!collapsed && (
                      <span className={`text-sm font-semibold flex-1`}>{item.label}</span>
                    )}
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className={`bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full ${collapsed ? 'absolute top-1.5 right-1.5 scale-90' : ''}`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Sidebar Expand Button at the bottom (when collapsed) */}
      {collapsed && (
        <div className="p-4 border-t border-slate-800 flex justify-center shrink-0">
          <button 
            onClick={() => setCollapsed(false)} 
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Expand Sidebar"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
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
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('bkb-sidebar-collapsed') === 'true');
  const [showQuickActions, setShowQuickActions] = useState(false);
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const { confirm } = useConfirmation();

  useEffect(() => {
    localStorage.setItem('bkb-sidebar-collapsed', String(collapsed));
  }, [collapsed]);

  const handleLogout = async () => {
    const confirmed = await confirm({
      title: 'Sign Out',
      message: 'Are you sure you want to log out of the management console?',
      confirmLabel: 'Sign Out',
      cancelLabel: 'Cancel',
      type: 'warning'
    });
    if (!confirmed) return;
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
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-slate-950 flex text-slate-900 dark:text-slate-100 font-sans" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <ManagerSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-[200] flex backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        >
          <div onClick={e => e.stopPropagation()} className="z-[201] bg-slate-900">
            <ManagerSidebar collapsed={false} setCollapsed={() => {}} onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-slate-900">
        
        {/* Top Navigation Bar */}
        <header className="h-[72px] px-6 lg:px-8 bg-slate-900 flex items-center justify-between flex-shrink-0 z-20 border-b border-slate-800">
          
          <div className="flex items-center gap-4 flex-1">
            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 -ml-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>

            {/* Restaurant Badge & Portal Name */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-extrabold text-white tracking-tight hidden sm:inline">Bukan Kedai Burger</span>
              <span className="hidden sm:inline w-1 h-1 rounded-full bg-slate-700"></span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500/10 text-primary border border-orange-500/20 uppercase tracking-widest">
                {user?.role === 'ADMIN' ? 'Admin Portal' : 'Manager Portal'}
              </span>
            </div>

            {/* Global Search Mockup */}
            <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 bg-slate-950/60 border border-slate-800 rounded-xl w-60 text-xs text-slate-500 ml-4 hover:border-slate-700 hover:bg-slate-950 transition-all cursor-pointer">
              <Search size={14} className="text-slate-400" />
              <span>Search menu, users, stocks...</span>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4 lg:gap-5 flex-shrink-0">
            
            {/* Date Display */}
            <div className="hidden lg:flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-950/40 border border-slate-800/80 px-3 py-1.5 rounded-lg">
              <Calendar size={13} className="text-slate-500" />
              <span>{today}</span>
            </div>

            {/* Quick Actions Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowQuickActions(!showQuickActions)}
                className="flex items-center gap-1.5 bg-primary hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider px-3.5 py-1.5 rounded-lg shadow-sm hover:shadow active:scale-[0.97] transition-all"
              >
                <Plus size={14} />
                <span>Quick Actions</span>
              </button>
              
              {showQuickActions && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowQuickActions(false)}></div>
                  <div className="absolute right-0 mt-2 w-52 bg-slate-950 border border-slate-800 rounded-xl shadow-xl p-1.5 z-50 text-left animate-scale-in">
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-2.5 py-1.5">Create New</div>
                    <button onClick={() => { setShowQuickActions(false); navigate('/manager/menu?tab=items'); }} className="flex items-center gap-2 w-full px-2.5 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                      <ShoppingBag size={14} className="text-orange-500" /> Add Menu Item
                    </button>
                    <button onClick={() => { setShowQuickActions(false); navigate('/manager/categories'); }} className="flex items-center gap-2 w-full px-2.5 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                      <Tag size={14} className="text-emerald-500" /> Add Category
                    </button>
                    <div className="h-px bg-slate-800 my-1"></div>
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-2.5 py-1.5">System Tasks</div>
                    <button onClick={() => { setShowQuickActions(false); navigate('/manager/inventory'); }} className="flex items-center gap-2 w-full px-2.5 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                      <Package size={14} className="text-sky-500" /> Adjust Stock Count
                    </button>
                    <button onClick={() => { setShowQuickActions(false); navigate('/manager/waste'); }} className="flex items-center gap-2 w-full px-2.5 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                      <Trash2 size={14} className="text-red-500" /> Record Waste Log
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Notifications Icon */}
            <button className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full border border-slate-900"></span>
            </button>

            {/* Profile & Logout */}
            <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-primary flex items-center justify-center font-bold text-xs border border-orange-500/30">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'M'}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-white leading-none mb-1">
                  {user?.name || 'Manager'}
                </div>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                  {user?.role || 'MANAGER'}
                </span>
              </div>
              <button 
                onClick={handleLogout}
                className="p-1.5 text-slate-500 hover:text-red-400 transition-colors ml-1 hover:bg-slate-800 rounded-lg"
                title="Sign out of console"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* Floating Canvas */}
        <div className="flex-1 flex flex-col bg-[#F5F7FA] dark:bg-slate-950 overflow-hidden relative lg:mr-4 lg:mb-4 lg:rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-2xl">
          
          {/* Canvas Header (Page Title & Tabs) */}
          <div className="bg-white dark:bg-slate-900 px-6 py-5 flex flex-col gap-4 flex-shrink-0 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                    {subtitle}
                  </p>
                )}
              </div>
              {headerAction && <div className="shrink-0 flex items-center gap-2">{headerAction}</div>}
            </div>

            {/* Tabs */}
            {tabs && tabs.length > 0 && (
              <div className="flex overflow-x-auto scrollbar-hide -mb-[21px] gap-6 border-t border-slate-100 dark:border-slate-800/60 pt-2.5 mt-1.5">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={tab.onClick}
                    className={`py-3.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap border-b-2 transition-colors duration-150 ${
                      tab.active 
                        ? 'border-primary text-primary' 
                        : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Scrollable Canvas Body */}
          <main className="flex-1 overflow-y-auto p-5 sm:p-6 lg:p-8 text-slate-700 dark:text-slate-200">
            <div className="max-w-7xl mx-auto w-full">
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
