import React, { useState, useEffect } from 'react';
import { Sun, Moon, Flame, Percent, Award } from 'lucide-react';
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
      className="split-split animate-fade-in"
      style={{
        minHeight: '100vh',
        background: 'var(--background)',
        transition: 'all 0.3s ease',
        position: 'relative',
        display: 'flex',
        flexDirection: 'row'
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
          background: 'var(--secondary-bg)',
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
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>

      {/* LEFT SIDE: Curved Hero banner */}
      <div
        className="split-split-hero animate-fade-in desktop-only"
        style={{
          flex: 1,
          background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 50%, #FF6B00 100%)',
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
          padding: '50px 60px 50px 70px',
          zIndex: 2,
          clipPath: 'polygon(0 0, 100% 0, 92% 100%, 0 100%)'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-80px',
            right: '120px',
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(255,107,0,0.2) 0%, transparent 70%)',
            zIndex: 1,
            pointerEvents: 'none'
          }}
        />

        <div style={{ zIndex: 2, maxWidth: '340px', flexShrink: 0 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255,107,0,0.15)',
              border: '1px solid rgba(255,107,0,0.4)',
              padding: '6px 14px',
              borderRadius: '99px',
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: '28px',
              color: '#FFB347'
            }}
          >
            <Flame size={13} fill="#FFB347" /> Premium Street Grills
          </div>

          <h2
            style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-1px',
              color: '#FFFFFF',
              marginBottom: '18px'
            }}
          >
            Sleek Dashboard.
            <br />
            <span style={{ color: '#FF8C42' }}>Gourmet Flavors.</span>
            <br />
            Seamless Orders.
          </h2>

          <p
            style={{
              fontSize: '0.88rem',
              opacity: 0.8,
              lineHeight: 1.6,
              marginBottom: '32px',
              color: '#cbd5e1'
            }}
          >
            Access your BKB Account to manage favorite items, earn loyalty stars, track active orders, and view special promotions.
          </p>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              paddingTop: '22px'
            }}
          >
            {[
              { icon: <Percent size={15} />, title: 'Exclusive Promos', desc: 'Direct discount codes on checkout.' },
              { icon: <Award size={15} />, title: 'Earn Loyalty Stars', desc: 'Get free gourmet burgers over time.' }
            ].map((item, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ background: 'rgba(255,107,0,0.2)', border: '1px solid rgba(255,107,0,0.4)', padding: '8px', borderRadius: '10px', display: 'flex', flexShrink: 0, color: '#FFB347' }}>
                  {item.icon}
                </div>
                <div>
                  <h4 style={{ fontWeight: 600, fontSize: '0.85rem', color: '#fff' }}>{item.title}</h4>
                  <p style={{ fontSize: '0.74rem', opacity: 0.7, marginTop: '2px', color: '#cbd5e1' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right side Showcase burger */}
        <div style={{ zIndex: 2, position: 'relative', flexShrink: 0, marginRight: '40px' }}>
          <div
            style={{
              position: 'absolute',
              width: '280px',
              height: '280px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,107,0,0.4) 0%, transparent 70%)',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              filter: 'blur(20px)',
              zIndex: 0
            }}
          />
          <div
            style={{
              width: '240px',
              height: '240px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '2px solid rgba(255,140,66,0.4)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              position: 'relative',
              zIndex: 1
            }}
          >
            <img
              src="/bkb_premium_hero_burger.png"
              alt="BKB Premium Burger"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scale(1.06)'
              }}
            />
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Children */}
      <div
        className="split-split-form"
        style={{
          flex: 1.1,
          padding: '60px 24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'var(--background)'
        }}
      >
        <div style={{ width: '100%', maxWidth: '360px' }} className="animate-fade-in-up">
          {children}
        </div>
      </div>
    </div>
  );
};
