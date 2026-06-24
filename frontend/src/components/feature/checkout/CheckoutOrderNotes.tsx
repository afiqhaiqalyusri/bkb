import React from 'react';

interface CheckoutOrderNotesProps {
  notes: string;
  setNotes: (val: string) => void;
  orderType: 'NOW' | 'SCHEDULED';
  setOrderType: (val: 'NOW' | 'SCHEDULED') => void;
  selectedTime: string;
  setSelectedTime: (val: string) => void;
}

export const CheckoutOrderNotes: React.FC<CheckoutOrderNotesProps> = ({
  notes,
  setNotes,
  orderType,
  setOrderType,
  selectedTime,
  setSelectedTime
}) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: 20,
      background: 'var(--surface)',
      borderRadius: 'var(--radius-lg)',
      border: '1.5px solid var(--border)',
      padding: 20,
      boxShadow: 'var(--shadow-sm)'
    }}>
      {/* Message for Seller */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          💬 Message for Seller (Remarks)
        </label>
        <textarea
          placeholder="e.g. Please pack sauces separately, no onions, etc."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          style={{
            width: '100%',
            height: '80px',
            padding: '10px 12px',
            borderRadius: 10,
            border: '1.5px solid var(--border)',
            background: 'var(--cream-dark)',
            color: 'var(--text-dark)',
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.82rem',
            outline: 'none',
            resize: 'none',
            transition: 'all 0.2s',
            boxSizing: 'border-box'
          }}
          onFocus={e => e.currentTarget.style.borderColor = 'var(--red)'}
          onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
        />
      </div>

      {/* Pickup Type and Offset Selection */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          ⏰ Collection / Pickup Type
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => setOrderType('NOW')}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: 10,
              border: '1.5px solid',
              cursor: 'pointer',
              borderColor: orderType === 'NOW' ? 'var(--primary)' : 'var(--border)',
              background: orderType === 'NOW' ? 'rgba(255,107,0,0.06)' : 'transparent',
              color: orderType === 'NOW' ? 'var(--primary)' : 'var(--text-secondary)',
              fontFamily: 'Outfit',
              fontWeight: 700,
              fontSize: '0.8rem',
              transition: 'all 0.2s',
            }}
          >
            ⚡ Order Now (ASAP)
          </button>
          <button
            type="button"
            onClick={() => setOrderType('SCHEDULED')}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: 10,
              border: '1.5px solid',
              cursor: 'pointer',
              borderColor: orderType === 'SCHEDULED' ? 'var(--primary)' : 'var(--border)',
              background: orderType === 'SCHEDULED' ? 'rgba(255,107,0,0.06)' : 'transparent',
              color: orderType === 'SCHEDULED' ? 'var(--primary)' : 'var(--text-secondary)',
              fontFamily: 'Outfit',
              fontWeight: 700,
              fontSize: '0.8rem',
              transition: 'all 0.2s',
            }}
          >
            🕐 Schedule Order
          </button>
        </div>

        {orderType === 'SCHEDULED' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, animation: 'fadeIn 0.2s' }}>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              SELECT PICKUP TIME
            </label>
            <input
              type="time"
              value={selectedTime}
              onChange={e => setSelectedTime(e.target.value)}
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: '1.5px solid var(--border)',
                background: 'var(--cream-dark)',
                color: 'var(--text-dark)',
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.9rem',
                fontWeight: 700,
                outline: 'none',
                width: 'fit-content'
              }}
            />
          </div>
        )}

        <div style={{ fontSize: '0.72rem', color: orderType === 'SCHEDULED' ? '#7C3AED' : 'var(--success)', fontWeight: 700, marginTop: 2 }}>
          {orderType === 'NOW'
            ? '⚡ ASAP — Your order will immediately enter the kitchen queue'
            : `🕐 Scheduled — Your order will enter the queue closer to the pickup time`
          }
        </div>
      </div>
    </div>
  );
};
