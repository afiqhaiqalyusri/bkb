import React from 'react';

interface SettingsRowProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  isLast?: boolean;
}

export const SettingsRow: React.FC<SettingsRowProps> = ({ title, description, children, icon, isLast = false }) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 ${!isLast ? 'border-b border-gray-100 dark:border-slate-800' : ''}`}>
      <div className="flex items-start gap-3 flex-1 pr-4">
        {icon && (
          <div className="mt-0.5 shrink-0 text-gray-400 dark:text-slate-500">
            {icon}
          </div>
        )}
        <div>
          <div className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
            {title}
          </div>
          {description && (
            <div className="text-xs text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">
              {description}
            </div>
          )}
        </div>
      </div>
      <div className="shrink-0 flex items-center">
        {children}
      </div>
    </div>
  );
};
