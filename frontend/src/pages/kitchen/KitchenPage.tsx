import React, { useState, useEffect, useCallback } from 'react';
import { ChefHat, Clock, History, X, Lock, CheckCircle, User, Flame, Wrench, Settings } from 'lucide-react';
import { Order, MenuItem } from '../../types';
import { orderService } from '../../services/order.service';
import { paymentService } from '../../services/payment.service';
import { menuService } from '../../services/menu.service';
import { ingredientService, IngredientOutage } from '../../services/ingredient.service';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { FullScreenLoader } from '../../components/ui/FullScreenLoader';
import { formatRM } from '../../utils/formatCurrency';
import toast from 'react-hot-toast';
import { useConfirmation } from '../../components/ConfirmationProvider';

/* ─── Responsive CSS injected once ──────────────────────────────────── */
const RESPONSIVE_CSS = `
  .order-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    align-items: start;
  }
  .grill-tile-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 14px;
    margin-bottom: 28px;
  }
  @media (max-width: 1200px) {
    .order-grid { grid-template-columns: repeat(3, 1fr); }
    .grill-tile-grid { grid-template-columns: repeat(4, 1fr); }
  }
  @media (max-width: 860px) {
    .order-grid { grid-template-columns: repeat(2, 1fr); }
    .grill-tile-grid { grid-template-columns: repeat(3, 1fr); }
  }
  @media (max-width: 540px) {
    .order-grid { grid-template-columns: 1fr; }
    .grill-tile-grid { grid-template-columns: repeat(2, 1fr); }
  }
`;

/* ─── Constants ─────────────────────────────────────────────────────── */
const STAFF_PIN = '1234'; // Change this to update the staff PIN
const MANAGER_PIN = '5678'; // Change this to update the manager PIN

const TABS = [
  { key: 'FRONT', label: 'Front Counter', icon: <User size={18} /> },
  { key: 'GRILL', label: 'Grill Station', icon: <Flame size={18} /> },
  { key: 'PREP', label: 'Prep Line', icon: <Wrench size={18} /> },
  { key: 'SETTINGS', label: 'Settings', icon: <Settings size={18} /> },
];

/* ─── Helpers ───────────────────────────────────────────────────────── */
const getItemEmoji = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('milo') || n.includes('air') || n.includes('drink') || n.includes('teh') || n.includes('kopi')) return '';
  if (n.includes('oblong')) return '';
  if (n.includes('chicken')) return '';
  if (n.includes('beef') || n.includes('wagyu')) return '';
  return '';
};

/* ─── Grill item catalog ────────────────────────────────────────────── */
const GRILL_CATALOG = [
  {
    key: 'chicken_patty',
    label: 'Chicken Patty',
    gradient: 'linear-gradient(145deg, #FB923C 0%, #EA580C 100%)',
    border: '#EA580C',
    match: (n: string) => (n.includes('chicken') || n.includes('ayam')) && !n.includes('oblong'),
    isEgg: false,
  },
  {
    key: 'beef_patty',
    label: 'Beef Patty',
    gradient: 'linear-gradient(145deg, #EF4444 0%, #B91C1C 100%)',
    border: '#B91C1C',
    match: (n: string) => (n.includes('beef') || n.includes('wagyu') || n.includes('daging')) && !n.includes('oblong'),
    isEgg: false,
  },
  {
    key: 'chicken_oblong',
    label: 'Chicken Oblong',
    gradient: 'linear-gradient(145deg, #FBBF24 0%, #D97706 100%)',
    border: '#D97706',
    match: (n: string) => (n.includes('chicken') || n.includes('ayam')) && n.includes('oblong'),
    isEgg: false,
  },
  {
    key: 'beef_oblong',
    label: 'Beef Oblong',
    gradient: 'linear-gradient(145deg, #F97316 0%, #C2410C 100%)',
    border: '#C2410C',
    match: (n: string) => (n.includes('beef') || n.includes('wagyu') || n.includes('daging')) && n.includes('oblong'),
    isEgg: false,
  },
  {
    key: 'lamb_oblong',
    label: 'Lamb Oblong',
    gradient: 'linear-gradient(145deg, #F43F5E 0%, #BE123C 100%)',
    border: '#BE123C',
    match: (n: string) => n.includes('lamb') || n.includes('kambing'),
    isEgg: false,
  },
  {
    key: 'egg',
    label: 'Benjo (Egg)',
    gradient: 'linear-gradient(145deg, #4ADE80 0%, #16A34A 100%)',
    border: '#16A34A',
    match: (_n: string) => false, // counted via remarks
    isEgg: true,
  },
];

