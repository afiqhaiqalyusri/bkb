import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, Package, Trash2, Users, Award,
  Settings, Menu, ChefHat, Tag, Megaphone, ChevronRight,
  BarChart3, Shield, LogOut, Bell
} from 'lucide-react';
import { BkbLogo } from '../ui/BkbLogo';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/auth.service';
import { useNavigate } from 'react-router-dom';
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
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const isActive = (item: NavItem) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname === item.path || location.pathname.startsWith(item.path + '/');
  };

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

  const filteredNavItems = NAV_ITEMS.filter(item => {
    if (item.adminOnly && user?.role !== 'ADMIN') return false;
    return true;
  });

  return (
    <aside style={{
      width: 240,
      minHeight: '100vh',
      background: 'var(--surface)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      borderRight: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      height: '100vh',
      overflowY: 'auto',
      overflowX: 'hidden',
    }}>
      {/* Brand */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <Link to="/manager" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }} onClick={onClose}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--primary) 0%, #e05000 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <BkbLogo size={20} showText={false} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>BKB Console</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {user?.role === 'ADMIN' ? 'Administrator' : 'Manager'}
            </div>
          </div>
        </Link>
      </div>

      {/* Main Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '4px 10px 8px' }}>
          Main Menu
        </div>
        {filteredNavItems.map(item => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                textDecoration: 'none',
                padding: '9px 12px',
                borderRadius: 8,
                background: active ? 'rgba(255,107,0,0.1)' : 'transparent',
                color: active ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: active ? 700 : 500,
                fontSize: '0.83rem',
                transition: 'all 0.15s ease',
                position: 'relative',
              }}
              onMouseEnter={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = 'var(--background)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                }
              }}
            >
              {active && (
                <span style={{
                  position: 'absolute', left: 0, top: '18%', bottom: '18%',
                  width: 3, background: 'var(--primary)', borderRadius: '0 3px 3px 0',
                }} />
              )}
              <Icon size={16} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span style={{
                  background: 'var(--danger)', color: '#fff',
                  fontSize: '0.6rem', fontWeight: 800,
                  padding: '1px 6px', borderRadius: 99, minWidth: 18, textAlign: 'center',
                }}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* Separator */}
        <div style={{ height: 1, background: 'var(--border)', margin: '8px 4px' }} />
        <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '4px 10px 8px' }}>
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
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                textDecoration: 'none',
                padding: '9px 12px',
                borderRadius: 8,
                background: active ? 'rgba(255,107,0,0.1)' : 'transparent',
                color: active ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: active ? 700 : 500,
                fontSize: '0.83rem',
                transition: 'all 0.15s ease',
                position: 'relative',
              }}
              onMouseEnter={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = 'var(--background)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                }
              }}
            >
              {active && (
                <span style={{
                  position: 'absolute', left: 0, top: '18%', bottom: '18%',
                  width: 3, background: 'var(--primary)', borderRadius: '0 3px 3px 0',
                }} />
              )}
              <Icon size={16} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: 'var(--background)' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--primary)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '0.8rem', flexShrink: 0,
          }}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'M'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name || 'Manager'}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
              {user?.role === 'ADMIN' ? 'Administrator' : 'Store Manager'}
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-secondary)', padding: 4, borderRadius: 6,
              display: 'flex', alignItems: 'center', transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            <LogOut size={15} />
          </button>
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
  const { user } = useAuthStore();

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

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--background)',
      display: 'flex',
      flexDirection: 'row',
      color: 'var(--text-primary)',
    }}>
      {/* Desktop Sidebar */}
      <div className="manager-sidebar-desktop">
        <ManagerSidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex' }}
          onClick={() => setSidebarOpen(false)}
        >
          <div onClick={e => e.stopPropagation()} style={{ zIndex: 201 }}>
            <ManagerSidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', overflow: 'hidden' }}>
        {/* Top Header */}
        <header style={{
          height: 62,
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
          flexShrink: 0,
          gap: 16,
        }}>
          {/* Mobile Menu Button */}
          <button
            className="manager-menu-btn"
            onClick={() => setSidebarOpen(true)}
            style={{
              background: 'none', border: 'none',
              color: 'var(--text-primary)', cursor: 'pointer',
              padding: 6, borderRadius: 8, display: 'none', alignItems: 'center',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--background)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <Menu size={20} />
          </button>

          {/* Page Title */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h1 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {title}
            </h1>
            {subtitle && (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 1 }}>
                {subtitle}
              </span>
            )}
          </div>

          {/* Tabs */}
          {tabs && tabs.length > 0 && (
            <div style={{ display: 'flex', marginLeft: 24, overflowX: 'auto', flexShrink: 0 }} className="manager-tabs">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={tab.onClick}
                  style={{
                    background: 'none', border: 'none',
                    color: tab.active ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: tab.active ? 600 : 500,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    position: 'relative',
                    padding: '20px 14px',
                    transition: 'color 0.15s',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {tab.label}
                  {tab.active && (
                    <span style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      height: 2.5, background: 'var(--primary)', borderRadius: '2px 2px 0 0',
                    }} />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Right Spacer + Actions */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            {headerAction && <div>{headerAction}</div>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ textAlign: 'right', display: 'none' }} className="manager-user-text">
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                  {user?.name || 'Manager'}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                  {user?.role === 'ADMIN' ? 'Administrator' : 'Store Manager'}
                </div>
              </div>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'var(--primary)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '0.8rem', flexShrink: 0,
              }}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'M'}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '28px 24px', background: 'var(--background)' }}>
          {children}
        </main>
      </div>

      <style>{`
        .manager-tabs { scrollbar-width: none; }
        .manager-tabs::-webkit-scrollbar { display: none; }

        @media (min-width: 900px) {
          .manager-sidebar-desktop { display: block !important; }
          .manager-menu-btn { display: none !important; }
          .manager-user-text { display: block !important; }
        }
        @media (max-width: 899px) {
          .manager-sidebar-desktop { display: none !important; }
          .manager-menu-btn { display: flex !important; }
          .manager-user-text { display: none !important; }
        }
      `}</style>
    </div>
  );
};
