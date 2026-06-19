import React, { useEffect, useRef } from 'react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  details?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'info' | 'warning' | 'danger';
  metadata?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  details,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  type = 'info',
  metadata,
  onConfirm,
  onCancel
}) => {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Prevent scrolling when modal is open and handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    
    // Auto-focus confirm button for accessibility
    setTimeout(() => {
      confirmButtonRef.current?.focus();
    }, 50);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  // Determine styles based on dialog type
  const getColors = () => {
    switch (type) {
      case 'danger':
        return {
          icon: '⚠️',
          iconBg: 'rgba(239, 68, 68, 0.08)',
          iconColor: '#EF4444',
          btnBg: '#EF4444',
          btnShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
          btnBorder: 'none'
        };
      case 'warning':
        return {
          icon: '🔸',
          iconBg: 'rgba(245, 158, 11, 0.08)',
          iconColor: '#F59E0B',
          btnBg: '#F59E0B',
          btnShadow: '0 4px 12px rgba(245, 158, 11, 0.25)',
          btnBorder: 'none'
        };
      case 'info':
      default:
        return {
          icon: 'ℹ️',
          iconBg: 'rgba(230, 51, 41, 0.08)',
          iconColor: 'var(--red)',
          btnBg: 'var(--red)',
          btnShadow: 'var(--shadow-red)',
          btnBorder: 'none'
        };
    }
  };

  const colors = getColors();

  return (
    <div 
      onClick={onCancel}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          border: '2px solid var(--border)',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.35)',
          width: '90%',
          maxWidth: 440,
          padding: '24px 32px',
          color: 'var(--text-primary)',
          animation: 'scaleIn 0.2s ease-out',
          boxSizing: 'border-box'
        }}
      >
        {/* Header Icon + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{
            width: 44, height: 44,
            borderRadius: 12,
            background: colors.iconBg,
            color: colors.iconColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem',
            flexShrink: 0
          }}>
            {colors.icon}
          </div>
          <h3 style={{
            fontFamily: 'Poppins',
            fontWeight: 900,
            fontSize: '1.2rem',
            margin: 0,
            color: 'var(--text-primary)'
          }}>
            {title}
          </h3>
        </div>

        {/* Message */}
        <p style={{
          fontSize: '0.88rem',
          color: 'var(--text-secondary)',
          margin: '0 0 12px 0',
          lineHeight: 1.5,
          textAlign: 'left'
        }}>
          {message}
        </p>

        {/* Details (Irreversible warnings, logs info, etc.) */}
        {details && (
          <p style={{
            fontSize: '0.76rem',
            color: type === 'danger' ? '#EF4444' : 'var(--text-muted)',
            margin: '0 0 16px 0',
            lineHeight: 1.4,
            fontWeight: type === 'danger' ? 700 : 500,
            textAlign: 'left'
          }}>
            {details}
          </p>
        )}

        {/* Custom Meta Information (e.g. Amounts, Role diffs) */}
        {metadata && (
          <div style={{
            background: 'var(--secondary-bg)',
            border: '1.5px solid var(--border)',
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 20,
            textAlign: 'left'
          }}>
            {metadata}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1,
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: '1.5px solid var(--border)',
              borderRadius: 10,
              padding: '11px 16px',
              fontFamily: 'Poppins',
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: 'pointer',
              transition: 'all 0.18s ease'
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
            {cancelLabel}
          </button>

          <button
            ref={confirmButtonRef}
            type="button"
            onClick={onConfirm}
            style={{
              flex: 1,
              background: colors.btnBg,
              color: '#fff',
              border: colors.btnBorder,
              borderRadius: 10,
              padding: '11px 16px',
              fontFamily: 'Poppins',
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: 'pointer',
              boxShadow: colors.btnShadow,
              transition: 'all 0.18s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            {confirmLabel}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
