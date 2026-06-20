import React, { useState, useEffect } from 'react';
import { Trash2, Calendar, Search } from 'lucide-react';
import { ManagerLayout } from './ManagerDashboard';
import { wasteService } from '../../services/manager.service';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface WasteEntry {
  id: number;
  inventoryName: string;
  unit: string;
  quantity: number;
  reason: string;
  createdAt: string;
  loggedBy: string;
  transactionCost?: number;
}

import { formatRM } from '../../utils/formatCurrency';

export const WasteContent: React.FC = () => {
  const [entries, setEntries] = useState<WasteEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [to, setTo] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    wasteService.getWasteLog(from, to)
      .then(r => setEntries(r.data))
      .catch(() => toast.error('Failed to load waste log'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = entries.filter(e =>
    e.inventoryName.toLowerCase().includes(search.toLowerCase()) ||
    (e.reason || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalQty = filtered.reduce((sum, e) => sum + Number(e.quantity), 0);
  const totalCost = filtered.reduce((sum, e) => sum + Number(e.transactionCost || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Filters */}
      <div style={{
        background: 'var(--bkb-card-bg)', border: '1px solid var(--bkb-border)',
        borderRadius: 16, padding: '16px 20px', marginBottom: 24,
        display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center'
      }}>
        <Calendar size={18} style={{ color: 'var(--bkb-orange)' }} />
        <input type="date" value={from} onChange={e => setFrom(e.target.value)}
          style={{ padding: '8px 12px', background: 'var(--bkb-dark)', border: '1px solid var(--bkb-border)', borderRadius: 8, color: 'var(--bkb-text)', fontSize: '0.85rem' }} />
        <span style={{ color: 'var(--bkb-gray-400)' }}>to</span>
        <input type="date" value={to} onChange={e => setTo(e.target.value)}
          style={{ padding: '8px 12px', background: 'var(--bkb-dark)', border: '1px solid var(--bkb-border)', borderRadius: 8, color: 'var(--bkb-text)', fontSize: '0.85rem' }} />
        <button className="bkb-btn-primary" onClick={load} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Apply</button>
        <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bkb-dark)', border: '1px solid var(--bkb-border)', borderRadius: 8, padding: '8px 12px' }}>
          <Search size={14} style={{ color: 'var(--bkb-gray-400)' }} />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search ingredient or reason..."
            style={{ background: 'none', border: 'none', color: 'var(--bkb-text)', fontSize: '0.85rem', flex: 1, outline: 'none' }}
          />
        </div>
      </div>

      {/* Summary */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 24
      }}>
        {[
          { label: 'Total Entries', value: filtered.length, icon: <Trash2 size={20} />, color: '#EF4444' },
          { label: 'Total Items Wasted', value: totalQty.toFixed(1), icon: <Trash2 size={20} />, color: '#F59E0B' },
          { label: 'Total Wasted Cost', value: formatRM(totalCost), icon: <Trash2 size={20} />, color: '#EF4444' },
        ].map((kpi, i) => (
          <div key={i} style={{
            background: 'var(--bkb-card-bg)', border: '1px solid var(--bkb-border)',
            borderRadius: 14, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${kpi.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: kpi.color }}>
              {kpi.icon}
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--bkb-gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{kpi.label}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--bkb-text)' }}>{kpi.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bkb-card-bg)', border: '1px solid var(--bkb-border)', borderRadius: 16, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><LoadingSpinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--bkb-gray-400)' }}>
            <Trash2 size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
            <p style={{ margin: 0 }}>No waste entries found for this period</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                  {['Date', 'Ingredient', 'Quantity', 'Cost', 'Reason', 'Logged By'].map(h => (
                    <th key={h} style={{ padding: '14px 18px', fontSize: '0.8rem', color: 'var(--bkb-gray-400)', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(entry => (
                  <tr key={entry.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '14px 18px', fontSize: '0.85rem', color: 'var(--bkb-gray-400)' }}>
                      {new Date(entry.createdAt).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: 600 }}>{entry.inventoryName}</td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{ color: '#EF4444', fontWeight: 700 }}>{entry.quantity}</span>{' '}
                      <span style={{ color: 'var(--bkb-gray-400)', fontSize: '0.8rem' }}>{entry.unit}</span>
                    </td>
                    <td style={{ padding: '14px 18px', color: '#EF4444', fontWeight: 600 }}>
                      {entry.transactionCost ? formatRM(entry.transactionCost) : '-'}
                    </td>
                    <td style={{ padding: '14px 18px', color: 'var(--bkb-gray-400)', fontSize: '0.85rem' }}>{entry.reason || '—'}</td>
                    <td style={{ padding: '14px 18px', fontSize: '0.85rem' }}>{entry.loggedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export const ManagerWasteLog: React.FC = () => {
  return (
    <ManagerLayout title="Waste Log">
      <WasteContent />
    </ManagerLayout>
  );
};
