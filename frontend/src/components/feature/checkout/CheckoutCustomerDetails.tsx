import React from 'react';
import { InlineError } from '../../ui/InlineError';

interface CheckoutCustomerDetailsProps {
  isMobile: boolean;
  guestName: string;
  setGuestName: (val: string) => void;
  guestPhone: string;
  setGuestPhone: (val: string) => void;
  formErrors: { name: string; phone: string };
}

export const CheckoutCustomerDetails: React.FC<CheckoutCustomerDetailsProps> = ({
  isMobile,
  guestName,
  setGuestName,
  guestPhone,
  setGuestPhone,
  formErrors
}) => {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: '20px', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
      <h3 style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 14 }}>
        👤 Customer Details
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 12 : 16 }}>
        <div>
          <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>NAME</label>
          <input
            className="input-field"
            placeholder="e.g. John Doe"
            value={guestName}
            onChange={e => setGuestName(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
          <InlineError message={formErrors.name} />
        </div>
        <div>
          <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>PHONE NUMBER</label>
          <input
            className="input-field"
            placeholder="e.g. 0123456789"
            value={guestPhone}
            onChange={e => setGuestPhone(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
          {guestPhone && /^(?:\+?601|01)[0-46-9]\d{7,8}$/.test(guestPhone.trim()) ? (
            <div style={{ marginTop: 4, fontSize: '0.68rem', fontWeight: 700, color: 'var(--success)' }}>
              ✓ Valid Malaysian Phone
            </div>
          ) : (
            <InlineError message={formErrors.phone} />
          )}
        </div>
      </div>
    </div>
  );
};