/** Count all grill items across a list of active orders */
const computeGrillCounts = (orders: Order[]): Record<string, number> => {
  const counts: Record<string, number> = {};
  GRILL_CATALOG.forEach(g => { counts[g.key] = 0; });

  orders.forEach(order => {
    order.items.forEach(item => {
      const n = item.menuItemName.toLowerCase();
      // Patty / oblong counts
      GRILL_CATALOG.filter(g => !g.isEgg).forEach(g => {
        if (g.match(n)) {
          let multiplier = 1;
          if (n.includes('double')) multiplier = 2;
          else if (n.includes('triple')) multiplier = 3;
          counts[g.key] += item.quantity * multiplier;
        }
      });
      // Egg count from remarks
      const { remarks } = getCustomisationSummary(item.customisations);
      if (remarks) {
        const m = remarks.toLowerCase().match(/(\d+)\s*egg/);
        if (m) counts['egg'] += parseInt(m[1]) * item.quantity;
        else if (remarks.toLowerCase().includes('egg')) counts['egg'] += item.quantity;
      }
    });
  });
  return counts;
};

/** Returns true if order is "on hold" (pickup time > 30 min from now) */
const isOnHold = (order: Order): boolean => {
  if (!order.pickupTime) return false;
  const pickup = new Date(order.pickupTime).getTime();
  const now = Date.now();
  return (pickup - now) > 30 * 60 * 1000;
};

const formatPickupCountdown = (pickupTime: string): string => {
  const diff = Math.max(0, new Date(pickupTime).getTime() - Date.now());
  const mins = Math.floor(diff / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return `${mins}m ${secs.toString().padStart(2, '0')}s`;
};

const formatTimestamp = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString('en-MY', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' });
};

/* ─── Parse customisations for display ─────────────────────────────── */
const parseCustomisations = (raw?: string) => {
  try { return JSON.parse(raw || '[]') as { ingredient: string; level: string }[]; }
  catch { return []; }
};

const getCustomisationSummary = (raw?: string) => {
  const all = parseCustomisations(raw);
  const toppings = all.filter(c =>
    ['tomatoes', 'shredded salad', 'cucumber', 'caramelized onion'].includes(c.ingredient.toLowerCase())
  );
  const sauces = all.filter(c =>
    ['black pepper', 'chilli', 'mayo'].includes(c.ingredient.toLowerCase())
  );
  const cheese = all.find(c => c.ingredient.toLowerCase() === 'cheese' && c.level.toUpperCase() === 'EXTRA');
  const remarks = all.find(c => c.ingredient.toLowerCase() === 'remarks')?.level;
  return { toppings, sauces, cheese, remarks };
};

const formatCustomisationsForStaff = (raw?: string) => {
  if (!raw) return '';
  try {
    const list = JSON.parse(raw) as { ingredient: string; level: string }[];
    const items = list
      .filter(c => {
        const name = c.ingredient.toLowerCase();
        if (name === 'remarks') return true;
        if (name === 'cheese') return c.level.toUpperCase() === 'EXTRA';
        return c.level.toUpperCase() !== 'MEDIUM';
      })
      .map(c => {
        const name = c.ingredient;
        const level = c.level.toLowerCase();
        if (name.toLowerCase() === 'remarks') {
          return `Remarks: "${c.level}"`;
        }
        if (name.toLowerCase() === 'cheese') {
          return 'Extra Cheese';
        }
        return `${name} (${level})`;
      });
    return items.join(', ');
  } catch {
    return '';
  }
};

const renderItemCustomisations = (customisationsString?: string) => {
  const formatted = formatCustomisationsForStaff(customisationsString);
  if (!formatted) return null;
  return (
    <div style={{
      margin: '4px 0 0 18px', padding: '6px 10px',
      background: 'var(--cream-dark)', borderRadius: 8,
      border: '1px dashed var(--border)', fontSize: '0.7rem',
      color: 'var(--text-primary)'
    }}>
      {formatted}
    </div>
  );
};

const playNotificationChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      
      gain.gain.setValueAtTime(0.15, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };
    
    const now = ctx.currentTime;
    playTone(587.33, now, 0.12); // D5
    playTone(880, now + 0.12, 0.25); // A5
  } catch (e) {
    console.error('Failed to play sound', e);
  }
};

/* ─── Status colour helper ──────────────────────────────────────────── */
const statusColour = (s: string) => {
  switch (s) {
    case 'ON_HOLD': return { bg: 'rgba(124,58,237,0.08)', text: '#7C3AED' };
    case 'INCOMING_ORDER': return { bg: 'rgba(217,119,6,0.1)', text: '#D97706' };
    case 'PENDING': return { bg: 'rgba(217,119,6,0.1)', text: '#D97706' };
    case 'ACCEPTED': return { bg: 'rgba(255,107,0,0.08)', text: 'var(--red)' };
    case 'GRILLING': return { bg: 'rgba(234,88,12,0.1)', text: '#EA580C' };
    case 'ASSEMBLING': return { bg: 'rgba(124,58,237,0.08)', text: '#7C3AED' };
    case 'READY': return { bg: 'rgba(22,163,74,0.08)', text: '#16A34A' };
    case 'COMPLETED': return { bg: 'rgba(22,163,74,0.06)', text: '#16A34A' };
    case 'CANCELLED': return { bg: 'rgba(220,38,38,0.06)', text: '#DC2626' };
    default: return { bg: 'var(--cream-dark)', text: 'var(--text-secondary)' };
  }
};

