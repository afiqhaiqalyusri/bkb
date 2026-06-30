import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number; // positive or negative percentage
  trendLabel?: string;
  iconBgColor?: string;
  iconColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  iconBgColor = 'rgba(255, 107, 0, 0.1)',
  iconColor = 'var(--primary)',
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</h3>
          
          {trend !== undefined && (
            <div className="mt-3 flex items-center gap-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center ${
                trend > 0 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                  : trend < 0 
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
                    : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300'
              }`}>
                {trend > 0 ? '+' : ''}{trend}%
              </span>
              {trendLabel && (
                <span className="text-xs text-gray-400 dark:text-slate-500">{trendLabel}</span>
              )}
            </div>
          )}
        </div>
        
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: iconBgColor, color: iconColor }}
        >
          <Icon size={24} strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
};
