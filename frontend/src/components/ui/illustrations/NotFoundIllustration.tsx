import React from 'react';

export const NotFoundIllustration: React.FC = () => {
  return (
    <div className="w-full h-full aspect-square relative animate-float-gentle">
      <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Background Blob */}
        <path d="M352.4 200C352.4 288.3 282.4 360 196.2 360C110 360 40 288.3 40 200C40 111.7 110 40 196.2 40C282.4 40 352.4 111.7 352.4 200Z" fill="var(--cream-dark)" opacity="0.6" />
        
        {/* 404 text in background */}
        <text x="200" y="240" fontSize="180" fontWeight="900" fontFamily="Outfit, sans-serif" fill="var(--border)" opacity="0.5" textAnchor="middle">404</text>
        
        {/* Tray */}
        <path d="M80 280 L320 280 L340 310 L60 310 Z" fill="#D1D5DB" />
        <path d="M60 310 L340 310 L340 320 L60 320 Z" fill="#9CA3AF" />
        
        {/* Missing Burger Dotted Outline */}
        <path d="M120 280 C120 220, 280 220, 280 280" stroke="var(--primary)" strokeWidth="6" strokeDasharray="12 12" fill="none" opacity="0.8" />
        
        {/* Little crumbs */}
        <circle cx="160" cy="270" r="4" fill="var(--primary)" opacity="0.6" />
        <circle cx="230" cy="265" r="3" fill="#D58143" opacity="0.8" />
        <circle cx="190" cy="275" r="5" fill="#5A3626" opacity="0.5" />
        
        {/* Question Mark */}
        <text x="200" y="255" fontSize="80" fontWeight="800" fontFamily="Outfit, sans-serif" fill="var(--primary)" textAnchor="middle" className="animate-bounce-soft">?</text>
      </svg>
    </div>
  );
};
