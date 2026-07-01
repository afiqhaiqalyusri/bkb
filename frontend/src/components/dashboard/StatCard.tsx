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
    <div className="bg-[var(--surface)] rounded-[24px] p-6 lg:p-8 border border-[var(--border)] shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">{title}</p>
          <h3 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">{value}</h3>
          
          {trend !== undefined && (
            <div className="mt-4 flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center ${
                trend > 0 
                  ? 'bg-emerald-50 text-emerald-600' 
                  : trend < 0 
                    ? 'bg-red-50 text-red-600' 
                    : 'bg-[var(--background)] text-gray-600'
              }`}>
                {trend > 0 ? '+' : ''}{trend}%
              </span>
              {trendLabel && (
                <span className="text-[11px] font-medium text-gray-400">{trendLabel}</span>
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
