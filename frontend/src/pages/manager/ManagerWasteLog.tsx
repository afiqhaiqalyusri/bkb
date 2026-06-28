import React, { useState, useEffect } from 'react';
import { Trash2, Calendar, Search, AlertCircle, PackageX, DollarSign } from 'lucide-react';
import { ManagerLayout } from '../../components/layout/ManagerLayout';
import { wasteService } from '../../services/manager.service';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { formatRM } from '../../utils/formatCurrency';

// UI Components
import { AppCard } from '../../components/ui/AppCard';
import { AppStatCard } from '../../components/ui/AppStatCard';
import { AppTable, Column } from '../../components/ui/AppTable';
import { AppEmptyState } from '../../components/ui/AppEmptyState';
import { AppPageHeader } from '../../components/ui/AppPageHeader';
import { AppButton } from '../../components/ui/AppButton';

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

export const WasteContent: React.FC = () => {
  const [entries, setEntries] = useState<WasteEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [from, setFrom] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  
  const [to, setTo] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  
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

  const cols: Column<WasteEntry>[] = [
    { 
      header: 'Date', 
      render: (e) => <span className="text-sm text-[var(--text-secondary)]">{new Date(e.createdAt).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })}</span> 
    },
    { 
      header: 'Ingredient', 
      accessor: 'inventoryName',
      render: (e) => <span className="font-semibold">{e.inventoryName}</span>
    },
    { 
      header: 'Quantity', 
      render: (e) => <span className="font-bold text-[var(--danger)]">{e.quantity} <span className="font-normal text-xs text-[var(--text-secondary)]">{e.unit}</span></span> 
    },
    { 
      header: 'Cost', 
      render: (e) => <span className="font-bold text-[var(--danger)]">{e.transactionCost ? formatRM(e.transactionCost) : '-'}</span> 
    },
    { 
      header: 'Reason', 
      render: (e) => <span className="text-sm text-[var(--text-secondary)]">{e.reason || '—'}</span> 
    },
    { 
      header: 'Logged By', 
      accessor: 'loggedBy',
      render: (e) => <span className="text-sm">{e.loggedBy}</span>
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <AppPageHeader 
        title="Waste Log" 
        subtitle="Track discarded inventory items, monitor waste costs, and identify patterns."
      />

      <AppCard noPadding>
        <div className="px-6 py-4 flex flex-col md:flex-row flex-wrap gap-4 items-end md:items-center">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Calendar size={18} className="text-[var(--primary)] shrink-0" />
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              className="px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)] w-full md:w-auto" />
            <span className="text-sm text-[var(--text-secondary)] shrink-0">to</span>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              className="px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)] w-full md:w-auto" />
            <AppButton onClick={load} variant="primary" className="shrink-0">Apply</AppButton>
          </div>
          
          <div className="relative w-full md:w-64 md:ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={16} />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search ingredient or reason..."
              className="w-full pl-9 pr-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)]"
            />
          </div>
        </div>
      </AppCard>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AppStatCard title="Total Entries" value={filtered.length} icon={AlertCircle} colorClass="text-[var(--danger)]" />
        <AppStatCard title="Total Items Wasted" value={totalQty.toFixed(1)} icon={PackageX} colorClass="text-[var(--warning)]" />
        <AppStatCard title="Total Wasted Cost" value={formatRM(totalCost)} icon={DollarSign} colorClass="text-[var(--danger)]" />
      </div>

      <AppCard noPadding>
        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-8">
            <AppEmptyState
              title="No waste entries found"
              description="There are no waste logs matching your current filters."
              icon={Trash2}
            />
          </div>
        ) : (
          <AppTable columns={cols} data={filtered} keyExtractor={(e) => e.id} />
        )}
      </AppCard>
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
