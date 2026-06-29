import React from 'react';

interface SettingsToggleProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  danger?: boolean;
}

export const SettingsToggle: React.FC<SettingsToggleProps> = ({ checked, onChange, disabled = false, danger = false }) => {
  
  const activeBg = danger ? 'bg-red-500' : 'bg-primary';
  
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange()}
      disabled={disabled}
      className={`
        relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
        ${checked ? activeBg : 'bg-gray-200 dark:bg-slate-700'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <span className="sr-only">Toggle setting</span>
      <span
        aria-hidden="true"
        className={`
          pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
          ${checked ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  );
};
