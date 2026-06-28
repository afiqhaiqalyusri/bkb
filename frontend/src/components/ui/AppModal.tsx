import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { AppButton, AppButtonVariant } from './AppButton';

export interface AppModalAction {
  label: string;
  variant?: AppButtonVariant;
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit';
}

interface AppModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  actions?: AppModalAction[];
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** If true, clicking the backdrop does NOT close the modal */
  disableBackdropClose?: boolean;
  /** Wrap children in a form element and handle submit */
  onSubmit?: (e: React.FormEvent) => void;
}

const SIZE_MAP: Record<string, string> = {
  sm: '400px',
  md: '520px',
  lg: '680px',
  xl: '860px',
};

export const AppModal: React.FC<AppModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  actions,
  size = 'md',
  disableBackdropClose = false,
  onSubmit,
}) => {
  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !disableBackdropClose) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose, disableBackdropClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const content = (
    <>
      {/* Header */}
      <div style={{
        padding: '18px 24px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        background: 'var(--background)',
      }}>
        {icon && (
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'rgba(255,107,0,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--primary)', flexShrink: 0,
          }}>
            {icon}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
            {title}
          </h3>
          {subtitle && (
            <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {subtitle}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-secondary)', padding: 4, borderRadius: 6,
            display: 'flex', alignItems: 'center',
            transition: 'all 0.15s',
            flexShrink: 0,
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'var(--border)';
            (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'none';
            (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
          }}
          aria-label="Close modal"
        >
          <X size={18} />
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: '20px 24px', overflowY: 'auto', maxHeight: 'calc(85vh - 140px)' }}>
        {children}
      </div>

      {/* Footer */}
      {actions && actions.length > 0 && (
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 10,
          background: 'var(--background)',
          flexShrink: 0,
        }}>
          {actions.map((action, i) => (
            <AppButton
              key={i}
              variant={action.variant ?? (i === 0 && actions.length > 1 ? 'outline' : 'primary')}
              onClick={action.type === 'submit' ? undefined : action.onClick}
              type={action.type ?? 'button'}
              isLoading={action.isLoading}
              disabled={action.disabled}
              size="sm"
            >
              {action.label}
            </AppButton>
          ))}
        </div>
      )}
    </>
  );

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.15s ease',
      }}
      onClick={disableBackdropClose ? undefined : onClose}
    >
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 16,
          border: '1px solid var(--border)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          width: '100%',
          maxWidth: SIZE_MAP[size] || SIZE_MAP.md,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          animation: 'slideUp 0.2s ease',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {onSubmit ? (
          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {content}
          </form>
        ) : (
          content
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
    </div>
  );
};
