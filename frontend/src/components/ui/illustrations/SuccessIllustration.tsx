import React from 'react';

export const SuccessIllustration: React.FC = () => {
  return (
    <div className="w-full h-full aspect-square relative animate-float-gentle">
      <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Background Blob */}
        <circle cx="200" cy="200" r="160" fill="rgba(34, 197, 94, 0.15)" />
        
        {/* Receipt Paper */}
        <path d="M140 100 L260 100 L260 300 L240 290 L220 300 L200 290 L180 300 L160 290 L140 300 Z" fill="#FFFFFF" filter="drop-shadow(0 10px 20px rgba(0,0,0,0.1))" />
        
        {/* Receipt Lines */}
        <rect x="160" y="140" width="80" height="6" rx="3" fill="#E5E7EB" />
        <rect x="160" y="160" width="60" height="6" rx="3" fill="#E5E7EB" />
        <rect x="160" y="180" width="70" height="6" rx="3" fill="#E5E7EB" />
        
        {/* Checkmark Circle */}
        <circle cx="200" cy="240" r="30" fill="#10B981" className="animate-pulse-glow" />
        
        {/* Checkmark */}
        <path d="M188 240 L196 248 L212 232" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        
        {/* Confetti */}
        <circle cx="100" cy="120" r="6" fill="var(--primary)" className="animate-bounce-soft" />
        <circle cx="300" cy="160" r="8" fill="#FBBF24" className="animate-bounce-soft" style={{ animationDelay: '0.2s' }} />
        <circle cx="120" cy="260" r="5" fill="#3B82F6" className="animate-bounce-soft" style={{ animationDelay: '0.4s' }} />
        <circle cx="280" cy="280" r="7" fill="var(--primary)" className="animate-bounce-soft" style={{ animationDelay: '0.1s' }} />
        
        <path d="M90 180 L100 190" stroke="#10B981" strokeWidth="4" strokeLinecap="round" className="animate-bounce-soft" style={{ animationDelay: '0.3s' }} />
        <path d="M310 220 L300 210" stroke="var(--primary)" strokeWidth="4" strokeLinecap="round" className="animate-bounce-soft" style={{ animationDelay: '0.5s' }} />
      </svg>
    </div>
  );
};