/* ═══════════════════════════════════════════════════════════════════════
   PASSWORD MODAL
════════════════════════════════════════════════════════════════════════*/
const PasswordModal: React.FC<{
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

/* ═══════════════════════════════════════════════════════════════════════
   EDIT ORDER MODAL
════════════════════════════════════════════════════════════════════════*/
const EditOrderModal: React.FC<{
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

/* ═══════════════════════════════════════════════════════════════════════
   ORDER HISTORY DRAWER
════════════════════════════════════════════════════════════════════════*/
const HistoryDrawer: React.FC<{ orders: Order[]; onClose: () => void }> = ({ orders, onClose }) => {
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

/* ═══════════════════════════════════════════════════════════════════════
   ON-HOLD DRAWER
════════════════════════════════════════════════════════════════════════*/
const OnHoldDrawer: React.FC<{ orders: Order[]; onClose: () => void }> = ({ orders, onClose }) => {
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

/* ═══════════════════════════════════════════════════════════════════════
   ORDER CARD — FRONT COUNTER
════════════════════════════════════════════════════════════════════════*/
interface FrontCardProps {
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

const FrontOrderCard: React.FC<FrontCardProps> = ({
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
          {/* Three-dot menu (only for incoming/active/ready) */}
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

      {/* On-hold countdown badge */}
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

      {/* Status badge */}
      <span style={{
        fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase',
        padding: '3px 8px', borderRadius: 99, background: sc.bg, color: sc.text, alignSelf: 'flex-start'
      }}>{order.status}</span>

      {/* Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {order.items.map(item => {
          return (
            <div key={item.id}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1A1008' }}>
                {getItemEmoji(item.menuItemName)} {item.quantity}× {item.menuItemName}
                <span style={{ color: '#9B7B6B', fontWeight: 500, marginLeft: 6 }}>
                  {formatRM(item.unitPrice * item.quantity)}
                </span>
              </div>
              {renderItemCustomisations(item.customisations)}
            </div>
          );
        })}
      </div>

      {/* Payment row */}
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

      {/* Notes */}
      {order.notes && (
        <div style={{ fontSize: '0.72rem', color: '#7C3AED', background: 'rgba(124,58,237,0.05)', borderRadius: 8, padding: '5px 8px', fontStyle: 'italic' }}>
          {order.notes}
        </div>
      )}

      {/* Action buttons */}
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
};

/* ═══════════════════════════════════════════════════════════════════════
   GRILL STATION — ACTIVE ORDER CARD (compact row)
 ════════════════════════════════════════════════════════════════════════*/
const GrillActiveCard: React.FC<{
  order: Order;
  onDone: () => void;
  updating: boolean;
}> = ({ order, onDone, updating }) => {
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

  // Collect remarks
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
        </div>
      </div>

      {/* Status badge */}
      <span style={{
        fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase',
        padding: '3px 8px', borderRadius: 99,
        background: grillDone ? 'rgba(22,163,74,0.08)' : 'rgba(234,88,12,0.1)',
        color: grillDone ? '#16A34A' : '#EA580C',
        alignSelf: 'flex-start'
      }}>
        {grillDone ? 'Grill Done' : 'Grilling'}
      </span>

      {/* Items */}
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
};

/* ═══════════════════════════════════════════════════════════════════════
   PREP LINE CARD
════════════════════════════════════════════════════════════════════════*/
const PrepCard: React.FC<{
  order: Order;
  onMarkReady: () => void;
  updating: boolean;
}> = ({ order, onMarkReady, updating }) => {
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
        </div>
      </div>

      {/* Status badge */}
      <span style={{
        fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase',
        padding: '3px 8px', borderRadius: 99, background: sc.bg, color: sc.text, alignSelf: 'flex-start'
      }}>{order.status}</span>

      {/* Grill status indicator */}
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

      {/* Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {order.items.map(item => {
          return (
            <div key={item.id}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {getItemEmoji(item.menuItemName)} {item.quantity}× {item.menuItemName}
              </div>
              {renderItemCustomisations(item.customisations)}
            </div>
          );
        })}
      </div>

      {/* Action button */}
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
};

/* ═══════════════════════════════════════════════════════════════════════
   SECTION HEADER
════════════════════════════════════════════════════════════════════════*/
const SectionHeader: React.FC<{
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

/* ═══════════════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════════════════*/
export const KitchenPage: React.FC = () => {
  const { confirm } = useConfirmation();
  const [activeTab, setActiveTab] = useState('FRONT');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showOnHold, setShowOnHold] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null);

  // Password modal state
  const [pinModal, setPinModal] = useState<{ action: string; onConfirm: () => void; isManager?: boolean } | null>(null);

  // Outage states
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [ingredientOutages, setIngredientOutages] = useState<IngredientOutage[]>([]);
  const [loadingOutages, setLoadingOutages] = useState(false);

  // Auth store
  const { clearAuth } = useAuthStore();

  const prevOrderIds = React.useRef<Set<number>>(new Set());

  const fetchOrders = useCallback(async () => {
    try {
      const res = await orderService.getAll();
      const newOrders = [...res.data].sort((a: any, b: any) => a.id - b.id);
      if (prevOrderIds.current.size > 0) {
        const hasNewOrder = newOrders.some((o: any) => !prevOrderIds.current.has(o.id));
        if (hasNewOrder) {
          playNotificationChime();
        }
      }
      prevOrderIds.current = new Set(newOrders.map((o: any) => o.id));
      setOrders(newOrders);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOutages = useCallback(async () => {
    setLoadingOutages(true);
    try {
      const [menuRes, ingRes] = await Promise.all([
        menuService.getAllItems(),
        ingredientService.getAll()
      ]);
      setMenuItems(menuRes.data);
      setIngredientOutages(ingRes.data);
    } catch {
      toast.error('Failed to load outages');
    } finally {
      setLoadingOutages(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  useEffect(() => {
    if (activeTab === 'SETTINGS') {
      fetchOutages();
    }
  }, [activeTab, fetchOutages]);

  useEffect(() => {
    const handler = () => setActiveMenuId(null);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, []);

  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const preventBack = () => {
      window.history.pushState(null, '', window.location.href);
      toast('Navigation disabled for security', { icon: '🔒', id: 'nav-lock-kitchen' });
    };
    window.addEventListener('popstate', preventBack);
    return () => window.removeEventListener('popstate', preventBack);
  }, []);

  const updateStatus = async (orderId: number, status: string) => {
    if (status === 'COMPLETED') {
      const order = orders.find(o => o.id === orderId);
      if (order && order.paymentStatus !== 'PAID') {
        toast.error('Cannot complete order: Payment is unpaid');
        return;
      }
    }
    setUpdating(orderId);
    try {
      await orderService.updateStatus(orderId, status);
      await fetchOrders();
      toast.success(`Order ${status.toLowerCase()}`);
    } catch {
      toast.error('Failed to update order status');
    } finally {
      setUpdating(null);
    }
  };

  const confirmCash = async (orderId: number) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const isPaid = order.paymentStatus === 'PAID';
    const confirmed = await confirm({
      title: isPaid ? 'Mark Payment Unpaid' : 'Confirm Cash Payment',
      message: isPaid 
        ? `Are you sure you want to mark order ${order.orderNumber} as UNPAID?`
        : `Are you sure you want to confirm cash payment of ${formatRM(order.total)} for order ${order.orderNumber}?`,
      confirmLabel: isPaid ? 'Mark Unpaid' : 'Confirm Cash',
      cancelLabel: 'Cancel',
      type: 'warning'
    });
    if (!confirmed) return;
    try {
      if (isPaid) {
        await paymentService.unconfirmCash(orderId);
        toast.success('Cash payment marked as UNPAID');
      } else {
        await paymentService.confirmCash(orderId);
        toast.success('Cash payment confirmed!');
      }
      await fetchOrders();
    } catch {
      toast.error('Failed to update payment status');
    }
  };

  const handleCancelOrderClick = async (order: Order) => {
    const confirmed = await confirm({
      title: 'Cancel Order',
      message: `Are you sure you want to cancel order ${order.orderNumber}?`,
      details: 'This action is irreversible and will cancel the order.',
      confirmLabel: 'Cancel Order',
      cancelLabel: 'Keep Order',
      type: 'danger'
    });
    if (!confirmed) return;
    withPin(`Cancel Order ${order.orderNumber}`, async () => {
      setCancellingOrderId(order.id);
      try {
        await orderService.updateStatus(order.id, 'CANCELLED');
        await fetchOrders();
        toast.success(`Order cancelled`);
      } catch {
        toast.error('Failed to cancel order');
      } finally {
        setCancellingOrderId(null);
      }
    });
  };

  const toggleMenuItem = async (id: number) => {
    try {
      await menuService.toggle(id);
      toast.success('Item availability toggled');
      setMenuItems(prev =>
        prev.map(item => (item.id === id ? { ...item, isAvailable: !item.isAvailable } : item))
      );
    } catch {
      toast.error('Failed to update item availability');
    }
  };

  const toggleIngredientOutage = async (name: string) => {
    try {
      await ingredientService.toggle(name);
      toast.success('Ingredient availability toggled');
      setIngredientOutages(prev =>
        prev.map(ing => (ing.name === name ? { ...ing, outOfStock: !ing.outOfStock } : ing))
      );
    } catch {
      toast.error('Failed to update ingredient availability');
    }
  };

  const handleSaveEdit = async (name: string, phone: string, notes: string, time: string) => {
    if (!editingOrder) return;
    setSavingEdit(true);
    try {
      await orderService.updateDetails(editingOrder.id, {
        guestName: name, guestPhone: phone, notes, pickupTime: time || undefined
      });
      toast.success('Order updated!');
      setEditingOrder(null);
      await fetchOrders();
    } catch {
      toast.error('Failed to update order');
    } finally {
      setSavingEdit(false);
    }
  };

  // Password-gate wrapper
  const withPin = (actionLabel: string, fn: () => void, isManager?: boolean) => {
    setPinModal({ action: actionLabel, onConfirm: fn, isManager });
  };

  const activeOrders = orders.filter(o => !['COMPLETED', 'CANCELLED'].includes(o.status));
  const onHoldOrders = activeOrders.filter(o => o.status === 'ON_HOLD');
  const incomingOrders = activeOrders
    .filter(o => o.status === 'INCOMING_ORDER' || o.status === 'PENDING')
    .sort((a, b) => {
      const timeA = a.queueEnteredAt ? new Date(a.queueEnteredAt).getTime() : new Date(a.createdAt).getTime();
      const timeB = b.queueEnteredAt ? new Date(b.queueEnteredAt).getTime() : new Date(b.createdAt).getTime();
      return timeA - timeB;
    });
  const acceptedOrders = activeOrders.filter(o => ['ACCEPTED', 'GRILLING', 'ASSEMBLING'].includes(o.status));
  const readyOrders = activeOrders.filter(o => o.status === 'READY');

  const grillOrders = orders.filter(o => ['ACCEPTED', 'GRILLING'].includes(o.status));
  const prepOrders = orders.filter(o => ['ACCEPTED', 'GRILLING', 'ASSEMBLING'].includes(o.status));

  // Today's stats calculation:
  const todayOrders = orders.filter(o => {
    const d = new Date(o.createdAt);
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear() &&
           o.status !== 'CANCELLED';
  });

  const totalSalesToday = todayOrders.reduce((sum, o) => sum + o.total, 0);

  // Best sold items
  const itemCounts: Record<string, number> = {};
  todayOrders.forEach(o => {
    o.items.forEach(item => {
      itemCounts[item.menuItemName] = (itemCounts[item.menuItemName] || 0) + item.quantity;
    });
  });

  const bestSoldItems = Object.entries(itemCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', fontFamily: 'Inter, sans-serif', color: 'var(--text-dark)' }}>

      {/* Top Nav */}
      <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--bkb-border)', padding: '0 24px', position: 'sticky', top: 0, zIndex: 400 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
          <div style={{ display: 'flex', gap: 28, height: '100%' }}>
            {TABS.map(tab => {
              const active = activeTab === tab.key;
              const badge = tab.key === 'FRONT' ? incomingOrders.length : tab.key === 'GRILL' ? grillOrders.length : tab.key === 'PREP' ? prepOrders.length : 0;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none',
                    borderBottom: active ? '3px solid var(--red)' : '3px solid transparent',
                    color: active ? 'var(--red)' : 'var(--text-secondary)', fontFamily: 'Poppins', fontWeight: 700,
                    fontSize: '0.88rem', cursor: 'pointer', padding: '0 4px', height: '100%', transition: 'all 0.2s'
                  }}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                  {badge > 0 && (
                    <span style={{
                      background: 'var(--red)', color: '#fff', borderRadius: '50%', minWidth: 18, height: 18,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800
                    }}>{badge}</span>
                  )}
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ChefHat size={18} style={{ color: 'var(--red)' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-secondary)' }}>
                Kitchen Crew
              </span>
            </div>

            <button
              onClick={() => {
                clearAuth();
                useCartStore.getState().clearCart();
                toast.success('Logged out successfully');
                window.location.replace('/');
              }}
              style={{
                background: 'var(--cream-dark)',
                color: 'var(--red)',
                border: '1.5px solid var(--border)',
                borderRadius: 10,
                padding: '6px 12px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--red)';
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.borderColor = 'var(--red)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--cream-dark)';
                e.currentTarget.style.color = 'var(--red)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <style>{RESPONSIVE_CSS}</style>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 20px' }}>

        {/* Page header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '1.5rem', margin: 0, color: 'var(--text-dark)' }}>
              {activeTab === 'FRONT' ? 'Front Counter' : activeTab === 'GRILL' ? 'Grill Station' : activeTab === 'PREP' ? 'Prep Line' : 'Settings'}
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#9B7B6B' }}>
              {activeTab === 'FRONT'
                ? 'Accept, manage and complete customer orders'
                : activeTab === 'GRILL'
                ? 'Track patty requirements per order'
                : activeTab === 'PREP'
                ? 'Assemble orders and update status'
                : 'Manage outages, themes, and console settings'}
            </p>
          </div>
          {activeTab === 'FRONT' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={() => setShowOnHold(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7, background: '#fff',
                  border: '1.5px solid #EAE2D8', color: '#1A1008', borderRadius: 10,
                  padding: '9px 14px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                }}
              >
                <Clock size={15} color="#7C3AED" /> Scheduled Orders
              </button>
              <button
                onClick={() => setShowHistory(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7, background: '#fff',
                  border: '1.5px solid #EAE2D8', color: '#1A1008', borderRadius: 10,
                  padding: '9px 14px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                }}
              >
                <History size={15} /> Order History
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 80 }}>
            <LoadingSpinner size="lg" />
            <p style={{ color: '#9B7B6B', fontSize: '0.9rem', marginTop: 12 }}>Loading orders...</p>
          </div>
        ) : (
          <>
            {/* ── FRONT COUNTER ─────────────────────────────────────── */}
            {activeTab === 'FRONT' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Dashboard Stats */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '16px',
                  marginBottom: '8px'
                }}>
                  {/* Total Sales */}
                  <div style={{
                    background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)',
                    borderRadius: 20,
                    padding: '20px 24px',
                    color: '#fff',
                    boxShadow: '0 10px 25px rgba(22, 163, 74, 0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '120px'
                  }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Today's Total Sales
                    </div>
                    <div>
                      <div style={{ fontSize: '2.2rem', fontWeight: 900, fontFamily: 'Poppins', lineHeight: '1.2' }}>
                        {formatRM(totalSalesToday)}
                      </div>
                      <div style={{ fontSize: '0.72rem', opacity: 0.8, marginTop: 4 }}>
                        From {todayOrders.length} order{todayOrders.length !== 1 ? 's' : ''} (excluding cancelled)
                      </div>
                    </div>
                  </div>

                  {/* Best Sold Items */}
                  <div style={{
                    background: 'linear-gradient(135deg, #FF9900 0%, #FF5E00 100%)',
                    borderRadius: 20,
                    padding: '20px 24px',
                    color: '#fff',
                    boxShadow: '0 10px 25px rgba(255, 94, 0, 0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '120px'
                  }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Best Sold Items (Today)
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                      {bestSoldItems.length === 0 ? (
                        <div style={{ fontSize: '0.85rem', opacity: 0.9, fontStyle: 'italic' }}>
                          No items sold yet today
                        </div>
                      ) : (
                        bestSoldItems.map((item, idx) => (
                          <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                            <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                              {idx + 1}. {getItemEmoji(item.name)} {item.name}
                            </span>
                            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 12, fontWeight: 800, fontSize: '0.75rem' }}>
                              {item.count} sold
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Incoming */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <SectionHeader
                    label="Incoming Orders"
                    count={incomingOrders.length}
                    color="#D97706"
                    bg="rgba(217,119,6,0.04)"
                    subtitle="Awaiting staff acceptance"
                  />
                  <div className="order-grid">
                    {incomingOrders.map(order => (
                      <FrontOrderCard
                        key={order.id}
                        order={order}
                        mode="incoming"
                        onAccept={() => updateStatus(order.id, 'ACCEPTED')}
                        onAdvance={() => {}}
                        onConfirmCash={() => confirmCash(order.id)}
                        onEdit={() => withPin(`Edit Order ${order.orderNumber}`, () => setEditingOrder(order))}
                        onCancel={() => handleCancelOrderClick(order)}
                        updating={updating === order.id}
                        activeMenuId={activeMenuId}
                        setActiveMenuId={setActiveMenuId}
                      />
                    ))}
                    {incomingOrders.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '28px 20px', border: '1.5px dashed #EAE2D8', borderRadius: 14, color: '#9B7B6B', fontSize: '0.8rem', gridColumn: '1 / -1' }}>
                        No incoming orders right now
                      </div>
                    )}
                  </div>
                </div>

                {/* Accepted */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <SectionHeader
                    label="Accepted Orders"
                    count={acceptedOrders.length}
                    color="var(--red)"
                    bg="rgba(255,107,0,0.04)"
                    subtitle="Orders being prepared"
                  />
                  <div className="order-grid">
                    {acceptedOrders.map(order => (
                      <FrontOrderCard
                        key={order.id}
                        order={order}
                        mode="active"
                        onAccept={() => {}}
                        onAdvance={() => updateStatus(order.id, 'READY')}
                        onConfirmCash={() => confirmCash(order.id)}
                        onEdit={() => withPin(`Edit Order ${order.orderNumber}`, () => setEditingOrder(order))}
                        onCancel={() => handleCancelOrderClick(order)}
                        updating={updating === order.id}
                        activeMenuId={activeMenuId}
                        setActiveMenuId={setActiveMenuId}
                      />
                    ))}
                    {acceptedOrders.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '28px 20px', border: '1.5px dashed #EAE2D8', borderRadius: 14, color: '#9B7B6B', fontSize: '0.8rem', gridColumn: '1 / -1' }}>
                        No orders currently in progress
                      </div>
                    )}
                  </div>
                </div>

                {/* Ready */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <SectionHeader
                    label="Ready for Pickup"
                    count={readyOrders.length}
                    color="#16A34A"
                    bg="rgba(22,163,74,0.04)"
                    subtitle="Call the customer!"
                  />
                  <div className="order-grid">
                    {readyOrders.map(order => (
                      <FrontOrderCard
                        key={order.id}
                        order={order}
                        mode="ready"
                        onAccept={() => {}}
                        onAdvance={() => updateStatus(order.id, 'COMPLETED')}
                        onConfirmCash={() => confirmCash(order.id)}
                        onEdit={() => withPin(`Edit Order ${order.orderNumber}`, () => setEditingOrder(order))}
                        onCancel={() => handleCancelOrderClick(order)}
                        updating={updating === order.id}
                        activeMenuId={activeMenuId}
                        setActiveMenuId={setActiveMenuId}
                      />
                    ))}
                    {readyOrders.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '28px 20px', border: '1.5px dashed #EAE2D8', borderRadius: 14, color: '#9B7B6B', fontSize: '0.8rem', gridColumn: '1 / -1' }}>
                        Nothing ready for pickup yet
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* ── GRILL STATION ─────────────────────────────────────── */}
            {activeTab === 'GRILL' && (() => {
              const grillCounts = computeGrillCounts(grillOrders);
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

                  {/* Summary Tiles */}
                  <div className="grill-tile-grid">
                    {GRILL_CATALOG.map(item => {
                      const count = grillCounts[item.key] || 0;
                      return (
                        <div
                          key={item.key}
                          style={{
                            background: item.gradient,
                            borderRadius: 18,
                            padding: '18px 16px 32px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4,
                            position: 'relative',
                            minHeight: 110,
                            boxShadow: `0 6px 20px ${item.border}30`
                          }}
                        >
                          
                          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)', fontFamily: 'Poppins' }}>{item.label}</div>
                          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fff', fontFamily: 'Poppins', lineHeight: 1.1, marginTop: 4 }}>{count}</div>
                          <div style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0,
                            background: 'rgba(0,0,0,0.18)', borderRadius: '0 0 18px 18px',
                            padding: '5px 16px', fontSize: '0.68rem', fontWeight: 600,
                            color: 'rgba(255,255,255,0.85)', textAlign: 'center'
                          }}>
                            {count === 0 ? 'None needed' : `${count} to grill`}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Active Grill Orders */}
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '1rem', color: '#1A1008', marginBottom: 12 }}>
                      Active Grill Orders
                    </div>
                    {grillOrders.length === 0 ? (
                      <div style={{
                        textAlign: 'center', padding: '48px 20px',
                        border: '1.5px dashed #EAE2D8', borderRadius: 18,
                        color: '#9B7B6B', fontSize: '0.85rem',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10
                      }}>
                        <Flame size={32} opacity={0.35} />
                        No burgers to cook right now
                      </div>
                    ) : (
                      <div className="order-grid">
                        {grillOrders.map(order => (
                          <GrillActiveCard
                            key={order.id}
                            order={order}
                            onDone={() => updateStatus(order.id, 'GRILLING')}
                            updating={updating === order.id}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              );
            })()}

            {/* ── PREP LINE ─────────────────────────────────────────── */}
            {activeTab === 'PREP' && (
              <div className="order-grid">
                {prepOrders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 60, color: '#9B7B6B', fontSize: '0.85rem', gridColumn: '1 / -1' }}>
                    No items to prep right now
                  </div>
                ) : (
                  prepOrders.map(order => (
                    <PrepCard
                      key={order.id}
                      order={order}
                      onMarkReady={() => updateStatus(order.id, 'READY')}
                      updating={updating === order.id}
                    />
                  ))
                )}
              </div>
            )}

            {/* ── SETTINGS & OUTAGES ─────────────────────────────────── */}
            {activeTab === 'SETTINGS' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 10 }}>
                {/* Theme Switch Section */}
                <div style={{
                  background: 'var(--surface)',
                  borderRadius: 20,
                  padding: 24,
                  border: '1.5px solid var(--border)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16
                }}>
                  <div>
                    <h3 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)' }}>
                      Appearance Settings
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                      Customise the console look and feel for your workspace.
                    </p>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    background: 'var(--cream-dark)',
                    borderRadius: 14,
                    border: '1px solid var(--border)'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>Console Theme</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                        Switch between light and Threads-style dark themes.
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', background: 'var(--background)', borderRadius: 10, padding: 4, border: '1px solid var(--border)' }}>
                      {[
                        { key: 'light', label: 'Light' },
                        { key: 'dark', label: 'Dark' }
                      ].map(themeOpt => {
                        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
                        const isSelected = currentTheme === themeOpt.key;
                        return (
                          <button
                            key={themeOpt.key}
                            onClick={() => {
                              document.documentElement.setAttribute('data-theme', themeOpt.key);
                              localStorage.setItem('bkb-theme', themeOpt.key);
                              toast.success(`Switched to ${themeOpt.label}!`);
                              window.dispatchEvent(new Event('theme-change'));
                              fetchOrders(); // dummy trigger to force re-render
                            }}
                            style={{
                              padding: '8px 16px',
                              background: isSelected ? 'var(--red)' : 'transparent',
                              color: isSelected ? '#fff' : 'var(--text-secondary)',
                              border: 'none',
                              borderRadius: 8,
                              fontWeight: 700,
                              fontSize: '0.78rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6
                            }}
                          >
                            {themeOpt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Outages Columns */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                  gap: '24px'
                }}>
                  {/* Left side: Menu Items Availability */}
                  <div style={{
                    background: 'var(--surface)',
                    borderRadius: 20,
                    padding: 24,
                    border: '1.5px solid var(--border)',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16
                  }}>
                    <div>
                      <h3 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)' }}>
                        Menu Items Availability
                      </h3>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                        Toggle menu items to make them visible/hidden to customers. (Requires Manager PIN)
                      </p>
                    </div>

                    {loadingOutages ? (
                      <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                        <LoadingSpinner size="md" />
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '600px', overflowY: 'auto', paddingRight: '4px' }}>
                        {menuItems.map(item => (
                          <div
                            key={item.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '12px 14px',
                              background: 'var(--cream-dark)',
                              borderRadius: 14,
                              border: '1px solid var(--border)'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ fontSize: '1.3rem' }}>{getItemEmoji(item.name)}</span>
                              <div>
                                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.name}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{item.category} · {formatRM(item.promoPrice ?? item.price)}</div>
                              </div>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{
                                fontSize: '0.62rem',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                padding: '3px 8px',
                                borderRadius: 99,
                                background: item.isAvailable ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)',
                                color: item.isAvailable ? '#16A34A' : '#DC2626'
                              }}>
                                {item.isAvailable ? 'Available' : 'Out of Stock'}
                              </span>
                              <div
                                onClick={() => withPin(`Toggle Outage: ${item.name}`, () => toggleMenuItem(item.id), true)}
                                style={{
                                  width: 40,
                                  height: 20,
                                  borderRadius: 99,
                                  background: item.isAvailable ? '#16A34A' : 'var(--border)',
                                  position: 'relative',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  transition: 'background 0.2s'
                                }}
                              >
                                <div style={{
                                  width: 14,
                                  height: 14,
                                  borderRadius: '50%',
                                  background: '#fff',
                                  position: 'absolute',
                                  left: item.isAvailable ? 23 : 3,
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                                  transition: 'left 0.2s'
                                }} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right side: Ingredients Availability */}
                  <div style={{
                    background: 'var(--surface)',
                    borderRadius: 20,
                    padding: 24,
                    border: '1.5px solid var(--border)',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16
                  }}>
                    <div>
                      <h3 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)' }}>
                        Customisation Ingredients Availability
                      </h3>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                        Toggle customisation options. Out-of-stock options will be disabled for customers. (Requires Manager PIN)
                      </p>
                    </div>

                    {loadingOutages ? (
                      <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                        <LoadingSpinner size="md" />
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '600px', overflowY: 'auto', paddingRight: '4px' }}>
                        {ingredientOutages.map(ing => {
                          const isAvailable = !ing.outOfStock;
                          return (
                            <div
                              key={ing.name}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '12px 14px',
                                background: 'var(--cream-dark)',
                                borderRadius: 14,
                                border: '1px solid var(--border)'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontSize: '1.3rem' }}>
                                  {ing.name.toLowerCase().includes('tomato') ? '' :
                                   ing.name.toLowerCase().includes('salad') ? '' :
                                   ing.name.toLowerCase().includes('cucumber') ? '' :
                                   ing.name.toLowerCase().includes('onion') ? '' :
                                   ing.name.toLowerCase().includes('cheese') ? '' :
                                   ing.name.toLowerCase().includes('black pepper') ? '' :
                                   ing.name.toLowerCase().includes('chilli') ? '' :
                                   ing.name.toLowerCase().includes('mayo') ? '' :
                                   ing.name.toLowerCase().includes('egg') ? '' : ''}
                                </span>
                                <div>
                                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{ing.name}</div>
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{
                                  fontSize: '0.62rem',
                                  fontWeight: 800,
                                  textTransform: 'uppercase',
                                  padding: '3px 8px',
                                  borderRadius: 99,
                                  background: isAvailable ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)',
                                  color: isAvailable ? '#16A34A' : '#DC2626'
                                }}>
                                  {isAvailable ? 'Available' : 'Out of Stock'}
                                </span>
                                <div
                                  onClick={() => withPin(`Toggle Outage: ${ing.name}`, () => toggleIngredientOutage(ing.name), true)}
                                  style={{
                                    width: 40,
                                    height: 20,
                                    borderRadius: 99,
                                    background: isAvailable ? '#16A34A' : 'var(--border)',
                                    position: 'relative',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    transition: 'background 0.2s'
                                  }}
                                >
                                  <div style={{
                                    width: 14,
                                    height: 14,
                                    borderRadius: '50%',
                                    background: '#fff',
                                    position: 'absolute',
                                    left: isAvailable ? 23 : 3,
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                                    transition: 'left 0.2s'
                                  }} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals & Drawers */}
      {pinModal && (
        <PasswordModal
          action={pinModal.action}
          onConfirm={pinModal.onConfirm}
          onClose={() => setPinModal(null)}
          isManager={pinModal.isManager}
        />
      )}
      {editingOrder && (
        <EditOrderModal
          order={editingOrder}
          onClose={() => setEditingOrder(null)}
          onSave={handleSaveEdit}
          saving={savingEdit}
        />
      )}
      {showHistory && (
        <HistoryDrawer
          orders={orders}
          onClose={() => setShowHistory(false)}
        />
      )}
      {showOnHold && (
        <OnHoldDrawer
          orders={orders}
          onClose={() => setShowOnHold(false)}
        />
      )}
      {cancellingOrderId && (
        <FullScreenLoader
          message="Cancelling order..."
          subtitle="Updating system records..."
        />
      )}
    </div>
  );
};
