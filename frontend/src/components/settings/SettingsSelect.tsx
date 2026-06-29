import React from 'react';

interface SettingsSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { label: string; value: string | number }[];
}

export const SettingsSelect: React.FC<SettingsSelectProps> = ({ options, className = '', ...props }) => {
  return (
    <div className="relative">
      <select
        className={`
          appearance-none w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 
          text-gray-900 dark:text-white text-sm font-semibold rounded-lg px-4 py-2.5 pr-10 
          focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow cursor-pointer
          ${className}
        `}
        {...props}
      >
        {options.map((opt) => (
          <option key={String(opt.value)} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 dark:text-slate-400">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
};
