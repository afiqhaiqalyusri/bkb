import React from 'react';

export const PaymentErrorIllustration: React.FC = () => {
  return (
    <div className="w-full h-full aspect-square relative animate-float-gentle">
      <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Background Blob */}
        <circle cx="200" cy="200" r="160" fill="var(--cream-dark)" opacity="0.6" />
        
        {/* Terminal Body */}
        <rect x="140" y="200" width="120" height="140" rx="16" fill="#4B5563" />
        <rect x="150" y="210" width="100" height="60" rx="8" fill="#1F2937" />
        
        {/* Terminal buttons */}
        <circle cx="165" cy="290" r="8" fill="#9CA3AF" />
        <circle cx="190" cy="290" r="8" fill="#9CA3AF" />
        <circle cx="215" cy="290" r="8" fill="#9CA3AF" />
        <circle cx="240" cy="290" r="8" fill="var(--primary)" />
        
        <circle cx="165" cy="315" r="8" fill="#9CA3AF" />
        <circle cx="190" cy="315" r="8" fill="#9CA3AF" />
        <circle cx="215" cy="315" r="8" fill="#9CA3AF" />
        <circle cx="240" cy="315" r="8" fill="#10B981" />
        
        {/* Screen Content - Error Cross */}
        <path d="M190 230 L210 250 M210 230 L190 250" stroke="var(--primary)" strokeWidth="4" strokeLinecap="round" className="animate-pulse-glow" />
        
        {/* Credit Card (inserted but rejected) */}
        <g className="animate-bounce-soft" style={{ animationDelay: '0.2s' }}>
          <rect x="150" y="100" width="100" height="140" rx="12" fill="#D1D5DB" />
          <rect x="150" y="120" width="100" height="20" fill="#9CA3AF" />
          <rect x="160" y="150" width="20" height="15" rx="4" fill="#FBBF24" />
          {/* Card split effect */}
          <path d="M130 180 L270 160" stroke="var(--primary)" strokeWidth="6" strokeDasharray="8 8" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
};
