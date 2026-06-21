import React from 'react';

export const ClosedSignIllustration: React.FC = () => {
  return (
    <div className="w-full h-full aspect-square relative animate-float-gentle">
      <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Background Blob */}
        <path d="M200 40C288.3 40 360 111.7 360 200C360 288.3 288.3 360 200 360C111.7 360 40 288.3 40 200C40 111.7 111.7 40 200 40Z" fill="var(--cream-dark)" opacity="0.6" />
        
        {/* Hanger / Hook */}
        <path d="M200 80 Q 200 60 220 60" stroke="#9CA3AF" strokeWidth="6" strokeLinecap="round" fill="none" />
        
        {/* Strings */}
        <line x1="200" y1="80" x2="120" y2="160" stroke="#D1D5DB" strokeWidth="4" />
        <line x1="200" y1="80" x2="280" y2="160" stroke="#D1D5DB" strokeWidth="4" />
        
        {/* Sign Board */}
        <rect x="80" y="160" width="240" height="120" rx="8" fill="var(--text-primary)" />
        <rect x="90" y="170" width="220" height="100" rx="4" fill="none" stroke="var(--primary)" strokeWidth="2" opacity="0.8" />
        
        {/* Text */}
        <text x="200" y="225" fontSize="40" fontWeight="bold" fontFamily="Outfit, sans-serif" fill="#FFFFFF" textAnchor="middle">CLOSED</text>
        <text x="200" y="245" fontSize="14" fontWeight="500" fontFamily="Inter, sans-serif" fill="var(--primary)" textAnchor="middle">Back in a bit!</text>
        
        {/* Sleeping Zzzs */}
        <g className="animate-pulse-glow">
          <text x="280" y="120" fontSize="24" fontWeight="bold" fontFamily="Outfit, sans-serif" fill="var(--primary)">z</text>
          <text x="310" y="90" fontSize="32" fontWeight="bold" fontFamily="Outfit, sans-serif" fill="var(--primary)">Z</text>
        </g>
      </svg>
    </div>
  );
};
