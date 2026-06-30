import React from 'react';

export type BadgeStatus = 'success' | 'warning' | 'danger' | 'info' | 'default';

interface StatusBadgeProps {
  status: BadgeStatus;
  label: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, className = '' }) => {
  const styles = {
    success: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50',
    warning: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50',
    danger:  'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50',
    info:    'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50',
    default: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[status]} ${className}`}>
      {label}
    </span>
  );
};
