import React from 'react';

interface AppCardProps {
  title?: string;
  subtitle?: string;
  icon?: any;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  noPadding?: boolean;
}

export const AppCard: React.FC<AppCardProps> = ({
  title,
  subtitle,
  icon: Icon,
  headerAction,
  children,
  className = '',
  style,
  noPadding = false,
}) => {
  return (
    <div
      className={`bg-[var(--bkb-card-bg)] rounded-xl border border-[var(--bkb-border)] shadow-sm overflow-hidden ${className}`}
      style={{
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        ...style,
      }}
    >
      {(title || headerAction) && (
        <div className="px-6 py-4 border-b border-[var(--bkb-border)] flex justify-between items-center bg-[rgba(0,0,0,0.01)]">
          <div className="flex items-center gap-3">
            {Icon && <Icon size={20} className="text-[var(--bkb-text)]" />}
            <div>
              {title && <h3 className="text-base font-bold text-[var(--bkb-text)] m-0">{title}</h3>}
              {subtitle && <p className="text-xs text-[var(--bkb-gray-400)] mt-1 mb-0">{subtitle}</p>}
            </div>
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-6'}>
        {children}
      </div>
    </div>
  );
};
