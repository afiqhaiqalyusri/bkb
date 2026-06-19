import React from 'react';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = { sm: 16, md: 24, lg: 40 };

export const LoadingSpinner: React.FC<Props> = ({ size = 'md', className = '' }) => {
  const s = sizes[size];
  return (
    <svg
      width={s} height={s}
      viewBox="0 0 24 24"
      className={`animate-spin ${className}`}
      style={{ animation: 'spin 0.8s linear infinite' }}
    >
      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.15)" strokeWidth="3" fill="none" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--bkb-orange)" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
};
