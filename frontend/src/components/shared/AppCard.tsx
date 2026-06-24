import React, { HTMLAttributes } from 'react';

interface AppCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'bordered';
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
    const baseStyles = 'rounded-2xl transition-shadow duration-200';
    
    const bgClass = noBackground ? 'bg-transparent' : 'bg-white';
    
    const variants = {
      default: 'shadow-sm border border-stone-100',
      elevated: 'shadow-md border border-stone-100/50 hover:shadow-lg',
      bordered: 'border-2 border-stone-200 shadow-none'
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
