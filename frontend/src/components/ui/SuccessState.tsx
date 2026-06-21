import React from 'react';
import { LucideIcon, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface SuccessStateProps {
  title: string;
  message: string;
  icon?: React.ReactNode;
  primaryAction?: { label: string; onClick: () => void; icon?: React.ReactNode };
  secondaryAction?: { label: string; onClick: () => void; icon?: React.ReactNode };
}

export const SuccessState: React.FC<SuccessStateProps> = ({
  title,
  message,
  icon,
  primaryAction,
  secondaryAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center animate-fade-in bg-white/50 backdrop-blur-md rounded-3xl m-4 border border-green-100 shadow-sm">
      <div className="w-24 h-24 rounded-full bg-green-50 text-green-500 flex items-center justify-center mb-6 shadow-inner border border-green-100 animate-bounce-slow">
        {icon || <CheckCircle2 size={48} strokeWidth={1.5} />}
      </div>
      
      <h1 className="text-3xl font-black text-gray-900 mb-3 tracking-tight font-outfit">
        {title}
      </h1>
      
      <p className="text-gray-500 max-w-md text-base leading-relaxed mb-8">
        {message}
      </p>
      
      <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-md">
        {primaryAction && (
          <button
            onClick={primaryAction.onClick}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white font-bold rounded-xl shadow-lg shadow-green-500/20 hover:-translate-y-0.5 hover:bg-green-600 transition-all focus:ring-4 focus:ring-green-100 active:scale-95 whitespace-nowrap"
          >
            {primaryAction.icon}
            {primaryAction.label}
          </button>
        )}

        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 font-bold rounded-xl border border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-all focus:ring-4 focus:ring-gray-100 active:scale-95 whitespace-nowrap"
          >
            {secondaryAction.icon}
            {secondaryAction.label}
          </button>
        )}
      </div>
    </div>
  );
};
