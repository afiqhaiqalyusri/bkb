import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle } from 'lucide-react';
import { Order } from '../../../types';
import { statusColour, getItemEmoji, renderItemCustomisations, formatPickupCountdown, getCustomisationSummary } from '../utils/kitchen.utils';
import { formatRM } from '../../../utils/formatCurrency';

export interface FrontCardProps {
  order: Order;
  mode: 'onhold' | 'incoming' | 'active' | 'ready';
  onAccept: () => void;
  onAdvance: () => void;
  onConfirmCash: () => void;
  onEdit: () => void;
  onCancel: () => void;
  updating: boolean;
  activeMenuId: number | null;
  setActiveMenuId: (id: number | null) => void;
}

export const FrontOrderCard = React.memo<FrontCardProps>(({
  order, mode, onAccept, onAdvance, onConfirmCash, onEdit, onCancel,
  updating, activeMenuId, setActiveMenuId
}) => {
  const [timeElapsed, setTimeElapsed] = useState('0:00');
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 1000));
      setTimeElapsed(`${Math.floor(diff / 60)}:${(diff % 60).toString().padStart(2, '0')}`);
      if (order.pickupTime) setCountdown(formatPickupCountdown(order.pickupTime));
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [order.createdAt, order.pickupTime]);

  const isCash = order.paymentMethod === 'CASH';
  const isPaid = order.paymentStatus === 'PAID';
  const sc = statusColour(order.status);

  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 18, padding: 16,
      border: mode === 'incoming' ? '1.5px solid var(--warning)' : '1.5px solid var(--border)',
      boxShadow: mode === 'incoming' ? '0 4px 20px rgba(217,119,6,0.07)' : 'var(--shadow-sm)',
      display: 'flex', flexDirection: 'column', gap: 10
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '0.94rem', color: 'var(--text-primary)' }}>
            {order.customerName}{order.guestPhone ? ` (${order.guestPhone})` : ''}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 1 }}>{order.orderNumber}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'rgba(255,107,0,0.05)', color: 'var(--red)',
            padding: '3px 8px', borderRadius: 8, fontSize: '0.7rem', fontWeight: 700
          }}>
            <Clock size={11} />
            <span>{timeElapsed}</span>
          </div>
          {mode !== 'onhold' && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={e => { e.stopPropagation(); setActiveMenuId(activeMenuId === order.id ? null : order.id); }}
                style={{
                  background: 'var(--cream-dark)', border: 'none', borderRadius: 8,
                  width: 26, height: 26, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', cursor: 'pointer', fontSize: '1rem', color: 'var(--text-primary)'
                }}
              >⋮</button>
              {activeMenuId === order.id && (
                <div style={{
                  position: 'absolute', right: 0, top: 30,
                  background: 'var(--surface)', border: '1.5px solid var(--border)',
                  borderRadius: 12, boxShadow: '0 8px 24px rgba(74,44,42,0.1)',
                  zIndex: 300, display: 'flex', flexDirection: 'column',
                  width: 140, overflow: 'hidden'
                }} onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => { onEdit(); setActiveMenuId(null); }}
                    style={{
                      padding: '10px 14px', background: 'none', border: 'none',
                      textAlign: 'left', fontSize: '0.78rem', cursor: 'pointer',
                      color: 'var(--text-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--cream-dark)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >Edit Order</button>
                  <button
                    onClick={() => { onCancel(); setActiveMenuId(null); }}
                    style={{
                      padding: '10px 14px', background: 'none', border: 'none',
                      textAlign: 'left', fontSize: '0.78rem', cursor: 'pointer',
                      color: 'var(--red)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,107,0,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >Cancel Order</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {mode === 'onhold' && order.pickupTime && (
        <div style={{
          background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.15)',
          borderRadius: 10, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6
        }}>
          <Clock size={12} color="#7C3AED" />
          <span style={{ fontSize: '0.72rem', color: '#7C3AED', fontWeight: 700 }}>
            Pickup in: {countdown}
          </span>
        </div>
      )}

      <span style={{
        fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase',
        padding: '3px 8px', borderRadius: 99, background: sc.bg, color: sc.text, alignSelf: 'flex-start'
      }}>{order.status}</span>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {order.items.map(item => (
          <div key={item.id}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1A1008' }}>
              {getItemEmoji(item.menuItemName)} {item.quantity}× {item.menuItemName}
              <span style={{ color: '#9B7B6B', fontWeight: 500, marginLeft: 6 }}>
                {formatRM(item.unitPrice * item.quantity)}
              </span>
            </div>
            {renderItemCustomisations(item.customisations)}
          </div>
        ))}
      </div>

      <div style={{
        background: 'var(--cream-dark)', borderRadius: 10, padding: '8px 12px',
        border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {isCash ? 'Cash' : 'Online'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--red)', fontWeight: 800 }}>{formatRM(order.total)}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 800, color: isPaid ? '#16A34A' : '#D97706' }}>
            {isPaid ? 'PAID' : 'UNPAID'}
          </span>
          {isCash ? (
            <div
              onClick={e => { e.stopPropagation(); onConfirmCash(); }}
              title={isPaid ? "Tap to mark unpaid" : "Tap to confirm cash received"}
              style={{
                width: 36, height: 18, borderRadius: 99, background: isPaid ? '#16A34A' : 'var(--border)',
                position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center',
                transition: 'background 0.2s'
              }}
            >
              <div style={{
                width: 12, height: 12, borderRadius: '50%', background: '#fff',
                position: 'absolute', left: isPaid ? 21 : 3, boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                transition: 'left 0.2s'
              }} />
            </div>
          ) : (
            <div style={{
              width: 36, height: 18, borderRadius: 99, background: '#16A34A',
              position: 'relative', display: 'flex', alignItems: 'center'
            }}>
              <div style={{
                width: 12, height: 12, borderRadius: '50%', background: '#fff',
                position: 'absolute', left: 21, boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
              }} />
            </div>
          )}
        </div>
      </div>

      {order.notes && (
        <div style={{ fontSize: '0.72rem', color: '#7C3AED', background: 'rgba(124,58,237,0.05)', borderRadius: 8, padding: '5px 8px', fontStyle: 'italic' }}>
          {order.notes}
        </div>
      )}

      {mode === 'incoming' && (
        <button
          onClick={e => { e.stopPropagation(); onAccept(); }}
          disabled={updating}
          style={{
            width: '100%', background: 'var(--red)', color: '#fff', border: 'none',
            borderRadius: 10, padding: '11px', fontFamily: 'Poppins', fontWeight: 700,
            fontSize: '0.82rem', cursor: updating ? 'not-allowed' : 'pointer',
            opacity: updating ? 0.7 : 1, boxShadow: 'var(--shadow-red)'
          }}
        >
          {updating ? 'Accepting...' : 'Accept Order'}
        </button>
      )}
      {mode === 'active' && (
        <button
          onClick={e => { e.stopPropagation(); onAdvance(); }}
          disabled={updating}
          style={{
            width: '100%', background: 'var(--text-primary)', color: 'var(--background)', border: 'none',
            borderRadius: 10, padding: '11px', fontFamily: 'Poppins', fontWeight: 700,
            fontSize: '0.82rem', cursor: updating ? 'not-allowed' : 'pointer', opacity: updating ? 0.7 : 1
          }}
        >
          {updating ? 'Updating...' : 'Mark Ready'}
        </button>
      )}
      {mode === 'ready' && (
        <button
          onClick={e => { e.stopPropagation(); onAdvance(); }}
          disabled={updating || !isPaid}
          style={{
            width: '100%',
            background: isPaid ? '#16A34A' : '#9B7B6B',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '11px',
            fontFamily: 'Poppins',
            fontWeight: 700,
            fontSize: '0.82rem',
            cursor: (updating || !isPaid) ? 'not-allowed' : 'pointer',
            opacity: (updating || !isPaid) ? 0.6 : 1,
            boxShadow: isPaid ? '0 4px 12px rgba(22,163,74,0.2)' : 'none'
          }}
        >
          {updating ? 'Completing...' : isPaid ? 'Complete Order' : 'Unpaid (Cannot Complete)'}
        </button>
      )}
    </div>
  );
});

export const GrillActiveCard = React.memo<{
  order: Order;
  onDone: () => void;
  updating: boolean;
}>(({ order, onDone, updating }) => {
  const [timeElapsed, setTimeElapsed] = useState('0:00');

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 1000));
      setTimeElapsed(`${Math.floor(diff / 60)}:${(diff % 60).toString().padStart(2, '0')}`);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [order.createdAt]);

  const grillDone = ['GRILLING', 'ASSEMBLING', 'READY'].includes(order.status);

  const allRemarks: string[] = [];
  order.items.forEach(item => {
    const { remarks } = getCustomisationSummary(item.customisations);
    if (remarks) allRemarks.push(`${item.menuItemName}: ${remarks}`);
  });

  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 18, padding: 16,
      border: grillDone ? '1.5px solid var(--success)' : '1.5px solid var(--border)',
      boxShadow: 'var(--shadow-sm)',
      display: 'flex', flexDirection: 'column', gap: 10
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '0.94rem', color: 'var(--text-primary)' }}>
            {order.customerName}{order.guestPhone ? ` (${order.guestPhone})` : ''}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 1 }}>{order.orderNumber}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'rgba(255,107,0,0.05)', color: 'var(--red)',
            padding: '3px 8px', borderRadius: 8, fontSize: '0.7rem', fontWeight: 700
          }}>
            <Clock size={11} />
            <span>{timeElapsed}</span>
          </div>
        </div>
      </div>

      <span style={{
        fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase',
        padding: '3px 8px', borderRadius: 99,
        background: grillDone ? 'rgba(22,163,74,0.08)' : 'rgba(234,88,12,0.1)',
        color: grillDone ? '#16A34A' : '#EA580C',
        alignSelf: 'flex-start'
      }}>
        {grillDone ? 'Grill Done' : 'Grilling'}
      </span>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {order.items.map(item => (
          <div key={item.id}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {getItemEmoji(item.menuItemName)} {item.quantity}× {item.menuItemName}
            </div>
            {renderItemCustomisations(item.customisations)}
          </div>
        ))}
      </div>

      {allRemarks.length > 0 && (
        <div style={{ background: 'rgba(124,58,237,0.05)', borderRadius: 8, padding: '5px 10px', fontSize: '0.72rem', color: '#7C3AED', fontStyle: 'italic' }}>
          {allRemarks.join(' · ')}
        </div>
      )}

      {!grillDone && (
        <button
          onClick={onDone}
          disabled={updating}
          style={{
            width: '100%', background: '#EA580C', color: '#fff', border: 'none',
            borderRadius: 10, padding: '11px', fontFamily: 'Poppins', fontWeight: 700,
            fontSize: '0.82rem', cursor: updating ? 'not-allowed' : 'pointer',
            opacity: updating ? 0.7 : 1, boxShadow: '0 4px 12px rgba(234,88,12,0.2)'
          }}
        >
          {updating ? 'Updating...' : 'Patties Done'}
        </button>
      )}
    </div>
  );
});

