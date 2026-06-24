import React from 'react';

export const CHANNELS = [
  {
    id: 'TOYYIBPAY' as const,
    name: 'ToyyibPay',
    desc: 'Pay with Online Banking or E-wallet',
    color: '#005fa9',
    bg: 'rgba(0,95,169,0.06)',
    logo: (
      <div style={{ fontWeight: 800, color: '#005fa9', fontSize: '0.8rem', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e0f2fe', borderRadius: 8 }}>
        TP
      </div>
    )
  },
  {
    id: 'CASH' as const,
    name: 'Cash at Counter',
    desc: 'Pay cash when collecting order',
    color: 'var(--text-primary)',
    bg: 'var(--cream-dark)',
    logo: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="8" fill="#4b5563" />
        <path d="M8 12H24M8 16H24M8 20H20" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="23" cy="20" r="2" fill="#22c55e" />
      </svg>
    )
  }
];

interface CheckoutPaymentMethodsProps {
  enabledChannels: typeof CHANNELS;
  paymentChannel: 'TOYYIBPAY' | 'CASH';
  setPaymentChannel: (val: 'TOYYIBPAY' | 'CASH') => void;
  isMobile: boolean;
}

export const CheckoutPaymentMethods: React.FC<CheckoutPaymentMethodsProps> = ({
  enabledChannels,
  paymentChannel,
  setPaymentChannel,
  isMobile
}) => {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1.5px solid var(--border)', padding: 20, boxShadow: 'var(--shadow-sm)' }}>
      <h3 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: 14 }}>
        💳 Payment Method
      </h3>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(auto-fill, minmax(130px, 1fr))' : 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: isMobile ? 10 : 16
      }}>
        {enabledChannels.map(chan => {
          const active = paymentChannel === chan.id;
          return (
            <button
              key={chan.id}
              type="button"
              onClick={() => setPaymentChannel(chan.id)}
              style={{
                padding: isMobile ? '10px 12px' : '16px',
                borderRadius: 12,
                border: '2px solid',
                borderColor: active ? chan.color : 'var(--border)',
                background: active ? chan.bg : 'transparent',
                boxShadow: active ? `0 4px 16px ${chan.color}18` : 'none',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? 8 : 12,
                position: 'relative',
                transition: 'all 0.22s ease',
                transform: active ? 'scale(1.02)' : 'none',
                boxSizing: 'border-box',
                width: '100%',
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.borderColor = chan.color;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              {/* Selected corner checkmark badge */}
              {active && (
                <div style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  background: chan.color,
                  color: 'white',
                  borderRadius: '50%',
                  width: 18,
                  height: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.62rem',
                  fontWeight: 900,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                  border: '2px solid var(--surface)'
                }}>
                  ✓
                </div>
              )}
              
              {/* Logo Container */}
              <div style={{ flexShrink: 0 }}>
                {chan.logo}
              </div>
              
              {/* Text details */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: 'Poppins',
                  fontWeight: 800,
                  fontSize: isMobile ? '0.78rem' : '0.86rem',
                  color: 'var(--text-primary)',
                  marginBottom: 2
                }}>
                  {chan.name}
                </div>
                {!isMobile && (
                  <div style={{
                    fontSize: '0.68rem',
                    color: 'var(--text-secondary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {chan.desc}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
