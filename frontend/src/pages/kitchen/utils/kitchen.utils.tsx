import React from 'react';
import { Order } from '../../../types';

export const STAFF_PIN = '1234';
export const MANAGER_PIN = '5678';

export const getItemEmoji = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('milo') || n.includes('air') || n.includes('drink') || n.includes('teh') || n.includes('kopi')) return '🥤';
  if (n.includes('oblong')) return '🌭';
  if (n.includes('chicken')) return '🍗';
  if (n.includes('beef') || n.includes('wagyu')) return '🥩';
  return '🍔';
};

export const GRILL_CATALOG = [
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
    match: (_n: string) => false,
    isEgg: true,
  },
];

export const computeGrillCounts = (orders: Order[]): Record<string, number> => {
  const counts: Record<string, number> = {};
  GRILL_CATALOG.forEach(g => { counts[g.key] = 0; });

  orders.forEach(order => {
    order.items.forEach(item => {
      const n = item.menuItemName.toLowerCase();
      GRILL_CATALOG.filter(g => !g.isEgg).forEach(g => {
        if (g.match(n)) {
          let multiplier = 1;
          if (n.includes('double')) multiplier = 2;
          else if (n.includes('triple')) multiplier = 3;
          counts[g.key] += item.quantity * multiplier;
        }
      });
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

export const isOnHold = (order: Order): boolean => {
  if (!order.pickupTime) return false;
  const pickup = new Date(order.pickupTime).getTime();
  const now = Date.now();
  return (pickup - now) > 30 * 60 * 1000;
};

export const formatPickupCountdown = (pickupTime: string): string => {
  const diff = Math.max(0, new Date(pickupTime).getTime() - Date.now());
  const mins = Math.floor(diff / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return `${mins}m ${secs.toString().padStart(2, '0')}s`;
};

export const formatTimestamp = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString('en-MY', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' });
};

export const parseCustomisations = (raw?: string) => {
  try { return JSON.parse(raw || '[]') as { ingredient: string; level: string }[]; }
  catch { return []; }
};

export const getCustomisationSummary = (raw?: string) => {
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

export const formatCustomisationsForStaff = (raw?: string) => {
  if (!raw) return [];
  try {
    const list = JSON.parse(raw) as { ingredient: string; level: string }[];
    return list
      .filter(c => {
        const name = c.ingredient.toLowerCase();
        if (name === 'remarks') return true;
        if (name === 'cheese') return c.level.toUpperCase() === 'EXTRA';
        return c.level.toUpperCase() !== 'MEDIUM';
      })
      .map(c => {
        const name = c.ingredient;
        const level = c.level.toUpperCase();
        if (name.toLowerCase() === 'remarks') {
          return { type: 'note', text: `Remarks: "${c.level}"` };
        }
        if (name.toLowerCase() === 'cheese') {
          return { type: 'add', text: '+ Extra Cheese' };
        }
        if (level === 'NONE' || level === 'LESS') {
          return { type: 'remove', text: `- ${level === 'NONE' ? 'No' : 'Less'} ${name}` };
        }
        if (level === 'EXTRA' || level === 'MORE') {
          return { type: 'add', text: `+ Extra ${name}` };
        }
        return { type: 'note', text: `${name} (${level})` };
      });
  } catch {
    return [];
  }
};

export const renderItemCustomisations = (customisationsString?: string) => {
  const items = formatCustomisationsForStaff(customisationsString);
  if (!items || items.length === 0) return null;
  return (
    <div style={{
      margin: '4px 0 0 18px', display: 'flex', flexWrap: 'wrap', gap: 6
    }}>
      {items.map((item, i) => {
        const bg = item.type === 'add' ? 'rgba(22,163,74,0.1)' : item.type === 'remove' ? 'rgba(220,38,38,0.1)' : 'var(--cream-dark)';
        const color = item.type === 'add' ? '#16A34A' : item.type === 'remove' ? '#DC2626' : 'var(--text-primary)';
        const border = item.type === 'add' ? '1px solid rgba(22,163,74,0.2)' : item.type === 'remove' ? '1px solid rgba(220,38,38,0.2)' : '1px dashed var(--border)';
        return (
          <div key={i} style={{
            padding: '4px 8px', background: bg, borderRadius: 6,
            border: border, fontSize: '0.68rem', fontWeight: item.type === 'note' ? 500 : 700,
            color: color
          }}>
            {item.text}
          </div>
        );
      })}
    </div>
  );
};

export const playNotificationChime = () => {
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
    playTone(587.33, now, 0.12);
    playTone(880, now + 0.12, 0.25);
  } catch (e) {
    console.error('Failed to play sound', e);
  }
};

export const statusColour = (s: string) => {
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
