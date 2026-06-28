import React from 'react';

export const SectionHeader: React.FC<{
  label: string;
  count: number;
  color: string;
  bg: string;
  subtitle: string;
}> = ({ label, count, color, bg, subtitle }) => (
  <div style={{
    background: bg, borderRadius: 14, padding: '12px 16px',
    borderLeft: `4px solid ${color}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
  }}>
    <div>
      <div style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '0.92rem', color }}>
        {label}
      </div>
      <div style={{ fontSize: '0.7rem', color: '#9B7B6B', marginTop: 2 }}>{subtitle}</div>
    </div>
    <span style={{
      background: color, color: '#fff', borderRadius: 99, minWidth: 26,
      height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '0.78rem', fontWeight: 800, padding: '0 8px'
    }}>{count}</span>
  </div>
);
