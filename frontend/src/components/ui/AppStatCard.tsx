import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { AppCard } from './AppCard';

interface AppStatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number; // Positive for up, negative for down, 0 for flat
  trendLabel?: string;
  colorClass?: string; // e.g., 'text-blue-500', 'text-[var(--primary)]'
}

export const AppStatCard: React.FC<AppStatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  colorClass = 'text-[var(--primary)]'
}) => {
  return (
    <AppCard className="transition-transform duration-200 hover:-translate-y-1">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-semibold text-[var(--bkb-gray-400)] uppercase tracking-wider mb-1">
            {title}
          </p>
          <h4 className="text-2xl font-bold text-[var(--bkb-text)] m-0">
            {value}
          </h4>
          
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-3">
              {trend > 0 ? (
                <TrendingUp size={14} className="text-[var(--bkb-success)]" />
              ) : trend < 0 ? (
                <TrendingDown size={14} className="text-[var(--danger)]" />
              ) : (
                <Minus size={14} className="text-[var(--bkb-gray-400)]" />
              )}
              <span className={`text-xs font-medium ${trend > 0 ? 'text-[var(--bkb-success)]' : trend < 0 ? 'text-[var(--danger)]' : 'text-[var(--bkb-gray-400)]'}`}>
                {Math.abs(trend)}%
              </span>
              {trendLabel && (
                <span className="text-xs text-[var(--bkb-gray-400)] ml-1">
                  {trendLabel}
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className={`p-3 rounded-lg bg-opacity-10 ${colorClass.replace('text-', 'bg-')} bg-[var(--bkb-border)]`}>
          <Icon size={22} className={colorClass} />
        </div>
      </div>
    </AppCard>
  );
};
