import React from 'react';

type RoleType = 'ADMIN' | 'MANAGER' | 'STAFF' | 'CUSTOMER' | 'GUEST';

interface RoleBadgeProps {
  role: RoleType | string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, className = '', size = 'sm' }) => {
  const normalizedRole = (role || 'GUEST').toUpperCase();
  
  let colorClasses = '';
  switch (normalizedRole) {
    case 'ADMIN':
      colorClasses = 'bg-orange-100 text-primary border-orange-200 dark:bg-orange-900/30 dark:border-orange-900/50';
      break;
    case 'MANAGER':
      colorClasses = 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900/50';
      break;
    case 'STAFF':
      colorClasses = 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900/50';
      break;
    case 'CUSTOMER':
      colorClasses = 'bg-slate-100 text-slate-700 border-slate-200 bg-[var(--surface)] dark:text-slate-300 dark:border-slate-700';
      break;
    default:
      colorClasses = 'bg-gray-100 text-[var(--text-secondary)] border-[var(--border)] dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
  }

  const sizeClasses = {
    sm: 'text-[0.65rem] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5'
  };

  return (
    <span className={`inline-flex items-center font-bold tracking-wider rounded-full border uppercase ${sizeClasses[size]} ${colorClasses} ${className}`}>
      {normalizedRole}
    </span>
  );
};
