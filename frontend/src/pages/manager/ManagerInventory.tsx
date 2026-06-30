import React, { useState, useEffect } from 'react';
import { Plus, Sliders, RefreshCw, X, Package, AlertTriangle, AlertCircle, Database } from 'lucide-react';
import { InventoryItem } from '../../types';
import { inventoryService } from '../../services/inventory.service';
import { ManagerLayout } from '../../components/layout/ManagerLayout';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorState } from '../../components/ui/ErrorState';
import toast from 'react-hot-toast';

// UI Components
import { AppCard } from '../../components/ui/AppCard';
import { AppStatCard } from '../../components/ui/AppStatCard';
import { AppTable, Column } from '../../components/ui/AppTable';
import { AppBadge } from '../../components/ui/AppBadge';
import { AppButton } from '../../components/ui/AppButton';
import { AppPageHeader } from '../../components/ui/AppPageHeader';
import { AppEmptyState } from '../../components/ui/AppEmptyState';

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
    setLoading(true); setError(false);
    inventoryService.getAll()
      .then(res => setInventory(res.data))
      .catch((err) => {
        setError(true); toast.error('Failed to load inventory items'); console.error(err);
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

  if (error) return <div className="flex items-center justify-center min-h-[50vh]"><ErrorState onRetry={loadInventory} retrying={loading} /></div>;

  const cols: Column<InventoryItem>[] = [
    { header: 'Ingredient', accessor: 'itemName' },
    { header: 'Category', render: (i) => <span className="text-xs bg-[var(--background)] px-2 py-1 rounded text-[var(--text-secondary)]">{i.category}</span> },
    { header: 'Current Stock', render: (i) => <span className="font-bold">{i.currentStock} <span className="font-normal text-[var(--text-secondary)] text-xs">{i.unit}</span></span> },
    { header: 'Min Threshold', render: (i) => <span className="text-[var(--text-secondary)]">{i.minStock} {i.unit}</span> },
    { header: 'Est. Days Left', render: (i) => <span className={`font-semibold ${(i.estimatedDaysRemaining ?? 0) <= 3 ? 'text-[var(--danger)]' : 'text-[var(--text-secondary)]'}`}>{i.estimatedDaysRemaining !== null ? `${i.estimatedDaysRemaining} days` : '—'}</span> },
    { header: 'Status', render: (i) => <AppBadge variant={i.status === 'CRITICAL' ? 'danger' : i.status === 'LOW' ? 'warning' : 'success'} text={i.status} /> },
    { header: '', render: (i) => <AppButton variant="ghost" size="sm" icon={Sliders} onClick={() => setSelectedItem(i)}>Adjust</AppButton>, align: 'right' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <AppPageHeader 
        title="Inventory Management" 
        subtitle="Manage stock levels, ingredients, and view stock alerts."
        actions={
          <>
            <AppButton variant="outline" onClick={loadInventory} icon={RefreshCw}>Refresh</AppButton>
            <AppButton variant="primary" onClick={() => setIsAdding(true)} icon={Plus}>Add Item</AppButton>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AppStatCard title="Total Items" value={summary.total} icon={Package} colorClass="text-blue-500" />
        <AppStatCard title="Low Stock" value={summary.low} icon={AlertTriangle} colorClass="text-[var(--warning)]" />
        <AppStatCard title="Critical Stock" value={summary.critical} icon={AlertCircle} colorClass="text-[var(--danger)]" />
      </div>

      <AppCard noPadding>
        <div className="px-6 py-4 border-b border-[var(--border)] flex gap-2">
          {(['ALL', 'LOW'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === t 
                  ? t === 'LOW' ? 'bg-red-500/10 text-red-500' : 'bg-[var(--primary)]/10 text-[var(--primary)]'
                  : 'bg-transparent text-[var(--text-secondary)] hover:bg-[rgba(0,0,0,0.02)]'
              }`}>
              {t === 'ALL' ? `All Items (${summary.total})` : `Alerts (${summary.low + summary.critical})`}
            </button>
          ))}
        </div>
        
        {loading ? (
          <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
        ) : (
          <AppTable 
            columns={cols} 
            data={filteredItems} 
            keyExtractor={(i) => i.id} 
            emptyMessage={<AppEmptyState title="No items found" description="There are no items matching the current filter." icon={Database} />} 
          />
        )}
      </AppCard>

      {/* Add Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setIsAdding(false)}>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-lg overflow-hidden shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--background)]">
              <h3 className="font-bold text-lg m-0">Add Raw Ingredient</h3>
              <button onClick={() => setIsAdding(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><X size={20} /></button>
            </div>
            <form onSubmit={handleAdd} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Ingredient Name</label>
                <input type="text" value={newItem.itemName || ''} onChange={e => setNewItem(p => ({ ...p, itemName: e.target.value }))}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)]" placeholder="e.g. Cheddar Cheese" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Category</label>
                  <select value={newItem.category || 'Meat'} onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)]">
                    {['Meat', 'Bread', 'Vegetables', 'Dairy', 'Condiments', 'Cooking', 'Dry Goods'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Unit</label>
                  <input type="text" value={newItem.unit || ''} onChange={e => setNewItem(p => ({ ...p, unit: e.target.value }))}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)]" placeholder="pcs, kg, L" required />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {['Current Stock', 'Min Stock', 'Max Stock'].map((label, i) => {
                  const key = ['currentStock', 'minStock', 'maxStock'][i] as keyof InventoryItem;
                  return (
                    <div key={label}>
                      <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">{label}</label>
                      <input type="number" min="0" step="0.01" value={(newItem as any)[key] || ''} onChange={e => setNewItem(p => ({ ...p, [key]: Number(e.target.value) }))}
                        className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)]" required />
                    </div>
                  );
                })}
              </div>
              <AppButton type="submit" variant="primary" className="w-full mt-4" size="lg">Register Ingredient</AppButton>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelectedItem(null)}>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-md overflow-hidden shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--background)]">
              <h3 className="font-bold text-lg m-0">Adjust: {selectedItem.itemName}</h3>
              <button onClick={() => setSelectedItem(null)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><X size={20} /></button>
            </div>
            <form onSubmit={handleAdjust} className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Adjustment Type</label>
                  <select value={adjustType} onChange={e => setAdjustType(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)]">
                    <option value="RESTOCK">Restock (Add)</option>
                    <option value="WASTE">Waste (Deduct)</option>
                    <option value="ADJUST">Inventory Count (Set)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Quantity ({selectedItem.unit})</label>
                  <input type="number" step="0.01" min="0.01" value={adjustQty || ''} onChange={e => setAdjustQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)]" required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Reason / Remarks</label>
                <input type="text" value={adjustReason} onChange={e => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)]" placeholder="e.g. Weekly Restock, Spoiled patty" required />
              </div>
              <AppButton type="submit" variant="primary" className="w-full mt-4" size="lg">Register Adjustment</AppButton>
            </form>
          </div>
        </div>
      )}
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
