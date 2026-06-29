import React from 'react';

interface AppFormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Reusable form field wrapper with label, optional hint, and error messaging.
 * Usage:
 *   <AppFormField label="Item Name" required error={errors.name}>
 *     <input ... />
 *   </AppFormField>
 */
export const AppFormField: React.FC<AppFormFieldProps> = ({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
  className = '',
}) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label
        htmlFor={htmlFor}
        style={{
          fontSize: '0.73rem',
          fontWeight: 700,
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        {label}
        {required && (
          <span style={{ color: 'var(--danger)', fontSize: '0.85em' }}>*</span>
        )}
      </label>

      {children}

      {hint && !error && (
        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          {hint}
        </p>
      )}

      {error && (
        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--danger)', lineHeight: 1.4 }}>
          {error}
        </p>
      )}
    </div>
  );
};

// ─── Shared input/select/textarea styling ─────────────────────────────────────
/**
 * CSS class string for consistent form control styling across the manager UI.
 * Apply to <input>, <select>, <textarea>.
 */
export const formControlClass =
  'w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-[var(--text-primary)] placeholder-slate-400 focus:outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10 transition-all duration-150 shadow-sm';

export const formControlStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  background: '#ffffff',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--text-primary)',
  fontSize: '0.85rem',
  outline: 'none',
  transition: 'all 0.15s',
};
