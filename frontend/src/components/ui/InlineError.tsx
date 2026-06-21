import React from 'react';
import { AlertCircle } from 'lucide-react';

interface InlineErrorProps {
  message?: string;
}

export const InlineError: React.FC<InlineErrorProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="flex items-center gap-1.5 mt-1.5 text-red-500 text-sm font-medium animate-fade-in">
      <AlertCircle size={14} className="shrink-0" />
      <span>{message}</span>
    </div>
  );
};
