import React from 'react';
import { BurgerLoader } from './BurgerLoader';

interface Props {
  message?: string;
  subtitle?: string;
}

export const FullScreenLoader: React.FC<Props> = ({ 
  message = 'Processing...', 
  subtitle = 'Please wait.' 
}) => {
  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(16, 16, 16, 0.82)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        pointerEvents: 'all',
        userSelect: 'none',
      }}
      onClick={e => e.stopPropagation()}
    >
      <div style={{ transform: 'scale(1.1)' }}>
        <BurgerLoader message={message} />
      </div>
      {subtitle && (
        <p 
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.82rem',
            color: 'var(--text-secondary)',
            marginTop: 4,
            fontWeight: 500,
            textAlign: 'center',
            opacity: 0.8
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
};
