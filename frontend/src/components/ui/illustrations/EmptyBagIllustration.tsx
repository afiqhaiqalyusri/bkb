import React from 'react';

export const EmptyBagIllustration: React.FC = () => {
  return (
    <div className="w-full h-full aspect-square relative animate-float-gentle">
      <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Background Blob */}
        <path d="M196.2 360C110 360 40 288.3 40 200C40 111.7 110 40 196.2 40C282.4 40 352.4 111.7 352.4 200C352.4 288.3 282.4 360 196.2 360Z" fill="var(--cream-dark)" opacity="0.6" />
        
        {/* Paper Bag */}
        <path d="M120 140 L280 140 L300 320 L100 320 Z" fill="#D58143" />
        
        {/* Bag Opening (Front edge) */}
        <path d="M120 140 L280 140 L260 160 L140 160 Z" fill="#B36531" />
        
        {/* Bag Fold / Shadow */}
        <path d="M100 320 L140 160 L140 320 Z" fill="#B36531" opacity="0.5" />
        <path d="M300 320 L260 160 L260 320 Z" fill="#B36531" opacity="0.5" />
        
        {/* BKB Logo mark placeholder on bag */}
        <circle cx="200" cy="240" r="30" fill="var(--cream)" opacity="0.4" />
        <path d="M190 240 Q 200 220 210 240 Q 200 260 190 240" fill="#B36531" opacity="0.6" />
        
        {/* Little floating dust/wind particles to indicate emptiness */}
        <circle cx="160" cy="100" r="4" fill="var(--text-secondary)" opacity="0.4" className="animate-bounce-soft" />
        <circle cx="240" cy="80" r="3" fill="var(--text-secondary)" opacity="0.3" className="animate-bounce-soft" style={{ animationDelay: '0.2s' }} />
        <path d="M180 120 Q 200 100 220 120" stroke="var(--text-secondary)" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.3" className="animate-bounce-soft" style={{ animationDelay: '0.4s' }} />
      </svg>
    </div>
  );
};
