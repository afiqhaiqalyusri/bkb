import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, LogOut, ChefHat, BarChart3 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { BkbLogo } from '../ui/BkbLogo';

export const NavBar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const itemCount = useCartStore(s => s.itemCount());

  const handleLogout = () => {
    clearAuth();
    useCartStore.getState().clearCart();
    window.location.replace('/');
  };

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 40,
      background: 'rgba(26,26,26,0.9)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      padding: '12px 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 12,
    }}>
      {/* Logo */}
      <Link to="/menu" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
        <BkbLogo size={34} horizontal={true} color="var(--primary)" textColor="#F5F0E8" />
      </Link>

      {/* Nav Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Role-based nav */}
        {user?.role === 'MANAGER' && (
          <Link to="/manager" style={{ textDecoration: 'none' }}>
            <button className="bkb-btn-ghost">
              <BarChart3 size={16} /> Dashboard
            </button>
          </Link>
        )}
        {(user?.role === 'STAFF' || user?.role === 'MANAGER') && (
          <Link to="/kitchen" style={{ textDecoration: 'none' }}>
            <button className="bkb-btn-ghost">
              <ChefHat size={16} /> Kitchen
            </button>
          </Link>
        )}

        {/* Cart */}
        {(user?.role === 'CUSTOMER' || user?.role === 'GUEST' || !isAuthenticated) && (
          <Link to="/cart" style={{ textDecoration: 'none', position: 'relative' }}>
            <button className="bkb-btn-ghost" style={{ position: 'relative' }}>
              <ShoppingCart size={18} />
              {itemCount > 0 && (
                <span style={{
                  position: 'absolute', top: -4, right: -4,
                  background: 'var(--bkb-orange)', color: 'white',
                  borderRadius: '50%', width: 18, height: 18,
                  fontSize: '0.7rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{itemCount}</span>
              )}
            </button>
          </Link>
        )}

        {/* Auth */}
        {isAuthenticated ? (
          <button className="bkb-btn-ghost" onClick={handleLogout}>
            <LogOut size={16} />
          </button>
        ) : (
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <button className="bkb-btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              Login
            </button>
          </Link>
        )}
      </div>
    </nav>
  );
};
