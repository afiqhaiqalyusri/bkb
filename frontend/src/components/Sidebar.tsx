import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMenuStore } from '../store/menuStore';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { BkbLogo } from './ui/BkbLogo';

/* ─── SVG Icons ─── */
const IcoAll = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5"/>
    <rect x="14" y="3" width="7" height="7" rx="1.5"/>
    <rect x="3" y="14" width="7" height="7" rx="1.5"/>
    <rect x="14" y="14" width="7" height="7" rx="1.5"/>
  </svg>
);
const IcoBurger = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M3 7h18M3 12h18M3 17h18"/>
    <path d="M6 7C6 5 7.5 4 12 4s6 1 6 3"/>
    <path d="M6 17c0 2 1.5 3 6 3s6-1 6-3"/>
  </svg>
);
const IcoOblong = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="2" y="8" width="20" height="8" rx="4"/>
    <path d="M8 8V6M12 8V5M16 8V6"/>
  </svg>
);
const IcoSpecial = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const IcoDrinks = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M8 2h8l1 8H7L8 2z"/>
    <path d="M7 10c0 5 2 9 5 9s5-4 5-9"/>
    <path d="M10 6h4"/>
  </svg>
);
const IcoSides = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="5" y="6" width="14" height="14" rx="2"/>
    <path d="M5 10h14M9 6V4m6 2V4"/>
  </svg>
);
const IcoRewards = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const IcoSettings = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const getCategoryIcon = (catId: string) => {
  const norm = catId.toLowerCase().trim();
  if (norm === 'all') return <IcoAll />;
  if (norm.includes('burger')) return <IcoBurger />;
  if (norm.includes('oblong')) return <IcoOblong />;
  if (norm.includes('special')) return <IcoSpecial />;
  if (norm.includes('drink') || norm.includes('beverage')) return <IcoDrinks />;
  if (norm.includes('side') || norm.includes('fries') || norm.includes('snack')) return <IcoSides />;
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  );
};

interface SidebarProps {
  activeKey?: string;
}

