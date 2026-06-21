import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon: LucideIcon;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, icon: Icon, action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-in rounded-2xl border border-[var(--border)] shadow-sm w-full" style={{ backgroundColor: 'var(--surface)' }}>
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5" style={{ backgroundColor: 'var(--cream-dark)', color: 'var(--text-secondary)' }}>
        <Icon size={40} strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-bold mb-2 font-outfit" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      <p className="max-w-sm mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>{description}</p>
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
};
