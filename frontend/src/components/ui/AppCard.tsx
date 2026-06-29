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
  hoverable?: boolean;
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
  hoverable = false,
}) => {
  return (
    <div
      className={`bg-[var(--bkb-card-bg)] rounded-2xl border border-[var(--bkb-border)] shadow-sm overflow-hidden transition-all duration-200 ${
        hoverable ? 'hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 hover:-translate-y-0.5' : ''
      } ${className}`}
      style={{
        boxShadow: '0 2px 8px -1px rgba(0, 0, 0, 0.04), 0 1px 3px -1px rgba(0, 0, 0, 0.02)',
        ...style,
      }}
    >
      {(title || headerAction) && (
        <div className="px-6 py-5 border-b border-[var(--bkb-border)] flex justify-between items-center bg-white dark:bg-slate-800">
          <div className="flex items-start gap-3">
            {Icon && (
              <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-slate-500 dark:text-slate-400 mt-0.5">
                <Icon size={16} />
              </div>
            )}
            <div>
              {title && <h3 className="text-sm font-bold text-[var(--bkb-text)] leading-tight m-0">{title}</h3>}
              {subtitle && <p className="text-xs text-[var(--bkb-gray-400)] mt-1 mb-0 leading-relaxed">{subtitle}</p>}
            </div>
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-6'}>
        {children}
      </div>
    </div>
  );
};
