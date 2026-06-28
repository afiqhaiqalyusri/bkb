import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import { AppButton } from './AppButton';

interface AppEmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  action?: React.ReactNode;
  className?: string;
}

export const AppEmptyState: React.FC<AppEmptyStateProps> = ({
  title,
  description,
  icon: Icon = Inbox,
  actionLabel,
  onAction,
  action,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center border border-dashed border-[var(--bkb-border)] rounded-xl bg-[rgba(0,0,0,0.01)] ${className}`}>
      <div className="w-16 h-16 rounded-full bg-[var(--bkb-card-bg)] flex items-center justify-center mb-4 shadow-sm border border-[var(--bkb-border)] text-[var(--bkb-gray-400)]">
        <Icon size={28} />
      </div>
      <h3 className="text-lg font-bold text-[var(--bkb-text)] mb-2 m-0">{title}</h3>
      {description && <p className="text-sm text-[var(--bkb-gray-400)] max-w-sm mb-6 m-0 leading-relaxed">{description}</p>}
      {actionLabel && onAction && (
        <AppButton variant="outline" onClick={onAction} className="mt-2">
          {actionLabel}
        </AppButton>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};
