import React from 'react';
import { LucideIcon } from 'lucide-react';
import { DashboardCard } from '../dashboard/DashboardCard';

interface SettingsCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconColorClass?: string;
  children: React.ReactNode;
  danger?: boolean;
}

export const SettingsCard: React.FC<SettingsCardProps> = ({ 
  title, 
  description, 
  icon: Icon, 
  iconColorClass = 'text-primary',
  children,
  danger = false
}) => {
  return (
    <DashboardCard className={danger ? 'border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-900/10' : ''}>
      <div className="flex items-start gap-4 mb-6">
        {Icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm
            ${danger 
              ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
              : 'bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 ' + iconColorClass
            }`}
          >
            <Icon size={20} />
          </div>
        )}
        <div>
          <h3 className={`text-base font-bold ${danger ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
            {title}
          </h3>
          {description && (
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
      
      <div className="flex flex-col gap-0 border-t border-gray-100 dark:border-slate-800 pt-2">
        {children}
      </div>
    </DashboardCard>
  );
};
