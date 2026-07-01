import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, Package, Trash2, Users, Award,
  Settings, Menu as MenuIcon, ChefHat, Tag, Megaphone, LogOut, Bell, X, MessageSquare,
  BarChart2, PieChart, Search, Sun, Moon, Calendar as CalendarIcon, ChevronDown, ChevronRight, Zap
} from 'lucide-react';
import { BkbLogo } from '../ui/BkbLogo';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/auth.service';
import toast from 'react-hot-toast';

interface NavItem {
  path?: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  exact?: boolean;
  subItems?: { path: string; label: string; icon: React.ElementType }[];
}

const NAV_ITEMS: NavItem[] = [
  { path: '/manager',                label: 'Dashboard',  icon: LayoutDashboard, exact: true },
  { 
    label: 'Menu Management', 
    icon: ShoppingBag,
    subItems: [
      { path: '/manager/menu',       label: 'Menu Items', icon: ShoppingBag },
      { path: '/manager/categories', label: 'Categories', icon: Tag },
      { path: '/manager/recipes',    label: 'Recipes',    icon: ChefHat },
    ]
  },
  {
    label: 'Inventory Ops',
    icon: Package,
    subItems: [
      { path: '/manager/inventory',  label: 'Stock Levels', icon: Package },
      { path: '/manager/waste',      label: 'Waste Log',    icon: Trash2 },
    ]
  },
  {
    label: 'Engagement',
    icon: Megaphone,
    subItems: [
      { path: '/manager/advertisements', label: 'Advertisements', icon: Megaphone },
      { path: '/manager/loyalty',        label: 'Loyalty Program',icon: Award },
      { path: '/manager/feedback',       label: 'Feedback',       icon: MessageSquare },
    ]
  },
  {
    label: 'System Admin',
    icon: Settings,
    adminOnly: true,
    subItems: [
      { path: '/manager/users',      label: 'Staff & Users',  icon: Users },
      { path: '/manager/settings',   label: 'Global Settings',icon: Settings },
    ]
  }
];

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedNav, setExpandedNav] = useState<string | null>('Menu');
  
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [theme, setTheme] = useState<'light' | 'dark'>(() => (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'light');

  useEffect(() => {
    const handleTheme = () => setTheme((document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'light');
    window.addEventListener('theme-change', handleTheme);
    return () => window.removeEventListener('theme-change', handleTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('bkb-theme', newTheme);
    setTheme(newTheme);
    window.dispatchEvent(new Event('theme-change'));
  };

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
    try { await authService.logout(); } catch { } 
    finally {
      clearAuth();
      navigate('/login', { replace: true });
      toast.success('Logged out successfully');
    }
  };

  const isActive = (item: NavItem) => {
    if (item.path) {
      if (item.exact) return location.pathname === item.path;
      return location.pathname === item.path || location.pathname.startsWith(item.path + '/');
    }
    if (item.subItems) {
      return item.subItems.some(sub => location.pathname === sub.path || location.pathname.startsWith(sub.path + '/'));
    }
    return false;
  };

  const isSubActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const navItemsFiltered = NAV_ITEMS.filter(item => !(item.adminOnly && user?.role !== 'ADMIN'));

  const currentDate = new Date().toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  const renderNavItems = () => (
    <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1 scrollbar-hide">
      {navItemsFiltered.map(item => {
        const active = isActive(item);
        if (item.subItems) {
          const isExpanded = expandedNav === item.label || active;
          return (
            <div key={item.label} className="flex flex-col gap-1">
              <button
                onClick={() => setExpandedNav(isExpanded && !active ? null : item.label)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[14px] font-semibold transition-all ${active || isExpanded ? 'bg-gray-100 bg-[var(--surface)] text-[var(--primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--background)] dark:hover:bg-slate-800/50'}`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} />
                  {item.label}
                </div>
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              
              {isExpanded && (
                <div className="flex flex-col gap-0.5 ml-4 pl-4 border-l-2 border-[var(--border)] dark:border-slate-800 my-1">
                  {item.subItems.map(sub => {
                    const subActive = isSubActive(sub.path);
                    return (
                      <Link
                        key={sub.path}
                        to={sub.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${subActive ? 'text-[var(--primary)] bg-[var(--primary)]/5 font-bold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                      >
                        <sub.icon size={15} />
                        {sub.label}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          );
        }

        return (
          <Link
            key={item.label}
            to={item.path!}
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-semibold transition-all ${active ? 'bg-[var(--primary)] text-white shadow-md shadow-orange-500/20' : 'text-[var(--text-secondary)] hover:bg-gray-100 dark:hover:bg-slate-800'}`}
          >
            <item.icon size={18} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[var(--background)] text-[var(--text-primary)]" style={{ fontFamily: "'Inter', 'DM Sans', sans-serif" }}>
      
      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden lg:flex flex-col w-[260px] bg-[var(--surface)] border-r border-[var(--border)] z-40">
        <div className="h-[70px] flex items-center px-6 border-b border-[var(--border)] gap-3 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF6B00] to-[#E65100] flex items-center justify-center shadow">
            <BkbLogo size={16} showText={false} color="#fff" />
          </div>
          <span className="text-[16px] font-extrabold tracking-tight">BKB Workspace</span>
        </div>
        {renderNavItems()}
        
        {/* Bottom User Profile in Sidebar */}
        <div className="p-4 border-t border-[var(--border)]">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)]">
             <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center font-bold text-[var(--primary)] text-sm shrink-0">
               {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
             </div>
             <div className="flex-1 min-w-0">
               <div className="text-[13px] font-bold truncate">{user?.name || 'Administrator'}</div>
               <div className="text-[11px] text-[var(--text-secondary)] truncate">{user?.email || 'admin@bkb.com'}</div>
             </div>
             <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors p-1" title="Log Out">
               <LogOut size={16} />
             </button>
          </div>
        </div>
      </aside>

      {/* ── MOBILE DRAWER ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute top-0 left-0 h-full w-[280px] bg-[var(--surface)] shadow-2xl flex flex-col transform transition-transform" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 h-[70px] border-b border-[var(--border)] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF6B00] to-[#E65100] flex items-center justify-center shadow">
                  <BkbLogo size={16} showText={false} color="#fff" />
                </div>
                <span className="font-extrabold tracking-tight">BKB Workspace</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="text-gray-400 hover:text-gray-700 dark:hover:text-white p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800">
                <X size={20} />
              </button>
            </div>
            {renderNavItems()}
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* ── TOP NAVBAR ── */}
        <header className="h-[70px] bg-[var(--surface)] border-b border-[var(--border)] px-4 lg:px-8 flex items-center justify-between z-30 shrink-0">
          
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 text-[var(--text-secondary)] hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg" onClick={() => setMobileMenuOpen(true)}>
              <MenuIcon size={20} />
            </button>

            {/* Global Search Placeholder */}
            <div className="hidden md:flex items-center bg-gray-100 bg-[var(--surface)] rounded-lg px-3 py-2 w-64 border border-transparent focus-within:border-[var(--primary)] focus-within:bg-[var(--surface)] transition-all">
              <Search size={16} className="text-[var(--text-secondary)] mr-2" />
              <input type="text" placeholder="Search across BKB..." className="bg-transparent border-none outline-none text-[13px] w-full text-[var(--text-primary)]" />
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            
            {/* Current Date (hidden on mobile) */}
            <div className="hidden lg:flex items-center gap-2 text-[13px] font-semibold text-[var(--text-secondary)] bg-[var(--surface-hover)] px-3 py-1.5 rounded-lg border border-[var(--border)]">
              <CalendarIcon size={14} />
              {currentDate}
            </div>

            <div className="h-6 w-[1px] bg-[var(--border)] hidden md:block"></div>

            {/* Quick Actions */}
            <button className="relative w-9 h-9 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors" title="Quick Actions">
              <Zap size={18} />
            </button>
            <button className="relative w-9 h-9 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors" title="Announcements">
              <Megaphone size={18} />
            </button>
            <button className="relative w-9 h-9 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors" title="Notifications">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-[var(--surface)]" />
            </button>
            <button onClick={toggleTheme} className="relative w-9 h-9 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors" title="Toggle Theme">
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
        </header>

        {/* ── PAGE CONTENT ── */}
        <div className="flex-1 overflow-hidden p-3 lg:p-6 flex flex-col">
          <main className="flex-1 bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden flex flex-col">
            
            {/* Page Header Bar */}
            <div className="shrink-0 px-6 lg:px-8 py-5 border-b border-[var(--border)] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--surface)]">
              <div>
                <h1 className="text-[22px] font-extrabold tracking-tight leading-tight">{title}</h1>
                {subtitle && <p className="text-[13.5px] text-[var(--text-secondary)] mt-1">{subtitle}</p>}
              </div>

              {/* Tabs and Actions */}
              {(tabs && tabs.length > 0) || headerAction ? (
                <div className="flex flex-wrap items-center gap-3">
                  {tabs && tabs.length > 0 && (
                    <div className="flex items-center gap-1 bg-gray-100 bg-[var(--surface)] rounded-xl p-1 border border-[var(--border)]">
                      {tabs.map(tab => (
                        <button
                          key={tab.id}
                          onClick={tab.onClick}
                          className={`px-4 py-1.5 rounded-lg text-[13px] font-bold transition-all ${
                            tab.active
                              ? 'bg-[var(--surface)] dark:bg-slate-700 text-[var(--primary)] dark:text-white shadow-sm'
                              : 'text-[var(--text-secondary)] hover:text-gray-800 dark:hover:text-gray-200'
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

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto bg-[var(--background)]">
              <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
                {children}
              </div>
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
