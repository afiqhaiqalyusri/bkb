import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, LucideIcon } from 'lucide-react';

export type AppBadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

interface AppBadgeProps {
  variant?: AppBadgeVariant;
  text: string;
  icon?: boolean;
  className?: string;
}

const getVariantStyles = (variant: AppBadgeVariant) => {
  switch (variant) {
    case 'success':
      return { bg: 'bg-[var(--bkb-success)] bg-opacity-10', text: 'text-[var(--bkb-success)]', border: 'border-[var(--bkb-success)] border-opacity-20' };
    case 'warning':
      return { bg: 'bg-[var(--bkb-warning)] bg-opacity-10', text: 'text-[var(--bkb-warning)]', border: 'border-[var(--bkb-warning)] border-opacity-20' };
    case 'danger':
      return { bg: 'bg-[var(--danger)] bg-opacity-10', text: 'text-[var(--danger)]', border: 'border-[var(--danger)] border-opacity-20' };
    case 'primary':
      return { bg: 'bg-[var(--primary)] bg-opacity-10', text: 'text-[var(--primary)]', border: 'border-[var(--primary)] border-opacity-20' };
    case 'info':
      return { bg: 'bg-blue-500 bg-opacity-10', text: 'text-blue-500', border: 'border-blue-500 border-opacity-20' };
    default:
      return { bg: 'bg-[var(--bkb-border)]', text: 'text-[var(--bkb-gray-400)]', border: 'border-[var(--bkb-border)]' };
  }
};

const getIcon = (variant: AppBadgeVariant): LucideIcon | null => {
  switch (variant) {
    case 'success': return CheckCircle2;
    case 'warning': return AlertTriangle;
    case 'danger': return XCircle;
    case 'info': return Info;
    default: return null;
  }
};

export const AppBadge: React.FC<AppBadgeProps> = ({ variant = 'neutral', text, icon = false, className = '' }) => {
  const styles = getVariantStyles(variant);
  const Icon = icon ? getIcon(variant) : null;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${styles.bg} ${styles.text} ${styles.border} ${className}`}>
      {Icon && <Icon size={12} strokeWidth={3} />}
      {text}
    </span>
  );
};
