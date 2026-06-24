import React, { HTMLAttributes } from 'react';

interface AppCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'bordered' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  noBackground?: boolean;
}

export const AppCard = React.forwardRef<HTMLDivElement, AppCardProps>(
  (
    {
      children,
      variant = 'default',
      padding = 'md',
      noBackground = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles = 'rounded-2xl transition-all duration-300';
    
    const bgClass = noBackground ? 'bg-transparent' : 'bg-[var(--surface)]';
    
    const variants = {
      default: 'shadow-sm border border-[var(--border)] hover:border-[var(--primary)] hover:shadow-md',
      elevated: 'shadow-md border border-[var(--border)] hover:shadow-lg hover:-translate-y-1',
      bordered: 'border-2 border-[var(--border)] shadow-none hover:border-[var(--primary)]',
      glass: 'glass shadow-lg border border-[rgba(255,255,255,0.3)]'
    };

    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8'
    };

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${bgClass} ${variants[variant]} ${paddings[padding]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

AppCard.displayName = 'AppCard';
