import React, { useState, useEffect } from 'react';
import { Plus, Sliders, AlertCircle, RefreshCw, X } from 'lucide-react';
import { InventoryItem } from '../../types';
import { inventoryService } from '../../services/inventory.service';
import { ManagerLayout } from './ManagerDashboard';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorState } from '../../components/ui/ErrorState';
import toast from 'react-hot-toast';

export const InventoryContent: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'LOW'>('ALL');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustType, setAdjustType] = useState<string>('RESTOCK');
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    itemName: '', category: 'Meat', unit: 'pcs', currentStock: 0, minStock: 0, maxStock: 0
  });

  useEffect(() => { loadInventory(); }, []);

  const loadInventory = () => {
    setLoading(true);
    setError(false);
    inventoryService.getAll()
      .then(res => {
        setInventory(res.data);
        setError(false);
      })
      .catch((err) => {
        setError(true);
        toast.error('Failed to load inventory items');
        console.error(err);
      })
      .finally(() => setLoading(false));
  };

  const handleAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || adjustQty <= 0) { toast.error('Please enter a valid quantity'); return; }
    inventoryService.adjust(selectedItem.id, adjustQty, adjustType, adjustReason)
      .then(() => { toast.success('Stock adjusted'); setSelectedItem(null); setAdjustQty(0); setAdjustReason(''); loadInventory(); })
      .catch(() => toast.error('Failed to adjust stock'));
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    inventoryService.create(newItem)
      .then(() => { toast.success('Item added'); setIsAdding(false); setNewItem({ itemName: '', category: 'Meat', unit: 'pcs', currentStock: 0, minStock: 0, maxStock: 0 }); loadInventory(); })
      .catch(() => toast.error('Failed to add item'));
  };

  const filteredItems = activeTab === 'ALL' ? inventory : inventory.filter(i => i.status === 'LOW' || i.status === 'CRITICAL');

  const summary = {
    total: inventory.length,
    low: inventory.filter(i => i.status === 'LOW').length,
    critical: inventory.filter(i => i.status === 'CRITICAL').length,
  };

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 280px)', width: '100%' }}>
        <ErrorState onRetry={loadInventory} retrying={loading} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Items', value: summary.total, color: '#E8450A' },
          { label: 'Low Stock', value: summary.low, color: '#F59E0B' },
          { label: 'Critical', value: summary.critical, color: '#EF4444' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--bkb-card-bg)', border: '1px solid var(--bkb-border)', borderRadius: 14, padding: '16px 20px' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--bkb-gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: s.color, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Actions + Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['ALL', 'LOW'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              style={{ padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                background: activeTab === t ? (t === 'LOW' ? 'rgba(239,68,68,0.15)' : 'rgba(232,69,10,0.15)') : 'rgba(255,255,255,0.06)',
                color: activeTab === t ? (t === 'LOW' ? '#EF4444' : 'var(--bkb-orange)') : 'var(--bkb-gray-400)' }}>
              {t === 'ALL' ? `All (${inventory.length})` : `Alerts (${summary.low + summary.critical})`}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="bkb-btn-ghost" onClick={loadInventory} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: '0.85rem' }}>
            <RefreshCw size={15} /> Refresh
          </button>
          <button className="bkb-btn-primary" onClick={() => setIsAdding(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: '0.85rem' }}>
            <Plus size={15} /> Add Item
          </button>
        </div>
      </div>

      {/* Add Modal */}
      {isAdding && (
        <div className="modal-overlay" onClick={() => setIsAdding(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxWidth: 480, background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 24, padding: '24px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', fontFamily: 'Poppins' }}>Add Raw Ingredient</h3>
              <button onClick={() => setIsAdding(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Ingredient Name</label>
                <input type="text" value={newItem.itemName || ''} onChange={e => setNewItem(p => ({ ...p, itemName: e.target.value }))}
                  style={{ width: '100%', padding: '12px 16px', background: 'var(--background)', border: '1.5px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)', outline: 'none', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  placeholder="e.g. Cheddar Cheese" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Category</label>
                  <select value={newItem.category || 'Meat'} onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))}
                    style={{ width: '100%', padding: '12px 16px', background: 'var(--background)', border: '1.5px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)', outline: 'none', fontSize: '0.88rem', boxSizing: 'border-box' }}>
                    {['Meat', 'Bread', 'Vegetables', 'Dairy', 'Condiments', 'Cooking', 'Dry Goods'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Unit</label>
                  <input type="text" value={newItem.unit || ''} onChange={e => setNewItem(p => ({ ...p, unit: e.target.value }))}
                    style={{ width: '100%', padding: '12px 16px', background: 'var(--background)', border: '1.5px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)', outline: 'none', fontSize: '0.88rem', boxSizing: 'border-box' }}
                    placeholder="pcs, kg, L" required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {['Current Stock', 'Min Stock', 'Max Stock'].map((label, i) => {
                  const key = ['currentStock', 'minStock', 'maxStock'][i] as keyof InventoryItem;
                  return (
                    <div key={label}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{label}</label>
                      <input type="number" min="0" step="0.01" value={(newItem as any)[key] || ''} onChange={e => setNewItem(p => ({ ...p, [key]: Number(e.target.value) }))}
                        style={{ width: '100%', padding: '12px 16px', background: 'var(--background)', border: '1.5px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)', outline: 'none', fontSize: '0.88rem', boxSizing: 'border-box' }} required />
                    </div>
                  );
                })}
              </div>
              <button type="submit" style={{ marginTop: 12, padding: '14px', background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 20, fontWeight: 700, cursor: 'pointer', fontSize: '0.92rem', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 12px rgba(230, 51, 41, 0.2)' }}>Register Ingredient</button>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Modal */}
      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxWidth: 440, background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 24, padding: '24px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', fontFamily: 'Poppins' }}>Adjust: {selectedItem.itemName}</h3>
              <button onClick={() => setSelectedItem(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAdjust} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Adjustment Type</label>
                  <select value={adjustType} onChange={e => setAdjustType(e.target.value)}
                    style={{ width: '100%', padding: '12px 16px', background: 'var(--background)', border: '1.5px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)', outline: 'none', fontSize: '0.88rem', boxSizing: 'border-box' }}>
                    <option value="RESTOCK">Restock (Add)</option>
                    <option value="WASTE">Waste (Deduct)</option>
                    <option value="ADJUST">Inventory Count (Set)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Quantity ({selectedItem.unit})</label>
                  <input type="number" step="0.01" min="0.01" value={adjustQty || ''} onChange={e => setAdjustQty(Number(e.target.value))}
                    style={{ width: '100%', padding: '12px 16px', background: 'var(--background)', border: '1.5px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)', outline: 'none', fontSize: '0.88rem', boxSizing: 'border-box' }} required />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Reason / Remarks</label>
                <input type="text" value={adjustReason} onChange={e => setAdjustReason(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', background: 'var(--background)', border: '1.5px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)', outline: 'none', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  placeholder="e.g. Weekly Restock, Spoiled patty" required />
              </div>
              <button type="submit" style={{ marginTop: 12, padding: '14px', background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 20, fontWeight: 700, cursor: 'pointer', fontSize: '0.92rem', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 12px rgba(230, 51, 41, 0.2)' }}>Register Adjustment</button>
            </form>
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <div style={{ background: 'var(--bkb-card-bg)', border: '1px solid var(--bkb-border)', borderRadius: 16, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80 }}><LoadingSpinner size="lg" /></div>
        ) : filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80, color: 'var(--bkb-gray-400)' }}>No inventory items match current filter</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                  {['Ingredient', 'Category', 'Current Stock', 'Min Threshold', 'Est. Days Left', 'Status', 'Actions'].map((h, i) => (
                    <th key={h} style={{ padding: '14px 18px', fontSize: '0.8rem', color: 'var(--bkb-gray-400)', textAlign: i === 6 ? 'right' : 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(item => {
                  const sc = item.status === 'CRITICAL' ? '#EF4444' : item.status === 'LOW' ? '#F59E0B' : '#22C55E';
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '14px 18px', fontWeight: 600 }}>{item.itemName}</td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ fontSize: '0.78rem', background: 'var(--bkb-dark)', padding: '3px 8px', borderRadius: 6 }}>{item.category}</span>
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: 700 }}>
                        {item.currentStock} <span style={{ color: 'var(--bkb-gray-400)', fontSize: '0.78rem', fontWeight: 400 }}>{item.unit}</span>
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--bkb-gray-400)' }}>{item.minStock} {item.unit}</td>
                      <td style={{ padding: '14px 18px', fontWeight: 600 }}>
                        <div style={{ color: (item.estimatedDaysRemaining ?? 0) <= 3 ? '#EF4444' : 'var(--text-secondary)' }}>
                          {item.estimatedDaysRemaining !== null ? `${item.estimatedDaysRemaining} days` : '—'}
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 9px', borderRadius: 6, color: sc, background: `${sc}18` }}>{item.status}</span>
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <button className="bkb-btn-ghost" onClick={() => setSelectedItem(item)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', fontSize: '0.8rem' }}>
                          <Sliders size={13} /> Adjust
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export const ManagerInventory: React.FC = () => {
  return (
    <ManagerLayout title="Inventory">
      <InventoryContent />
    </ManagerLayout>
  );
};
