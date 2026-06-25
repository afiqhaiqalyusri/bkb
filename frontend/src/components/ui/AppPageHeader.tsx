import React from 'react';

interface AppPageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const AppPageHeader: React.FC<AppPageHeaderProps> = ({ title, subtitle, actions }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--bkb-text)] m-0 leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-[var(--bkb-gray-400)] mt-1 mb-0">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
};
