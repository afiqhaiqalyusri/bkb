import React from 'react';
import { DashboardCard } from './DashboardCard';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  height?: number | string;
}

export const ChartCard: React.FC<ChartCardProps> = ({ 
  title, 
  subtitle, 
  action, 
  children,
  height = 300
}) => {
  return (
    <DashboardCard>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-bold text-[var(--text-primary)]">{title}</h3>
          {subtitle && <p className="text-sm text-[var(--text-secondary)] dark:text-slate-400 mt-1">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div style={{ height, width: '100%' }}>
        {children}
      </div>
    </DashboardCard>
  );
};