export const PrepCard = React.memo<{
  order: Order;
  onMarkReady: () => void;
  updating: boolean;
}>(({ order, onMarkReady, updating }) => {
  const [timeElapsed, setTimeElapsed] = useState('0:00');

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 1000));
      setTimeElapsed(`${Math.floor(diff / 60)}:${(diff % 60).toString().padStart(2, '0')}`);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [order.createdAt]);

  const grillDone = ['GRILLING', 'ASSEMBLING'].includes(order.status);
  const sc = statusColour(order.status);

  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 18, padding: 16,
      border: '1.5px solid var(--border)',
      boxShadow: 'var(--shadow-sm)',
      display: 'flex', flexDirection: 'column', gap: 10
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '0.94rem', color: 'var(--text-primary)' }}>
            {order.customerName}{order.guestPhone ? ` (${order.guestPhone})` : ''}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 1 }}>{order.orderNumber}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'rgba(255,107,0,0.05)', color: 'var(--red)',
            padding: '3px 8px', borderRadius: 8, fontSize: '0.7rem', fontWeight: 700
          }}>
            <Clock size={11} />
            <span>{timeElapsed}</span>
          </div>
        </div>
      </div>

      <span style={{
        fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase',
        padding: '3px 8px', borderRadius: 99, background: sc.bg, color: sc.text, alignSelf: 'flex-start'
      }}>{order.status}</span>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: grillDone ? 'rgba(22,163,74,0.06)' : 'rgba(234,88,12,0.06)',
        border: `1px solid ${grillDone ? 'rgba(22,163,74,0.2)' : 'rgba(234,88,12,0.2)'}`,
        borderRadius: 8, padding: '5px 10px'
      }}>
        {grillDone
          ? <><CheckCircle size={13} color="#16A34A" /><span style={{ fontSize: '0.72rem', color: '#16A34A', fontWeight: 700 }}>Grill Done</span></>
          : <><span style={{ fontSize: '0.72rem', color: '#EA580C', fontWeight: 700 }}>Waiting for grill...</span></>
        }
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {order.items.map(item => (
          <div key={item.id}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {getItemEmoji(item.menuItemName)} {item.quantity}× {item.menuItemName}
            </div>
            {renderItemCustomisations(item.customisations)}
          </div>
        ))}
      </div>

      <button
        onClick={onMarkReady}
        disabled={updating}
        style={{
          width: '100%', background: 'var(--text-primary)', color: 'var(--background)', border: 'none',
          borderRadius: 10, padding: '11px', fontFamily: 'Poppins', fontWeight: 700,
          fontSize: '0.82rem', cursor: updating ? 'not-allowed' : 'pointer', opacity: updating ? 0.7 : 1
        }}
      >
        {updating ? 'Updating...' : 'Mark Ready'}
      </button>
    </div>
  );
});
