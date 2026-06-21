import React from 'react';

export const RestrictedIllustration: React.FC = () => {
  return (
    <div className="w-full h-full aspect-square relative animate-float-gentle">
      <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Background Blob */}
        <circle cx="200" cy="200" r="160" fill="var(--cream-dark)" opacity="0.6" />
        
        {/* Door Frame */}
        <path d="M120 100 L280 100 L280 320 L120 320 Z" fill="#9CA3AF" />
        <path d="M130 110 L270 110 L270 320 L130 320 Z" fill="#4B5563" />
        
        {/* Door Panels (Double Doors closed) */}
        <path d="M130 110 L198 110 L198 320 L130 320 Z" fill="#F3F4F6" />
        <path d="M202 110 L270 110 L270 320 L202 320 Z" fill="#F3F4F6" />
        
        {/* Windows */}
        <rect x="145" y="130" width="38" height="60" rx="19" fill="#9CA3AF" opacity="0.5" />
        <rect x="217" y="130" width="38" height="60" rx="19" fill="#9CA3AF" opacity="0.5" />
        
        {/* Push plates */}
        <rect x="175" y="220" width="12" height="40" rx="2" fill="#D1D5DB" />
        <rect x="213" y="220" width="12" height="40" rx="2" fill="#D1D5DB" />
        
        {/* Staff Only Sign */}
        <g transform="translate(140, 180) rotate(-5)">
          <rect x="0" y="0" width="120" height="30" rx="4" fill="var(--primary)" className="animate-pulse-glow" />
          <text x="60" y="20" fontSize="16" fontWeight="bold" fontFamily="Outfit, sans-serif" fill="#FFFFFF" textAnchor="middle">RESTRICTED</text>
        </g>
        
        {/* Lock Icon overlay */}
        <g transform="translate(200, 270)">
          <rect x="-15" y="0" width="30" height="24" rx="4" fill="var(--text-primary)" />
          <path d="M-8 0 V-8 C-8 -15, 8 -15, 8 -8 V0" stroke="var(--text-primary)" strokeWidth="4" fill="none" />
          <circle cx="0" cy="12" r="3" fill="#FFFFFF" />
        </g>
      </svg>
    </div>
  );
};
