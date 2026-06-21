import React from 'react';
import { AlertTriangle, Home, RefreshCw, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ErrorStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  onRetry?: () => void;
  retrying?: boolean;
  showHomeButton?: boolean;
  showReloadButton?: boolean;
  actions?: React.ReactNode;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Oops, something went wrong',
  message = 'We encountered an unexpected error. Please try again later.',
  icon,
  onRetry,
  retrying = false,
  showHomeButton = false,
  showReloadButton = false,
  actions,
}) => {
  const navigate = useNavigate();
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        textAlign: 'center',
        background: 'rgba(255, 255, 255, 0.95)',
        border: '1px solid rgba(74, 44, 42, 0.08)',
        borderRadius: '20px',
        boxShadow: '0 10px 30px rgba(74, 44, 42, 0.04)',
        maxWidth: 440,
        margin: '40px auto',
        backdropFilter: 'blur(8px)',
        animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '16px',
          background: 'rgba(230, 51, 41, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--red)',
          marginBottom: 20,
        }}
      >
        {icon ? icon : <AlertTriangle size={28} />}
      </div>

      <h3
        style={{
          fontFamily: 'Poppins, sans-serif',
          fontWeight: 900,
          fontSize: '1.15rem',
          color: 'var(--text-dark)',
          margin: '0 0 10px 0',
        }}
      >
        {title}
      </h3>

      {message && (
        <p style={{
          fontSize: '0.9rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          marginBottom: (onRetry || showHomeButton || showReloadButton || actions) ? 24 : 0,
        }}>
          {message}
        </p>
      )}

      {(onRetry || showHomeButton || showReloadButton || actions) && (
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {onRetry && (
            <button
              onClick={onRetry}
              disabled={retrying}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                background: 'var(--primary)',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontFamily: 'Poppins',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: retrying ? 'not-allowed' : 'pointer',
                opacity: retrying ? 0.8 : 1,
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.2s',
              }}
            >
              {retrying ? (
                <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
              ) : (
                'Try Again'
              )}
            </button>
          )}

          {showReloadButton && (
            <button
              onClick={() => window.location.reload()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                background: 'var(--primary)',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontFamily: 'Poppins',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.2s',
              }}
            >
              <RefreshCw size={16} />
              Reload Page
            </button>
          )}

          {showHomeButton && (
            <button
              onClick={() => navigate('/')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                background: 'var(--surface)',
                color: 'var(--text-primary)',
                border: '1.5px solid var(--border)',
                borderRadius: 12,
                fontFamily: 'Poppins',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <Home size={16} />
              Go Home
            </button>
          )}

          {actions}
        </div>
      )}
    </div>
  );
};
