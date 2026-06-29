import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import toast from 'react-hot-toast';
import { securityLogger } from '../utils/securityLogger';
import { SESSION_TIMEOUTS_MS, SESSION_WARNING_BEFORE_MS } from '../constants/config';
import { STORAGE_KEYS } from '../constants/storage';
import { bkbStorage } from '../utils/storage';

const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    if (payload.exp) {
      return Date.now() >= payload.exp * 1000;
    }
    return false;
  } catch (e) {
    return true;
  }
};

export const SessionTimeoutManager: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);
  
  const lastActivityTime = useRef<number>(Date.now());
  const countdownInterval = useRef<any>(null);
  const checkInterval = useRef<any>(null);

  const getTimeoutDuration = () => {
    if (!user || !user.role) return SESSION_TIMEOUTS_MS.CUSTOMER;
    const roleKey = user.role.toUpperCase() as keyof typeof SESSION_TIMEOUTS_MS;
    return SESSION_TIMEOUTS_MS[roleKey] || SESSION_TIMEOUTS_MS.CUSTOMER;
  };

  const resetActivity = () => {
    lastActivityTime.current = Date.now();
    if (showWarning) {
      handleExtendSession();
    }
  };

  const handleLogout = async (reason: 'TIMEOUT' | 'MANUAL') => {
    clearInterval(checkInterval.current);
    clearInterval(countdownInterval.current);
    setShowWarning(false);

    const email = user?.email || 'unknown';
    const role = user?.role || 'CUSTOMER';

    try {
      await api.post(`/api/auth/logout?reason=${reason}`);
    } catch (e) {
      console.error('Failed to notify backend of timeout logout', e);
    }

    clearAuth();

    if (reason === 'TIMEOUT') {
      securityLogger.logSecurityEvent(
        email,
        role,
        'Session Timeout',
        'Session automatically terminated due to user inactivity.'
      );
      toast.error('Your session has expired due to inactivity. Please log in again.', { id: 'session-timeout-toast' });
    } else {
      securityLogger.logSecurityEvent(
        email,
        role,
        'Logout',
        'User successfully logged out of the system.'
      );
    }

    navigate('/', { replace: true });
  };

  const handleExtendSession = async () => {
    lastActivityTime.current = Date.now();
    setShowWarning(false);
    clearInterval(countdownInterval.current);
    
    try {
      await api.get('/api/auth/profile');
    } catch (e) {
      console.error('Session extension validation failed', e);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    const events = ['mousemove', 'keydown', 'keypress', 'scroll', 'wheel', 'click', 'touchstart', 'pointerdown'];
    events.forEach(event => {
      window.addEventListener(event, resetActivity);
    });

    checkInterval.current = setInterval(() => {
      const now = Date.now();
      const timeoutLimit = getTimeoutDuration();
      const elapsed = now - lastActivityTime.current;

      const token = bkbStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (isTokenExpired(token)) {
        handleLogout('TIMEOUT');
        return;
      }

      if (elapsed >= timeoutLimit) {
        handleLogout('TIMEOUT');
      } else if (elapsed >= timeoutLimit - SESSION_WARNING_BEFORE_MS) {
        if (!showWarning) {
          setShowWarning(true);
          const remainingSeconds = Math.max(0, Math.ceil((timeoutLimit - elapsed) / 1000));
          setSecondsLeft(remainingSeconds);
          
          clearInterval(countdownInterval.current);
          countdownInterval.current = setInterval(() => {
            setSecondsLeft(prev => {
              if (prev <= 1) {
                clearInterval(countdownInterval.current);
                handleLogout('TIMEOUT');
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }
      } else {
        if (showWarning) {
          setShowWarning(false);
          clearInterval(countdownInterval.current);
        }
      }
    }, 1000);

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetActivity);
      });
      clearInterval(checkInterval.current);
      clearInterval(countdownInterval.current);
    };
  }, [isAuthenticated, user, showWarning]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const verifySessionStatus = () => {
      const token = bkbStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const timeoutLimit = getTimeoutDuration();
      const elapsed = Date.now() - lastActivityTime.current;

      if (isTokenExpired(token) || elapsed >= timeoutLimit) {
        handleLogout('TIMEOUT');
      }
    };

    verifySessionStatus();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        verifySessionStatus();
      }
    };

    window.addEventListener('focus', verifySessionStatus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('focus', verifySessionStatus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [location.pathname, isAuthenticated]);

  if (!showWarning) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.65)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      animation: 'fadeIn 0.25s ease-out'
    }}>
      <div style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        border: '2px solid var(--border)',
        boxShadow: '0 24px 48px rgba(0, 0, 0, 0.35)',
        width: '90%',
        maxWidth: 400,
        padding: '24px 32px',
        textAlign: 'center',
        color: 'var(--text-primary)',
        transform: 'scale(1)',
        transition: 'transform 0.3s ease',
        boxSizing: 'border-box'
      }}>
        <div style={{
          width: 64, height: 64,
          borderRadius: '50%',
          background: 'rgba(255,107,0,0.08)',
          color: 'var(--red)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          fontSize: '2rem',
          boxShadow: '0 0 16px rgba(255,107,0,0.15)',
          animation: 'pulse 1.5s infinite alternate'
        }}>
          ⏰
        </div>

        <h3 style={{
          fontFamily: 'Poppins',
          fontWeight: 900,
          fontSize: '1.25rem',
          margin: '0 0 8px 0',
          color: 'var(--text-primary)'
        }}>
          Session Expiring
        </h3>
        
        <p style={{
          fontSize: '0.88rem',
          color: 'var(--text-secondary)',
          margin: '0 0 20px 0',
          lineHeight: 1.5
        }}>
          You have been inactive for a while. For security reasons, your session will end in:
        </p>

        <div style={{
          fontFamily: 'Poppins',
          fontWeight: 950,
          fontSize: '2.5rem',
          color: 'var(--red)',
          margin: '12px 0 24px',
          letterSpacing: -1
        }}>
          {secondsLeft}s
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            type="button"
            onClick={handleExtendSession}
            style={{
              background: 'var(--red)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '12px 24px',
              fontFamily: 'Poppins',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-red)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            Stay Logged In
          </button>
          
          <button
            type="button"
            onClick={() => handleLogout('MANUAL')}
            style={{
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: '1.5px solid var(--border)',
              borderRadius: 10,
              padding: '10px 24px',
              fontFamily: 'Poppins',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--text-secondary)';
              e.currentTarget.style.background = 'var(--cream-dark)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            Log Out Now
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pulse {
          from { transform: scale(0.96); box-shadow: 0 0 8px rgba(255,107,0,0.1); }
          to { transform: scale(1.04); box-shadow: 0 0 20px rgba(255,107,0,0.25); }
        }
      `}</style>
    </div>
  );
};
