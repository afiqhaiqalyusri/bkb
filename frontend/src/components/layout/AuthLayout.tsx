import React, { useState, useEffect } from 'react';
import { Sun, Moon, Utensils } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('bkb-theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('bkb-theme', newTheme);
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'MANAGER' || user.role === 'ADMIN') {
        navigate('/manager', { replace: true });
      } else if (user.role === 'STAFF') {
        navigate('/kitchen', { replace: true });
      } else {
        navigate('/menu', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div
      className="animate-fade-in"
      style={{
        minHeight: '100vh',
        background: 'var(--background)',
        transition: 'all 0.3s ease',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Outfit, sans-serif'
      }}
    >
      {/* Floating Theme Toggle */}
      <button
        type="button"
        onClick={toggleTheme}
        aria-label="Toggle Theme"
        style={{
          position: 'absolute',
          top: 24,
          right: 24,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          width: 42,
          height: 42,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--text-primary)',
          transition: 'all 0.2s ease',
          zIndex: 100,
          boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
        }}
      >
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>

      {/* Main Container */}
      <div style={{
        display: 'flex',
        width: '100%',
        maxWidth: 1000,
        background: 'var(--surface)',
        borderRadius: 40,
        overflow: 'hidden',
        boxShadow: '0 20px 50px rgba(0,0,0,0.08)',
        margin: 20
      }}>
        
        {/* Left Side: Visual Concept */}
        <div className="hidden md:flex" style={{
          flex: 1,
          background: 'rgba(255, 107, 0, 0.05)',
          padding: 60,
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative Shape */}
          <div style={{ position: 'absolute', top: -50, right: -50, width: 250, height: 250, background: 'var(--primary)', borderRadius: '40px 100px 40px 40px', opacity: 0.1 }}></div>
          <div style={{ position: 'absolute', bottom: 40, left: -20, width: 150, height: 150, background: 'var(--primary)', borderRadius: '50%', opacity: 0.05 }}></div>

          <div style={{ zIndex: 2, position: 'relative' }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <Utensils color="white" size={24} />
            </div>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 900, lineHeight: 1.1, color: 'var(--text-primary)', marginBottom: 16, letterSpacing: '-0.5px' }}>
              Welcome back to<br />
              <span style={{ color: 'var(--primary)' }}>Delicious Food</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, fontWeight: 500 }}>
              Sign in to manage your orders, collect loyalty points, and track your favorite meals. 
            </p>
          </div>

          <div style={{ marginTop: 60, zIndex: 2, position: 'relative' }}>
             <img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=400&auto=format&fit=crop&bg=transparent" alt="Burger" style={{ width: '80%', transform: 'rotate(-5deg)', filter: 'drop-shadow(0 20px 20px rgba(0,0,0,0.15))' }} />
          </div>
        </div>

        {/* Right Side: Form Area */}
        <div style={{
          flex: 1,
          padding: '60px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: 'var(--surface)'
        }}>
          {children}
        </div>

      </div>
    </div>
  );
};
