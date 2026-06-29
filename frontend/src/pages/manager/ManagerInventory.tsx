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
import { AppEmptyState } from '../../components/ui/AppEmptyState';
import { formControlClass } from '../../components/ui/AppFormField';

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
    { header: 'Category', render: (i) => <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50 border border-slate-100 dark:bg-slate-900 dark:border-slate-800 px-2 py-0.5 rounded-md">{i.category}</span> },
    { header: 'Current Stock', render: (i) => <span className="font-extrabold text-slate-800 dark:text-white">{i.currentStock} <span className="font-medium text-slate-400 text-[11px] uppercase tracking-wider">{i.unit}</span></span> },
    { header: 'Min Threshold', render: (i) => <span className="text-slate-400 font-semibold">{i.minStock} {i.unit}</span> },
    { header: 'Est. Days Left', render: (i) => <span className={`font-bold ${(i.estimatedDaysRemaining ?? 0) <= 3 ? 'text-red-500' : 'text-slate-500'}`}>{i.estimatedDaysRemaining !== null ? `${i.estimatedDaysRemaining} days` : '—'}</span> },
    { header: 'Status', render: (i) => <AppBadge variant={i.status === 'CRITICAL' ? 'danger' : i.status === 'LOW' ? 'warning' : 'success'} text={i.status} /> },
    { header: '', render: (i) => <AppButton variant="secondary" size="sm" icon={Sliders} onClick={() => setSelectedItem(i)} className="text-xs font-bold uppercase tracking-wider">Adjust</AppButton>, align: 'right' },
  ];

  return (
    <div className="flex flex-col gap-6">
      
      {/* Search & Actions Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm shrink-0">
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-white">Ingredient Inventory</h2>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold mt-0.5">Control raw material stock levels</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <AppButton variant="secondary" size="sm" onClick={loadInventory} icon={RefreshCw} className="flex-1 sm:flex-initial text-xs uppercase tracking-wider font-bold">Refresh</AppButton>
          <AppButton variant="primary" size="sm" onClick={() => setIsAdding(true)} icon={Plus} className="flex-1 sm:flex-initial text-xs uppercase tracking-wider font-bold">Add Raw Item</AppButton>
        </div>
      </div>

      {/* Summary StatCards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <AppStatCard title="Total Inventory Items" value={summary.total} icon={Package} colorClass="text-sky-500" />
        <AppStatCard title="Low Stock Warns" value={summary.low} icon={AlertTriangle} colorClass="text-amber-500" />
        <AppStatCard title="Critical Stock Alerts" value={summary.critical} icon={AlertCircle} colorClass="text-red-500" />
      </div>

      {/* Inventory Table Card */}
      <AppCard noPadding>
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/85 flex gap-2">
          {(['ALL', 'LOW'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
                activeTab === t 
                  ? t === 'LOW' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20' : 'bg-orange-50 text-primary dark:bg-orange-950/20'
                  : 'bg-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900'
              }`}>
              {t === 'ALL' ? `All Items (${summary.total})` : `Alerts Only (${summary.low + summary.critical})`}
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
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setIsAdding(false)}>
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/40">
              <h3 className="font-bold text-sm uppercase tracking-wider text-slate-700 dark:text-slate-300">Add Raw Ingredient</h3>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <form onSubmit={handleAdd} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Ingredient Name</label>
                <input type="text" value={newItem.itemName || ''} onChange={e => setNewItem(p => ({ ...p, itemName: e.target.value }))}
                  className={formControlClass} placeholder="e.g. Sesame Seed Bun" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Category</label>
                  <select value={newItem.category || 'Meat'} onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))}
                    className={formControlClass}>
                    {['Meat', 'Bread', 'Vegetables', 'Dairy', 'Condiments', 'Cooking', 'Dry Goods'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Unit</label>
                  <input type="text" value={newItem.unit || ''} onChange={e => setNewItem(p => ({ ...p, unit: e.target.value }))}
                    className={formControlClass} placeholder="e.g. pcs, kg, L" required />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {['Current Stock', 'Min Stock', 'Max Stock'].map((label, i) => {
                  const key = ['currentStock', 'minStock', 'maxStock'][i] as keyof InventoryItem;
                  return (
                    <div key={label}>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{label}</label>
                      <input type="number" min="0" step="0.01" value={(newItem as any)[key] || ''} onChange={e => setNewItem(p => ({ ...p, [key]: Number(e.target.value) }))}
                        className={formControlClass} required />
                    </div>
                  );
                })}
              </div>
              <AppButton type="submit" variant="primary" className="w-full mt-4 py-3 text-xs uppercase tracking-wider font-bold">Register Ingredient</AppButton>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedItem(null)}>
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/40">
              <h3 className="font-bold text-sm uppercase tracking-wider text-slate-700 dark:text-slate-300">Adjust: {selectedItem.itemName}</h3>
              <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <form onSubmit={handleAdjust} className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Adjustment Type</label>
                  <select value={adjustType} onChange={e => setAdjustType(e.target.value)}
                    className={formControlClass}>
                    <option value="RESTOCK">Restock (Add)</option>
                    <option value="WASTE">Waste (Deduct)</option>
                    <option value="ADJUST">Inventory Count (Set)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Quantity ({selectedItem.unit})</label>
                  <input type="number" step="0.01" min="0.01" value={adjustQty || ''} onChange={e => setAdjustQty(Number(e.target.value))}
                    className={formControlClass} required />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Reason / Remarks</label>
                <input type="text" value={adjustReason} onChange={e => setAdjustReason(e.target.value)}
                  className={formControlClass} placeholder="e.g. Weekly Shipment, Spill damage" required />
              </div>
              <AppButton type="submit" variant="primary" className="w-full mt-4 py-3 text-xs uppercase tracking-wider font-bold">Register Adjustment</AppButton>
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
