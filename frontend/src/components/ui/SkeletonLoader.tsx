import React from 'react';

// 1. KPI Cards Skeleton
export const KPISkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          style={{ 
            background: 'var(--surface)', 
            border: '1px solid var(--border)', 
            borderRadius: 14, 
            padding: '20px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: 16, 
            boxShadow: 'var(--shadow-sm)' 
          }}
        >
          <div className="shimmer-wave" style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="shimmer-wave" style={{ height: 10, width: '60%', borderRadius: 4 }} />
            <div className="shimmer-wave" style={{ height: 20, width: '80%', borderRadius: 6 }} />
          </div>
        </div>
      ))}
    </div>
  );
};

// 2. Chart Card Skeleton
export const ChartSkeleton: React.FC = () => {
  return (
    <div 
      style={{ 
        background: 'var(--surface)', 
        border: '1px solid var(--border)', 
        borderRadius: 16, 
        padding: 24, 
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="shimmer-wave" style={{ height: 14, width: '30%', borderRadius: 4 }} />
          <div className="shimmer-wave" style={{ height: 8, width: '50%', borderRadius: 4 }} />
        </div>
        <div className="shimmer-wave" style={{ width: 16, height: 16, borderRadius: '50%' }} />
      </div>
      
      {/* Simulated chart bars */}
      <div 
        style={{ 
          height: 220, 
          display: 'flex', 
          alignItems: 'flex-end', 
          justifyContent: 'space-between', 
          padding: '10px 0',
          gap: 12
        }}
      >
        {Array.from({ length: 14 }).map((_, i) => {
          // Vary height for a realistic look
          const heights = ['20%', '40%', '35%', '65%', '50%', '80%', '70%', '55%', '90%', '45%', '75%', '60%', '85%', '95%'];
          return (
            <div 
              key={i} 
              className="shimmer-wave" 
              style={{ 
                width: '100%', 
                height: heights[i], 
                borderRadius: '4px 4px 0 0',
                opacity: 0.85
              }} 
            />
          );
        })}
      </div>
    </div>
  );
};

// 3. Table Rows Skeleton
export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div 
      style={{ 
        background: 'var(--surface)', 
        border: '1px solid var(--border)', 
        borderRadius: 16, 
        padding: 20, 
        boxShadow: 'var(--shadow-sm)',
        width: '100%',
        overflowX: 'auto'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Table header skeleton */}
        <div style={{ display: 'flex', gap: 20, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
          <div className="shimmer-wave" style={{ height: 12, flex: 1, borderRadius: 4 }} />
          <div className="shimmer-wave" style={{ height: 12, flex: 2, borderRadius: 4 }} />
          <div className="shimmer-wave" style={{ height: 12, flex: 1, borderRadius: 4 }} />
          <div className="shimmer-wave" style={{ height: 12, flex: 1, borderRadius: 4 }} />
        </div>
        {/* Table rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 20, padding: '10px 0', borderBottom: i === rows - 1 ? 'none' : '1px solid rgba(255,255,255,0.03)' }}>
            <div className="shimmer-wave" style={{ height: 10, flex: 1, borderRadius: 3 }} />
            <div className="shimmer-wave" style={{ height: 10, flex: 2, borderRadius: 3 }} />
            <div className="shimmer-wave" style={{ height: 10, flex: 1, borderRadius: 3 }} />
            <div className="shimmer-wave" style={{ height: 10, flex: 1, borderRadius: 3 }} />
          </div>
        ))}
      </div>
    </div>
  );
};

// 4. Order Card List Skeleton
export const OrderHistorySkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          style={{ 
            background: 'var(--surface)', 
            borderRadius: 'var(--radius-lg)', 
            padding: 16,
            border: '1.5px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}
        >
          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              <div className="shimmer-wave" style={{ height: 14, width: '40%', borderRadius: 4 }} />
              <div className="shimmer-wave" style={{ height: 9, width: '25%', borderRadius: 4 }} />
            </div>
            <div className="shimmer-wave" style={{ width: 70, height: 20, borderRadius: 999 }} />
          </div>
          
          <div style={{ height: 1, background: 'var(--border)' }} />

          {/* Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="shimmer-wave" style={{ width: 36, height: 36, borderRadius: 8 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div className="shimmer-wave" style={{ height: 12, width: '60%', borderRadius: 4 }} />
                <div className="shimmer-wave" style={{ height: 9, width: '30%', borderRadius: 4 }} />
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: 'var(--border)' }} />

          {/* Bottom row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="shimmer-wave" style={{ height: 16, width: '20%', borderRadius: 4 }} />
            <div className="shimmer-wave" style={{ height: 32, width: '30%', borderRadius: 8 }} />
          </div>
        </div>
      ))}
    </div>
  );
};

// 5. Payment QR Code Placeholder Skeleton
export const QRSkeleton: React.FC = () => {
  return (
    <div 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        width: '100%', 
        height: '100%',
        position: 'relative'
      }}
    >
      {/* simulated QR dot-matrix block with shimmer */}
      <div 
        className="shimmer-wave" 
        style={{ 
          width: 170, 
          height: 170, 
          borderRadius: 8,
          opacity: 0.8
        }} 
      />
      <div 
        style={{
          position: 'absolute',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '12px 16px',
          borderRadius: 12,
          boxShadow: 'var(--shadow-md)',
          textAlign: 'center'
        }}
      >
        <div 
          className="spinner" 
          style={{ 
            width: 24, 
            height: 24, 
            borderWidth: 2.5,
            borderColor: 'rgba(255,107,0,0.15)',
            borderTopColor: 'var(--red)'
          }} 
        />
        <span 
          style={{ 
            fontSize: '0.74rem', 
            fontWeight: 800, 
            color: 'var(--text-dark)'
          }}
        >
          Generating secure QR code...
        </span>
      </div>
    </div>
  );
};