export const Sidebar: React.FC<SidebarProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeCategory, setActiveCategory, categories, fetchCategories } = useMenuStore();
  const { user, isAuthenticated } = useAuthStore();
  const theme = document.documentElement.getAttribute('data-theme') || 'light';

  const isMenuPage = location.pathname === '/menu';
  const isRewardsPage = location.pathname === '/loyalty';
  const isSettingsPage = location.pathname === '/settings' || location.pathname === '/history';
  const isFavPage = location.pathname === '/favourites';

  React.useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCategoryClick = (cat: string) => {
    setActiveCategory(cat);
    if (!isMenuPage) {
      navigate('/menu');
    }
  };

  const sidebarCategories = categories.map(catName => ({
    id: catName,
    label: catName,
    icon: getCategoryIcon(catName),
  }));


  return (
    <aside
      style={{
        width: 76,
        background: theme === 'light' ? 'rgba(255, 255, 255, 0.82)' : 'rgba(26, 26, 26, 0.82)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px 0',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 100,
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.03)',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Brand / Logo */}
      <div 
        onClick={() => handleCategoryClick('All')}
        style={{ 
          cursor: 'pointer', 
          marginBottom: 28, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          transition: 'transform 0.2s ease'
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <BkbLogo size={36} showText={false} color="var(--primary)" />
      </div>

      {/* Menu Categories */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, width: '100%', alignItems: 'center' }}>
        {sidebarCategories.map(cat => {
          const active = isMenuPage && activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              style={{
                width: 60,
                height: 56,
                borderRadius: 12,
                border: 'none',
                cursor: 'pointer',
                background: active ? 'rgba(255, 107, 0, 0.08)' : 'transparent',
                color: active ? 'var(--primary)' : 'var(--text-secondary)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                position: 'relative',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.background = 'var(--cream-dark)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              {active && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '15%',
                    bottom: '15%',
                    width: 3.5,
                    background: 'var(--primary)',
                    borderRadius: '0 4px 4px 0',
                  }}
                />
              )}
              {cat.icon}
              <span style={{ fontSize: '0.58rem', fontWeight: active ? 800 : 600, fontFamily: 'Inter, sans-serif', letterSpacing: '0.2px' }}>
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Separator */}
      <div style={{ width: 32, height: 1, background: 'var(--border)', margin: '14px 0', transition: 'background 0.3s ease' }} />

      {/* Bottom Nav: Favourites, Rewards, Settings */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', alignItems: 'center' }}>
        {/* Favourites */}
        <button
          onClick={() => {
            if (isAuthenticated && user?.role === 'CUSTOMER') {
              navigate('/favourites');
            } else {
              toast.error('Please log in to view favourites.', { id: 'fav-gate' });
              navigate('/login');
            }
          }}
          style={{
            width: 60,
            height: 56,
            borderRadius: 12,
            border: 'none',
            cursor: 'pointer',
            background: isFavPage ? 'rgba(255, 107, 0, 0.08)' : 'transparent',
            color: isFavPage ? 'var(--primary)' : 'var(--text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            position: 'relative',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            if (!isFavPage) {
              e.currentTarget.style.background = 'var(--cream-dark)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }
          }}
          onMouseLeave={e => {
            if (!isFavPage) {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }
          }}
        >
          {isFavPage && (
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: '15%',
                bottom: '15%',
                width: 3.5,
                background: 'var(--primary)',
                borderRadius: '0 4px 4px 0',
              }}
            />
          )}
          <svg width="18" height="18" viewBox="0 0 24 24" fill={isFavPage ? 'var(--primary)' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span style={{ fontSize: '0.58rem', fontWeight: isFavPage ? 800 : 600, fontFamily: 'Inter, sans-serif' }}>Saved</span>
        </button>
        {/* Rewards */}
        <button
          onClick={() => {
            if (isAuthenticated && user?.role === 'CUSTOMER') {
              navigate('/loyalty');
            } else {
              toast.error('Please log in with a registered account to view rewards.', { id: 'rewards-gate' });
              navigate('/login');
            }
          }}
          style={{
            width: 60,
            height: 56,
            borderRadius: 12,
            border: 'none',
            cursor: 'pointer',
            background: isRewardsPage ? 'rgba(255, 107, 0, 0.08)' : 'transparent',
            color: isRewardsPage ? 'var(--primary)' : 'var(--text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            position: 'relative',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            if (!isRewardsPage) {
              e.currentTarget.style.background = 'var(--cream-dark)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }
          }}
          onMouseLeave={e => {
            if (!isRewardsPage) {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }
          }}
        >
          {isRewardsPage && (
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: '15%',
                bottom: '15%',
                width: 3.5,
                background: 'var(--primary)',
                borderRadius: '0 4px 4px 0',
              }}
            />
          )}
          <IcoRewards />
          <span style={{ fontSize: '0.58rem', fontWeight: isRewardsPage ? 800 : 600, fontFamily: 'Inter, sans-serif' }}>Rewards</span>
        </button>

        {/* Settings */}
        <button
          onClick={() => {
            if (isAuthenticated && user?.role === 'CUSTOMER') {
              navigate('/settings');
            } else {
              toast.error('Please log in to access settings.', { id: 'settings-gate' });
              navigate('/login');
            }
          }}
          style={{
            width: 60,
            height: 56,
            borderRadius: 12,
            border: 'none',
            cursor: 'pointer',
            background: isSettingsPage ? 'rgba(255, 107, 0, 0.08)' : 'transparent',
            color: isSettingsPage ? 'var(--primary)' : 'var(--text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            position: 'relative',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            if (!isSettingsPage) {
              e.currentTarget.style.background = 'var(--cream-dark)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }
          }}
          onMouseLeave={e => {
            if (!isSettingsPage) {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }
          }}
        >
          {isSettingsPage && (
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: '15%',
                bottom: '15%',
                width: 3.5,
                background: 'var(--primary)',
                borderRadius: '0 4px 4px 0',
              }}
            />
          )}
          <IcoSettings />
          <span style={{ fontSize: '0.58rem', fontWeight: isSettingsPage ? 800 : 600, fontFamily: 'Inter, sans-serif' }}>Settings</span>
        </button>
      </div>
    </aside>
  );
};
