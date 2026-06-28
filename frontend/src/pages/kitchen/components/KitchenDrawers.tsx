import React, { useState } from 'react';
import { History, X, Clock, Lock } from 'lucide-react';
import { Order } from '../../../types';
import { formatTimestamp, statusColour, getItemEmoji, renderItemCustomisations, formatPickupCountdown, MANAGER_PIN, STAFF_PIN } from '../utils/kitchen.utils';
import { formatRM } from '../../../utils/formatCurrency';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';

export const PasswordModal: React.FC<{
  action: string;
  onConfirm: () => void;
  onClose: () => void;
  isManager?: boolean;
}> = ({ action, onConfirm, onClose, isManager }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const expectedPin = isManager ? MANAGER_PIN : STAFF_PIN;
    if (pin === expectedPin) {
      onConfirm();
      onClose();
    } else {
      setError(`Incorrect ${isManager ? 'Manager' : 'Staff'} PIN. Try again.`);
      setPin('');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2000, backdropFilter: 'blur(6px)'
    }} onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)', borderRadius: 20, padding: 28,
          width: 320, boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          display: 'flex', flexDirection: 'column', gap: 16,
          animation: shake ? 'shake 0.5s ease' : undefined
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: 'rgba(255,107,0,0.08)', borderRadius: 12, padding: '8px 10px' }}>
            <Lock size={18} color="var(--red)" />
          </div>
          <div>
            <div style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{isManager ? 'Manager PIN Required' : 'Staff PIN Required'}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{action}</div>
          </div>
        </div>

        <input
          type="password"
          inputMode="numeric"
          maxLength={6}
          autoFocus
          placeholder="Enter PIN"
          value={pin}
          onChange={e => { setPin(e.target.value); setError(''); }}
          style={{
            width: '100%', padding: '12px 16px', borderRadius: 12,
            border: `1.5px solid ${error ? '#EF4444' : 'var(--border)'}`,
            fontSize: '1.2rem', textAlign: 'center', letterSpacing: '0.3em',
            fontFamily: 'Poppins', outline: 'none', boxSizing: 'border-box',
            background: 'var(--background)', color: 'var(--text-primary)'
          }}
        />
        {error && <div style={{ fontSize: '0.75rem', color: '#EF4444', textAlign: 'center', marginTop: -8 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={onClose} style={{
            flex: 1, padding: '11px', background: 'var(--cream-dark)', border: 'none',
            borderRadius: 12, fontWeight: 700, cursor: 'pointer', color: 'var(--text-primary)'
          }}>Cancel</button>
          <button type="submit" style={{
            flex: 1, padding: '11px', background: 'var(--red)', border: 'none',
            borderRadius: 12, fontWeight: 700, cursor: 'pointer', color: '#fff'
          }}>Confirm</button>
        </div>
      </form>
      <style>{`@keyframes shake {
        0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)}
      }`}</style>
    </div>
  );
};

export const EditOrderModal: React.FC<{
  order: Order;
  onClose: () => void;
  onSave: (name: string, phone: string, notes: string, time: string) => Promise<void>;
  saving: boolean;
}> = ({ order, onClose, onSave, saving }) => {
  const [name, setName] = useState(order.customerName || '');
  const [phone, setPhone] = useState(order.guestPhone || '');
  const [notes, setNotes] = useState(order.notes || '');
  const [time, setTime] = useState(order.pickupTime ? order.pickupTime.slice(11, 16) : '');

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1500,
      backdropFilter: 'blur(4px)'
    }}>
      <form onSubmit={async e => { e.preventDefault(); await onSave(name, phone, notes, time); }} style={{
        background: 'var(--surface)', borderRadius: 20, padding: 24,
        width: '100%', maxWidth: 400, boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
        display: 'flex', flexDirection: 'column', gap: 16
      }}>
        <h3 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)', margin: 0 }}>
          Edit Order — {order.orderNumber}
        </h3>
        {[
          { label: 'Customer Name', value: name, set: setName, required: true },
          { label: 'Phone Number', value: phone, set: setPhone },
          { label: 'Pickup Time (e.g. 17:30)', value: time, set: setTime },
        ].map(f => (
          <div key={f.label}>
            <label style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>{f.label}</label>
            <input
              className="input-field"
              value={f.value}
              onChange={e => f.set(e.target.value)}
              required={f.required}
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        ))}
        <div>
          <label style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Order Notes</label>
          <textarea
            className="input-field"
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            style={{ resize: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button type="button" onClick={onClose} disabled={saving} style={{
            flex: 1, padding: '12px', background: 'var(--cream-dark)', border: 'none',
            borderRadius: 12, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', color: 'var(--text-primary)',
            opacity: saving ? 0.6 : 1
          }}>Cancel</button>
          <button type="submit" disabled={saving} style={{
            flex: 1, padding: '12px', background: 'var(--red)', border: 'none',
            borderRadius: 12, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            opacity: saving ? 0.7 : 1
          }}>
            {saving ? (
              <>
                <LoadingSpinner size="sm" />
                <span>[ Saving... ]</span>
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export const HistoryDrawer: React.FC<{ orders: Order[]; onClose: () => void }> = ({ orders, onClose }) => {
  const history = [...orders]
    .filter(o => o.status === 'COMPLETED' || o.status === 'CANCELLED')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1800, display: 'flex'
    }}>
      <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)' }} onClick={onClose} />
      <div style={{
        width: 420, background: 'var(--background)', height: '100%', overflowY: 'auto',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <History size={18} color="var(--red)" />
            <span style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              Order History
            </span>
            <span style={{
              background: 'var(--red)', color: '#fff', borderRadius: 99,
              minWidth: 20, height: 20, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, padding: '0 5px'
            }}>{history.length}</span>
          </div>
          <button onClick={onClose} style={{
            background: 'var(--cream-dark)', border: 'none', borderRadius: 8,
            width: 30, height: 30, display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', color: 'var(--text-primary)'
          }}><X size={16} /></button>
        </div>

        <div style={{ padding: '16px 16px 32px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {history.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              No completed orders yet
            </div>
          )}
          {history.map(order => {
            const sc = statusColour(order.status);
            return (
              <div key={order.id} style={{
                background: 'var(--surface)', borderRadius: 14, padding: '12px 14px',
                border: '1.5px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                      {order.customerName}{order.guestPhone ? ` (${order.guestPhone})` : ''}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 1 }}>{order.orderNumber} · {formatTimestamp(order.createdAt)}</div>
                  </div>
                  <span style={{
                    fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase',
                    padding: '3px 8px', borderRadius: 99, background: sc.bg, color: sc.text
                  }}>{order.status}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {order.items.map(item => (
                    <div key={item.id}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)' }}>
                        {getItemEmoji(item.menuItemName)} {item.quantity}× {item.menuItemName}
                      </div>
                      {renderItemCustomisations(item.customisations)}
                    </div>
                  ))}
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--red)' }}>
                  {formatRM(order.total)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const OnHoldDrawer: React.FC<{ orders: Order[]; onClose: () => void }> = ({ orders, onClose }) => {
  const onHold = [...orders]
    .filter(o => o.status === 'ON_HOLD')
    .sort((a, b) => {
      const timeA = a.pickupTime ? new Date(a.pickupTime).getTime() : new Date(a.createdAt).getTime();
      const timeB = b.pickupTime ? new Date(b.pickupTime).getTime() : new Date(b.createdAt).getTime();
      return timeA - timeB;
    });

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1800, display: 'flex'
    }}>
      <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)' }} onClick={onClose} />
      <div style={{
        width: 420, background: 'var(--background)', height: '100%', overflowY: 'auto',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Clock size={18} color="#7C3AED" />
            <span style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              Scheduled Orders
            </span>
            <span style={{
              background: '#7C3AED', color: '#fff', borderRadius: 99,
              minWidth: 20, height: 20, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, padding: '0 5px'
            }}>{onHold.length}</span>
          </div>
          <button onClick={onClose} style={{
            background: 'var(--cream-dark)', border: 'none', borderRadius: 8,
            width: 30, height: 30, display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', color: 'var(--text-primary)'
          }}><X size={16} /></button>
        </div>

        <div style={{ padding: '16px 16px 32px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {onHold.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              No scheduled orders on hold
            </div>
          )}
          {onHold.map(order => {
            const sc = statusColour(order.status);
            const countdown = order.pickupTime ? formatPickupCountdown(order.pickupTime) : 'N/A';
            return (
              <div key={order.id} style={{
                background: 'var(--surface)', borderRadius: 14, padding: '12px 14px',
                border: '1.5px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                      {order.customerName}{order.guestPhone ? ` (${order.guestPhone})` : ''}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 1 }}>{order.orderNumber} · {formatTimestamp(order.createdAt)}</div>
                  </div>
                  <span style={{
                    fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase',
                    padding: '3px 8px', borderRadius: 99, background: sc.bg, color: sc.text
                  }}>{order.status}</span>
                </div>
                
                {order.pickupTime && (
                  <div style={{
                    background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)',
                    borderRadius: 8, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2
                  }}>
                    <Clock size={12} color="#7C3AED" />
                    <span style={{ fontSize: '0.72rem', color: '#7C3AED', fontWeight: 700 }}>
                      Pickup in: {countdown}
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4 }}>
                  {order.items.map(item => (
                    <div key={item.id}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)' }}>
                        {getItemEmoji(item.menuItemName)} {item.quantity}× {item.menuItemName}
                      </div>
                      {renderItemCustomisations(item.customisations)}
                    </div>
                  ))}
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--red)' }}>
                  {formatRM(order.total)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
