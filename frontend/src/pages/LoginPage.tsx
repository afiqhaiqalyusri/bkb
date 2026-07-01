import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/auth.service';
import { orderService } from '../services/order.service';
import { securityLogger } from '../utils/securityLogger';
import { BkbLogo } from '../components/ui/BkbLogo';
import toast from 'react-hot-toast';
import { FullScreenLoader } from '../components/ui/FullScreenLoader';
import { InlineError } from '../components/ui/InlineError';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { AuthLayout } from '../components/layout/AuthLayout';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [storeClosed, setStoreClosed] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('bkb-remember') === 'true';
  });
  const [formError, setFormError] = useState('');

  // Prefill email if remembered
  useEffect(() => {
    const savedEmail = localStorage.getItem('bkb-email');
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

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
      // Implement robust error handling
      if (!err.response) {
        setFormError('Network error. Please check your internet connection.');
      } else if (err.response.status === 401) {
        setFormError('Incorrect email or password. Please try again.');
      } else if (err.response.status === 429) {
        setFormError('Too many login attempts. Please try again later.');
      } else {
        setFormError(err.response?.data?.message || 'Authentication failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestCheckout = async () => {
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
    <AuthLayout>
      {loading && (
        <FullScreenLoader
          message="Logging in..."
          subtitle="Connecting to BKB servers..."
        />
      )}

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
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Sign In</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
          Please enter your credentials to access your account.
        </p>
      </div>

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
    </AuthLayout>
  );
};
