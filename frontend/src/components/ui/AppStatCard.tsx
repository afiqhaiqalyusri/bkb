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
    <AppCard hoverable>
      <div className="flex justify-between items-start">
        <div className="flex-1 pr-2">
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
            {title}
          </p>
          <h4 className="text-2xl font-extrabold text-[var(--bkb-text)] leading-none tracking-tight">
            {value}
          </h4>
          
          {trend !== undefined && (
            <div className="flex items-center gap-1.5 mt-3">
              <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                trend > 0 
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' 
                  : trend < 0 
                    ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400' 
                    : 'bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {trend > 0 ? (
                  <TrendingUp size={10} className="stroke-[3]" />
                ) : trend < 0 ? (
                  <TrendingDown size={10} className="stroke-[3]" />
                ) : (
                  <Minus size={10} className="stroke-[3]" />
                )}
                {Math.abs(trend)}%
              </span>
              {trendLabel && (
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                  {trendLabel}
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className={`p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 flex items-center justify-center shrink-0`}>
          <Icon size={20} className={colorClass} />
        </div>
      </div>
    </AppCard>
  );
};
