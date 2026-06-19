import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useCartStore } from '../store/cartStore';

interface PageShellProps {
  children: React.ReactNode;
  activeKey?: string;
  noPad?: boolean;
}

const IcoCart = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);

export const PageShell: React.FC<PageShellProps> = ({ children, activeKey }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const cartCount = useCartStore(s => s.itemCount());

  const showCartButton = location.pathname !== '/cart' && !location.pathname.startsWith('/order/') && location.pathname !== '/';

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--background)',
      fontFamily: 'Inter, sans-serif',
      transition: 'background 0.3s ease',
    }}>
      <Sidebar activeKey={activeKey} />

      {/* Main area - shifted right by 76px to accommodate the sidebar */}
      <main
        className="page-main"
        style={{
          flex: 1,
          paddingTop: 0,
          paddingBottom: 24,
          overflowX: 'hidden',
          position: 'relative',
        }}
      >
        {children}

        {/* Global Top-Right Cart Icon */}
        {showCartButton && (
          <button
            onClick={() => navigate('/cart')}
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              zIndex: 150,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.06)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
          >
            <IcoCart />
            {cartCount > 0 && (
              <span style={{
                position: 'absolute',
                top: -4,
                right: -4,
                background: 'var(--primary)',
                color: 'white',
                borderRadius: '50%',
                minWidth: 20,
                height: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '0 4px',
                border: '2px solid var(--surface)',
              }}>
                {cartCount}
              </span>
            )}
          </button>
        )}
      </main>
    </div>
  );
};
