import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retrying?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Connection Timeout or Error',
  message = 'We could not connect to the server. Please check if the backend application is running and try again.',
  onRetry,
  retrying = false,
}) => {
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
        <AlertCircle size={28} />
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

      <p
        style={{
          fontSize: '0.86rem',
          lineHeight: 1.5,
          color: 'var(--text-muted)',
          margin: '0 0 24px 0',
          maxWidth: 340,
        }}
      >
        {message}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          disabled={retrying}
          className="btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 24px',
            fontSize: '0.88rem',
            height: 'auto',
            borderRadius: '12px',
            cursor: 'pointer',
            border: 'none',
            outline: 'none',
            boxShadow: 'var(--shadow-red)',
            transition: 'all 0.2s ease',
          }}
        >
          <RefreshCw size={16} className={retrying ? 'animate-spin' : ''} />
          {retrying ? 'Retrying...' : 'Try Again'}
        </button>
      )}
    </div>
  );
};
