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
    <div className={`bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden ${className}`}>
      <div className={noPadding ? '' : 'p-6 lg:p-8'}>
        {children}
      </div>
    </div>
  );
};
