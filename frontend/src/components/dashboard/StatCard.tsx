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
  iconBgColor = 'rgba(255, 107, 0, 0.05)',
  iconColor = 'var(--primary)',
}) => {
  return (
    <div className="bg-[var(--bkb-card-bg)] rounded-2xl p-6 border border-[var(--bkb-border)] shadow-sm hover:shadow-md transition-shadow duration-200 flex justify-between items-start">
      <div className="flex-1 pr-2">
        <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">{title}</p>
        <h3 className="text-2xl font-extrabold text-[var(--bkb-text)] leading-none tracking-tight">{value}</h3>
        
        {trend !== undefined && (
          <div className="mt-3 flex items-center gap-1.5">
            <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
              trend > 0 
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' 
                : trend < 0 
                  ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400' 
                  : 'bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
            }`}>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
            {trendLabel && (
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">{trendLabel}</span>
            )}
          </div>
        )}
      </div>
      
      <div 
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border border-slate-100 dark:border-slate-800/80"
        style={{ backgroundColor: iconBgColor, color: iconColor }}
      >
        <Icon size={18} strokeWidth={2.5} />
      </div>
    </div>
  );
};
