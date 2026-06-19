import React from 'react';

interface Props {
  variant?: 'orange' | 'good' | 'low' | 'critical' | 'gray';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<Props> = ({ variant = 'gray', children, className = '' }) => (
  <span className={`badge badge-${variant} ${className}`}>
    {children}
  </span>
);

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span className={`badge status-${status}`}>{status}</span>
);

export const InventoryStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = { GOOD: 'good', LOW: 'low', CRITICAL: 'critical' };
  const icons: Record<string, string> = { GOOD: '✓', LOW: '⚠', CRITICAL: '🔴' };
  return (
    <span className={`badge badge-${map[status] || 'gray'}`}>
      {icons[status]} {status}
    </span>
  );
};
