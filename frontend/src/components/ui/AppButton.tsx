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
      return 'bg-[var(--primary)] hover:bg-[var(--red-dark)] text-white border border-transparent shadow-sm';
    case 'secondary':
      return 'bg-[var(--bkb-card-bg)] hover:bg-[var(--bkb-cream)] text-[var(--bkb-text)] border border-[var(--bkb-border)] shadow-sm';
    case 'danger':
      return 'bg-[var(--danger)] hover:bg-red-600 text-white border border-transparent shadow-sm';
    case 'success':
      return 'bg-[var(--bkb-success)] hover:bg-green-600 text-white border border-transparent shadow-sm';
    case 'outline':
      return 'bg-transparent hover:bg-[rgba(255,107,0,0.05)] text-[var(--primary)] border border-[var(--primary)]';
    case 'ghost':
      return 'bg-transparent hover:bg-[rgba(0,0,0,0.05)] text-[var(--bkb-gray-400)] hover:text-[var(--bkb-text)]';
    default:
      return '';
  }
};

const getSizeStyles = (size: AppButtonSize) => {
  switch (size) {
    case 'sm': return 'px-3 py-1.5 text-xs';
    case 'md': return 'px-4 py-2 text-sm';
    case 'lg': return 'px-6 py-3 text-base font-semibold';
    case 'icon': return 'p-2';
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
  const disabledStyles = disabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer transform hover:-translate-y-px transition-all duration-150';

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 focus:ring-offset-[var(--bkb-card-bg)] ${variantStyles} ${sizeStyles} ${disabledStyles} ${className}`}
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
