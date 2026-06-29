import React from 'react';
import { LucideIcon } from 'lucide-react';

export type AppButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'success';
export type AppButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface AppButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
}

const getVariantStyles = (variant: AppButtonVariant) => {
  switch (variant) {
    case 'primary':
      return 'bg-[var(--primary)] hover:bg-[var(--red-dark)] active:bg-orange-700 text-white border border-transparent shadow-sm hover:shadow transition-all';
    case 'secondary':
      return 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-[var(--bkb-text)] border border-[var(--bkb-border)] shadow-sm transition-all';
    case 'danger':
      return 'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white border border-transparent shadow-sm transition-all';
    case 'success':
      return 'bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white border border-transparent shadow-sm transition-all';
    case 'outline':
      return 'bg-transparent hover:bg-orange-50 dark:hover:bg-orange-950/20 text-[var(--primary)] border border-[var(--primary)] transition-all';
    case 'ghost':
      return 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-[var(--bkb-gray-400)] hover:text-[var(--bkb-text)] transition-all';
    default:
      return '';
  }
};

const getSizeStyles = (size: AppButtonSize) => {
  switch (size) {
    case 'sm': return 'px-3 py-1.5 text-xs rounded-md';
    case 'md': return 'px-4 py-2 text-sm rounded-lg';
    case 'lg': return 'px-5 py-2.5 text-sm font-semibold rounded-lg';
    case 'icon': return 'p-2 rounded-lg';
    default: return '';
  }
};

export const AppButton: React.FC<AppButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const variantStyles = getVariantStyles(variant);
  const sizeStyles = getSizeStyles(size);
  const disabledStyles = disabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98] transition-all duration-150';

  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:ring-offset-0 ${variantStyles} ${sizeStyles} ${disabledStyles} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {!isLoading && Icon && iconPosition === 'left' && <Icon size={size === 'sm' ? 14 : size === 'icon' ? 18 : 16} />}
      {children}
      {!isLoading && Icon && iconPosition === 'right' && <Icon size={size === 'sm' ? 14 : size === 'icon' ? 18 : 16} />}
    </button>
  );
};
