import React from 'react';

interface DashboardCardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({ 
  children, 
  className = '',
  noPadding = false 
}) => {
  return (
    <div className={`bg-[var(--bkb-card-bg)] rounded-2xl border border-[var(--bkb-border)] shadow-sm overflow-hidden transition-shadow duration-200 hover:shadow-md ${className}`}>
      <div className={noPadding ? '' : 'p-6'}>
        {children}
      </div>
    </div>
  );
};
