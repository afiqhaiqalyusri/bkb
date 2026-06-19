import React from 'react';
import { useNavigate, useRouteError } from 'react-router-dom';

export const GlobalErrorPage: React.FC = () => {
  const navigate = useNavigate();
  const error = useRouteError() as any;

  // Log error to console for developers, but hide detail from users
  React.useEffect(() => {
    console.error('Captured Global Application Error:', error);
  }, [error]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '24px',
      background: 'var(--background, #F8FAFC)',
      color: 'var(--text-primary, #1A1A1A)',
      fontFamily: "'Outfit', 'Inter', sans-serif",
      textAlign: 'center',
      boxSizing: 'border-box'
    }}>
      {/* Visual illustration (Broken Burger Plate SVG) */}
      <div style={{
        background: 'var(--cream-dark, #F1F5F9)',
        width: 120,
        height: 120,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 28,
        border: '1.5px solid var(--border, #E5E7EB)',
        boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))',
        color: 'var(--primary, #FF6B00)'
      }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>

      <h1 style={{
        fontFamily: "'Outfit', sans-serif",
        fontWeight: 900,
        fontSize: '2rem',
        marginBottom: 12,
        color: 'var(--text-primary, #1A1A1A)',
        lineHeight: 1.2
      }}>
        Something Went Wrong
      </h1>

      <p style={{
        color: 'var(--text-secondary, #6B7280)',
        fontSize: '0.95rem',
        maxWidth: 420,
        marginBottom: 32,
        lineHeight: 1.6
      }}>
        An unexpected application error occurred. We apologize for the inconvenience. Our team has been notified.
      </p>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => {
            // Hard reload to root path to reset all app states
            window.location.replace('/');
          }}
          style={{
            background: 'linear-gradient(135deg, var(--primary, #FF6B00) 0%, var(--red-dark, #E05E00) 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            padding: '14px 28px',
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-red, 0 6px 20px rgba(255,107,0,0.15))',
            transition: 'transform 0.2s, box-shadow 0.2s',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(255,107,0,0.3)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'var(--shadow-red, 0 6px 20px rgba(255,107,0,0.15))';
          }}
        >
          Go Back Home
        </button>

        <button
          onClick={() => window.location.reload()}
          style={{
            background: 'transparent',
            color: 'var(--text-secondary, #6B7280)',
            border: '1px solid var(--border, #E5E7EB)',
            borderRadius: 12,
            padding: '14px 28px',
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--cream-dark, #F1F5F9)';
            e.currentTarget.style.color = 'var(--text-primary, #1A1A1A)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-secondary, #6B7280)';
          }}
        >
          Reload Page
        </button>
      </div>
    </div>
  );
};
