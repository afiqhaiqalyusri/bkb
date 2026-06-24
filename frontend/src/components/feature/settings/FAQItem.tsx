import React from 'react';

export const FAQItem: React.FC<{ q: string; a: string }> = ({ q, a }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <div
      style={{
        borderRadius: 12, border: '1.5px solid var(--border)',
        overflow: 'hidden', transition: 'border-color 0.2s',
        borderColor: open ? 'var(--primary)' : 'var(--border)',
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', background: open ? 'rgba(255,107,0,0.04)' : 'transparent',
          border: 'none', cursor: 'pointer', textAlign: 'left', gap: 12,
          transition: 'background 0.2s',
        }}
      >
        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', flex: 1 }}>{q}</span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 22, height: 22, borderRadius: '50%',
          background: open ? 'var(--primary)' : 'var(--cream-dark)',
          color: open ? '#fff' : 'var(--text-secondary)',
          flexShrink: 0, transition: 'all 0.2s ease',
          transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
        </span>
      </button>
      {open && (
        <div style={{ padding: '0 16px 14px', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {a}
        </div>
      )}
    </div>
  );
};
