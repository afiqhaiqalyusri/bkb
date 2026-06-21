import React from 'react';

interface StateLayoutProps {
  illustration: React.ReactNode;
  title: string;
  description?: string;
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  className?: string;
}

export const StateLayout: React.FC<StateLayoutProps> = ({
  illustration,
  title,
  description,
  primaryAction,
  secondaryAction,
  className = '',
}) => {
  return (
    <div 
      className={`flex flex-col items-center justify-center text-center px-6 py-12 md:py-20 animate-fade-in ${className}`}
      style={{
        maxWidth: '100%',
        margin: '0 auto',
      }}
    >
      {/* Illustration Container: 40-50% scale, responsive */}
      <div 
        className="w-full max-w-[280px] md:max-w-[340px] lg:max-w-[400px] mb-8 relative flex justify-center items-center"
      >
        {illustration}
      </div>

      {/* Typography Content */}
      <h2 
        className="text-2xl md:text-3xl font-bold mb-3 font-outfit"
        style={{ color: 'var(--text-primary)' }}
      >
        {title}
      </h2>
      
      {description && (
        <p 
          className="text-base md:text-lg mb-8 max-w-md mx-auto"
          style={{ color: 'var(--text-secondary)' }}
        >
          {description}
        </p>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full max-w-xs sm:max-w-md">
        {primaryAction}
        {secondaryAction}
      </div>
    </div>
  );
};
