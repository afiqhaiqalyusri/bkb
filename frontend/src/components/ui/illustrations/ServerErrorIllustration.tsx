import React from 'react';

export const ServerErrorIllustration: React.FC = () => {
  return (
    <div className="w-full h-full aspect-square relative animate-float-gentle">
      <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Background Blob */}
        <path d="M40 200C40 111.7 111.7 40 200 40C288.3 40 360 111.7 360 200C360 288.3 288.3 360 200 360C111.7 360 40 288.3 40 200Z" fill="var(--cream-dark)" opacity="0.6" />
        
        {/* Gear / Exclamation in background */}
        <path d="M200 100 L200 240 M200 270 L200 280" stroke="var(--border)" strokeWidth="20" strokeLinecap="round" opacity="0.4" />
        
        {/* Dropping elements */}
        {/* Top Bun */}
        <path d="M140 140 Q 200 100 260 140 L 250 160 L 150 160 Z" fill="#D58143" className="animate-bounce-soft" style={{ animationDelay: '0.1s' }} />
        
        {/* Tomato */}
        <rect x="180" y="180" width="80" height="12" rx="4" fill="#EF5350" transform="rotate(15 200 180)" className="animate-bounce-soft" style={{ animationDelay: '0.2s' }} />
        
        {/* Cheese */}
        <path d="M130 220 L240 210 L250 225 L140 235 Z" fill="#FFCA28" transform="rotate(-10 200 220)" className="animate-bounce-soft" style={{ animationDelay: '0.3s' }} />
        
        {/* Patty */}
        <rect x="150" y="260" width="100" height="18" rx="8" fill="#5A3626" transform="rotate(5 200 260)" className="animate-bounce-soft" style={{ animationDelay: '0.4s' }} />
        
        {/* Bottom Bun */}
        <path d="M160 300 L260 300 L250 320 Q 200 340 170 320 Z" fill="#D58143" transform="rotate(-5 200 300)" className="animate-bounce-soft" style={{ animationDelay: '0.5s' }} />
        
        {/* Chef Hat outline */}
        <path d="M80 140 Q 100 80 140 100 Q 160 60 200 80 Q 240 60 260 100 Q 300 80 320 140 L 280 180 L 120 180 Z" stroke="var(--primary)" strokeWidth="6" strokeDasharray="10 10" fill="none" opacity="0.3" />
      </svg>
    </div>
  );
};
