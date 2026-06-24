import React from 'react';
import { formatRM } from '../../../utils/formatCurrency';

const IcoAlert = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const IcoArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

const IcoTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    <line x1="10" y1="11" x2="10" y2="17"/>
    <line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
);

const CustomCheckbox: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
  <div
    onClick={onChange}
    style={{
      width: 20,
      height: 20,
      borderRadius: 6,
      border: checked ? '2px solid var(--primary)' : '2px solid var(--border)',
      background: checked ? 'var(--primary)' : 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      flexShrink: 0,
      boxShadow: checked ? '0 0 0 3px rgba(255,107,0,0.15)' : 'none',
    }}
    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
  >
    {checked && (
      <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
        <path d="M1.5 5L4.5 8L10.5 2" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )}
  </div>
);

interface CartSummaryCardProps {
  isMobile: boolean;
  subtotal: number;
  tax: number;
  total: number;
  storeClosed: boolean;
  selectedItemsCount: number;
  handleProceed: () => void;
  isAllSelected: boolean;
  toggleSelectAll: () => void;
  selectedKeysCount: number;
  handleDeleteSelected: () => void;
}

export const CartSummaryCard: React.FC<CartSummaryCardProps> = ({
  isMobile,
  subtotal,
  tax,
  total,
  storeClosed,
  selectedItemsCount,
  handleProceed,
  isAllSelected,
  toggleSelectAll,
  selectedKeysCount,
  handleDeleteSelected
}) => {
  return (
    <>
      <div style={{
        width: isMobile ? '100%' : 360,
        position: isMobile ? 'static' : 'sticky',
        top: 24,
        background: 'var(--surface)',
        border: '1.5px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: 24,
        boxShadow: 'var(--shadow-sm)',
        boxSizing: 'border-box'
      }}>
        <h2 style={{
          fontFamily: 'Outfit',
          fontWeight: 800,
          fontSize: '1.25rem',
          margin: '0 0 18px 0',
          color: 'var(--text-primary)'
        }}>
          Order Summary
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            <span>Subtotal</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatRM(subtotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            <span>SST (6%)</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatRM(tax)}</span>
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '4px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 800 }}>
            <span style={{ color: 'var(--text-primary)' }}>Estimated Total</span>
            <span style={{ color: 'var(--red)', fontSize: '1.25rem' }}>{formatRM(total)}</span>
          </div>
        </div>

        {storeClosed && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.05)',
            border: '1px solid rgba(239, 68, 68, 0.15)',
            color: 'var(--danger)',
            padding: '12px 14px',
            borderRadius: 10,
            fontSize: '0.76rem',
            marginBottom: 18,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontWeight: 500,
            lineHeight: 1.4
          }}>
            <span style={{ flexShrink: 0 }}><IcoAlert /></span>
            <span>The store is currently closed. Checkout has been disabled.</span>
          </div>
        )}

        {!isMobile && (
          <button
            onClick={handleProceed}
            disabled={selectedItemsCount === 0 || storeClosed}
            style={{
              width: '100%',
              background: storeClosed || selectedItemsCount === 0
                ? 'var(--border)'
                : 'var(--primary)',
              color: storeClosed || selectedItemsCount === 0 ? 'var(--text-secondary)' : '#fff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '14px 20px',
              fontFamily: 'Inter',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: storeClosed || selectedItemsCount === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
            onMouseEnter={e => {
              if (!storeClosed && selectedItemsCount > 0) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 8px 22px rgba(255, 107, 0, 0.25)';
              }
            }}
            onMouseLeave={e => {
              if (!storeClosed && selectedItemsCount > 0) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-red)';
              }
            }}
          >
            Checkout Selected ({selectedItemsCount}) <IcoArrowRight />
          </button>
        )}
      </div>

      {/* Shopee-like Sticky Bottom Bar on Mobile */}
      {isMobile && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          padding: '12px 16px',
          zIndex: 99,
          boxShadow: 'var(--shadow-lg)',
          boxSizing: 'border-box'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CustomCheckbox checked={isAllSelected} onChange={toggleSelectAll} />
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                All
              </span>
              {selectedKeysCount > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--danger)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <IcoTrash />
                </button>
              )}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Total
                </div>
                <div style={{ fontFamily: 'Outfit', fontWeight: 800, color: 'var(--primary)', fontSize: '1.15rem', lineHeight: 1.1 }}>
                  {formatRM(total)}
                </div>
              </div>
              
              <button
                onClick={handleProceed}
                disabled={selectedItemsCount === 0 || storeClosed}
                style={{
                  background: storeClosed || selectedItemsCount === 0 ? 'var(--border)' : 'var(--primary)',
                  color: storeClosed || selectedItemsCount === 0 ? 'var(--text-secondary)' : '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 18px',
                  fontFamily: 'Inter',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: storeClosed || selectedItemsCount === 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                Check Out ({selectedItemsCount})
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
