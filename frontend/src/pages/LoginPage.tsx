import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { authService } from '../services/auth.service';
import { orderService } from '../services/order.service';
import { securityLogger } from '../utils/securityLogger';
import { BkbLogo } from '../components/ui/BkbLogo';
import toast from 'react-hot-toast';
import { FullScreenLoader } from '../components/ui/FullScreenLoader';
import { InlineError } from '../components/ui/InlineError';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Flame, 
  Award, 
  Percent, 
  Sun, 
  Moon 
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, setAuth } = useAuthStore();
  const { itemCount } = useCartStore();

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [storeClosed, setStoreClosed] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('bkb-remember') === 'true';
  });
  const [formError, setFormError] = useState('');

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('bkb-theme') as 'light' | 'dark') || 'light';
  });

  // Prefill email if remembered
  useEffect(() => {
    const savedEmail = localStorage.getItem('bkb-email');
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('bkb-theme', newTheme);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

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

  useEffect(() => {
    orderService.getStoreStatus()
      .then(res => setStoreClosed(!res.data))
      .catch(() => {});
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!email || !password) {
      setFormError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.login(email.toLowerCase(), password);
      const { user: loggedUser, accessToken, refreshToken } = res.data;
      setAuth(loggedUser, accessToken, refreshToken);

      if (rememberMe) {
        localStorage.setItem('bkb-remember', 'true');
        localStorage.setItem('bkb-email', email);
      } else {
        localStorage.removeItem('bkb-remember');
        localStorage.removeItem('bkb-email');
      }

      if (loggedUser.role === 'ADMIN' || loggedUser.role === 'MANAGER' || loggedUser.role === 'STAFF') {
        securityLogger.logLoginSession(loggedUser.email, loggedUser.role);
        securityLogger.logSecurityEvent(loggedUser.email, loggedUser.role, 'User Login', 'Logged in to system console successfully.');
      }
      toast.success(`Welcome back, ${loggedUser.name}! 👋`, { duration: 2500 });
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestCheckout = async () => {
    // Generate simple guest credentials and ask for details on checkout
    setLoading(true);
    try {
      const res = await authService.guest(`Guest_${Math.floor(1000 + Math.random() * 9000)}`);
      const { user: loggedUser, accessToken, refreshToken } = res.data;
      setAuth(loggedUser, accessToken, refreshToken);
      toast.success('Continuing as Guest Session');
      navigate('/menu');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Guest session initialization failed.');
    } finally {
      setLoading(false);
    }
  };

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
      {loading && (
        <FullScreenLoader
          message="Logging in..."
          subtitle="Connecting to BKB servers..."
        />
      )}

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

      {/* RIGHT SIDE: Clean minimalist auth cards */}
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
          {/* Logo */}
          <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'center' }}>
            <BkbLogo size={48} showText={true} />
          </div>

          {storeClosed && (
            <div
              style={{
                background: 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.15)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                marginBottom: '20px',
                display: 'flex',
                gap: 10,
                color: 'var(--danger)',
                fontSize: '0.78rem',
                lineHeight: 1.4
              }}
              role="alert"
            >
              <span>🚫</span>
              <div>
                <strong style={{ display: 'block', fontWeight: 700 }}>Kitchen is Currently Closed</strong>
                Store orders are offline, but you can still explore our menu catalog.
              </div>
            </div>
          )}

          {/* Form Header */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)' }}>Welcome Back</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Sign in to manage your orders and rewards.
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Email Field */}
            <div>
              <label htmlFor="email-input" style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', display: 'flex' }}>
                  <Mail size={16} />
                </span>
                <input
                  id="email-input"
                  type="email"
                  placeholder="name@example.com"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label htmlFor="password-input" style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Forgot Password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', display: 'flex' }}>
                  <Lock size={16} />
                </span>
                <input
                  id="password-input"
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '40px', paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', padding: '4px' }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <InlineError message={formError} />

            {/* Remember Me */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
                Remember email
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn-primary"
              style={{ marginTop: '6px' }}
            >
              Sign In <ArrowRight size={16} style={{ marginLeft: '4px' }} />
            </button>
          </form>

          {/* Guest Trigger / Signup switch */}
          <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            <button
              type="button"
              onClick={handleGuestCheckout}
              className="btn-outline"
            >
              Continue as Guest
            </button>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', margin: '4px 0 0' }}>
              New to BKB?{' '}
              <button
                type="button"
                onClick={() => navigate('/register')}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}
              >
                Create an Account
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
