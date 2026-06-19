import React from 'react';

interface Props {
  message?: string;
}

export const BurgerLoader: React.FC<Props> = ({ message = 'Loading Menu...' }) => {
  return (
    <div className="burger-loader-container">
      <div className="burger-stack">
        <div className="burger-layer bb-tbun" />
        <div className="burger-layer bb-lettuce" />
        <div className="burger-layer bb-tomato" />
        <div className="burger-layer bb-cheese" />
        <div className="burger-layer bb-patty" />
        <div className="burger-layer bb-bun" />
      </div>
      <p style={{
        fontFamily: 'Poppins, sans-serif',
        fontWeight: 700,
        fontSize: '1rem',
        color: 'var(--text-primary)',
        marginTop: 10,
        letterSpacing: '0.5px'
      }}>
        {message}
      </p>
      <div className="loading-dots">
        {[0, 1, 2].map(i => (
          <div key={i} className="loading-dot" style={{ background: 'var(--text-primary)' }} />
        ))}
      </div>
    </div>
  );
};
