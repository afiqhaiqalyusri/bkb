import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Star, Plus, Edit2, Trash2, X, Search, ShoppingBag,
  Calendar, MessageSquare, Award, AlertCircle, TrendingUp, TrendingDown, Clock
} from 'lucide-react';
import { ManagerLayout } from '../../components/layout/ManagerLayout';
import { staffService, loyaltyManagerService } from '../../services/manager.service';
import { menuService } from '../../services/menu.service';
import { orderService } from '../../services/order.service';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorState } from '../../components/ui/ErrorState';
import { formatRM } from '../../utils/formatCurrency';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { useConfirmation } from '../../components/ConfirmationProvider';
import { useUnsavedChangesBlocker } from '../../hooks/useUnsavedChangesBlocker';

// UI Components
import { AppCard } from '../../components/ui/AppCard';
import { AppButton } from '../../components/ui/AppButton';
import { AppBadge } from '../../components/ui/AppBadge';
import { AppEmptyState } from '../../components/ui/AppEmptyState';
import { AppPageHeader } from '../../components/ui/AppPageHeader';
import { AppTable, Column } from '../../components/ui/AppTable';

interface StaffUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'CUSTOMER' | 'STAFF' | 'MANAGER' | 'GUEST' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
}

interface Reward {
  id: number;
  name: string;
  pointsCost: number;
  isActive: boolean;
  menuItemId?: number | null;
  menuItemName?: string | null;
  menuItemImageUrl?: string | null;
  description?: string | null;
  imageUrl?: string | null;
}

interface LoyaltyAccount {
  id: number;
  userName: string;
  userEmail: string;
  points: number;
  totalEarned: number;
  phone?: string;
  userRole?: string;
}

export const ManagerLoyalty: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { confirm } = useConfirmation();

  const [activeTab, setActiveTab] = useState('points');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [users, setUsers] = useState<StaffUser[]>([]);
  const [accounts, setAccounts] = useState<LoyaltyAccount[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);

  const [search, setSearch] = useState('');
  const [sortByCustomers, setSortByCustomers] = useState<'name-asc' | 'name-desc' | 'points-desc' | 'points-asc' | 'earned-desc'>('name-asc');

  const [showAddReward, setShowAddReward] = useState(false);
  const [showEditReward, setShowEditReward] = useState(false);

  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustAccount, setAdjustAccount] = useState<LoyaltyAccount | null>(null);
  const [adjustPoints, setAdjustPoints] = useState(0);
  const [adjustType, setAdjustType] = useState<'ADD' | 'DEDUCT'>('ADD');
  const [adjustReason, setAdjustReason] = useState('');
  const [submittingAdjust, setSubmittingAdjust] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState<StaffUser | null>(null);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);

  const [newRewardName, setNewRewardName] = useState('');
  const [newRewardCost, setNewRewardCost] = useState(100);
  const [newRewardMenuItemId, setNewRewardMenuItemId] = useState<number | null>(null);
  const [newRewardDescription, setNewRewardDescription] = useState('');
  const [newRewardImageUrl, setNewRewardImageUrl] = useState('');

  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [editRewardName, setEditRewardName] = useState('');
  const [editRewardCost, setEditRewardCost] = useState(100);
  const [editRewardMenuItemId, setEditRewardMenuItemId] = useState<number | null>(null);
  const [editRewardDescription, setEditRewardDescription] = useState('');
  const [editRewardImageUrl, setEditRewardImageUrl] = useState('');

  const isDirty =
    (showAddReward && (newRewardName !== '' || newRewardCost !== 100 || newRewardMenuItemId !== null || newRewardDescription !== '' || newRewardImageUrl !== '')) ||
    (showEditReward && editingReward && (editRewardName !== editingReward.name || editRewardCost !== editingReward.pointsCost || editRewardMenuItemId !== (editingReward.menuItemId || null) || editRewardDescription !== (editingReward.description || '') || editRewardImageUrl !== (editingReward.imageUrl || ''))) ||
    (showAdjust && (adjustPoints !== 0 || adjustReason !== ''));

  useUnsavedChangesBlocker(isDirty);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam) {
      const clean = tabParam.toLowerCase();
      if (clean === 'rewards' || clean === 'catalog') setActiveTab('rewards');
      else setActiveTab('points');
    }
  }, [location]);

  const loadAll = () => {
    setLoading(true); setError(false);
    Promise.all([staffService.getAll(), loyaltyManagerService.getAllAccounts(), loyaltyManagerService.getAllRewards(), menuService.getAllItems(), orderService.getAll()])
      .then(([sRes, accsRes, rewardsRes, menuRes, ordersRes]) => {
        setUsers(sRes.data); setAccounts(accsRes.data); setRewards(rewardsRes.data); setMenuItems(menuRes.data); setAllOrders(ordersRes.data || []);
      })
      .catch(() => { setError(true); toast.error('Failed to load loyalty dashboard data'); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAll(); }, []);

  const openAdjustPoints = (u: StaffUser) => {
    let acc = accounts.find(a => a.userEmail.toLowerCase() === u.email.toLowerCase());
    if (!acc) acc = { id: 0, userName: u.name, userEmail: u.email, points: 0, totalEarned: 0 };
    setAdjustAccount(acc); setAdjustPoints(0); setAdjustType('ADD'); setAdjustReason(''); setShowAdjust(true);
  };

  const handleAdjustPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustAccount) return;

    const amount = adjustType === 'DEDUCT' ? -Math.abs(adjustPoints) : Math.abs(adjustPoints);
    const confirmed = await confirm({
      title: amount >= 0 ? 'Add Loyalty Points' : 'Deduct Loyalty Points',
      message: `${amount >= 0 ? 'Add' : 'Deduct'} ${Math.abs(amount)} points for ${adjustAccount.userName}?`,
      details: `Reason: ${adjustReason}`,
      confirmLabel: amount >= 0 ? 'Add Points' : 'Deduct Points',
      cancelLabel: 'Cancel',
      type: amount >= 0 ? 'info' : 'danger'
    });
    if (!confirmed) return;

    setSubmittingAdjust(true);
    try {
      await loyaltyManagerService.adjustPoints(adjustAccount.id, amount, adjustReason);
      toast.success('Loyalty points adjusted successfully!'); setShowAdjust(false); loadAll();
    } catch { toast.error('Failed to adjust points'); } 
    finally { setSubmittingAdjust(false); }
  };

  const handleOpenOrderHistory = (u: StaffUser) => {
    setSelectedCustomer(u);
    setCustomerOrders(allOrders.filter(o => (o.user && o.user.email?.toLowerCase() === u.email?.toLowerCase()) || (o.guestPhone && o.guestPhone === u.phone) || (o.user && o.user.name === u.name)));
  };

  const handleSelectMenuItemForNewReward = (itemId: number | null) => {
    setNewRewardMenuItemId(itemId);
    if (itemId) {
      const selected = menuItems.find(m => m.id === itemId);
      if (selected) {
        setNewRewardName(`Free ${selected.name}`);
        setNewRewardDescription(`Redeem a free serving of our premium ${selected.name}`);
        setNewRewardImageUrl(selected.imageUrl || '');
        setNewRewardCost(Math.round(selected.price * 10));
      }
    } else {
      setNewRewardName(''); setNewRewardDescription(''); setNewRewardImageUrl(''); setNewRewardCost(100);
    }
  };

  const handleSelectMenuItemForEditReward = (itemId: number | null) => {
    setEditRewardMenuItemId(itemId);
    if (itemId) {
      const selected = menuItems.find(m => m.id === itemId);
      if (selected) {
        setEditRewardName(`Free ${selected.name}`);
        setEditRewardDescription(`Redeem a free serving of our premium ${selected.name}`);
        setEditRewardImageUrl(selected.imageUrl || '');
        setEditRewardCost(Math.round(selected.price * 10));
      }
    }
  };

  const handleCreateReward = async (e: React.FormEvent) => {
    e.preventDefault();
    const confirmed = await confirm({ title: 'Create Reward Voucher', message: `Add the reward "${newRewardName}"?`, confirmLabel: 'Create', cancelLabel: 'Cancel', type: 'info' });
    if (!confirmed) return;
    try {
      await loyaltyManagerService.createReward(newRewardName, newRewardCost, newRewardMenuItemId, newRewardDescription || null, newRewardImageUrl || null);
      toast.success('Voucher added successfully'); setShowAddReward(false);
      setNewRewardName(''); setNewRewardCost(100); setNewRewardMenuItemId(null); setNewRewardDescription(''); setNewRewardImageUrl('');
      loadAll();
    } catch { toast.error('Failed to create reward voucher'); }
  };

  const openEditReward = (r: Reward) => {
    setEditingReward(r); setEditRewardName(r.name); setEditRewardCost(r.pointsCost); setEditRewardMenuItemId(r.menuItemId || null);
    setEditRewardDescription(r.description || ''); setEditRewardImageUrl(r.imageUrl || ''); setShowEditReward(true);
  };

  const handleUpdateReward = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editingReward) return;
    const confirmed = await confirm({ title: 'Save Voucher Changes', message: `Save changes for reward "${editRewardName}"?`, confirmLabel: 'Save', cancelLabel: 'Cancel', type: 'warning' });
    if (!confirmed) return;
    try {
      await loyaltyManagerService.updateReward(editingReward.id, { name: editRewardName, pointsCost: editRewardCost, menuItemId: editRewardMenuItemId, description: editRewardDescription || null, imageUrl: editRewardImageUrl || null });
      toast.success('Reward voucher updated'); setShowEditReward(false); loadAll();
    } catch { toast.error('Failed to update reward'); }
  };

  const handleToggleReward = async (r: Reward) => {
    const confirmed = await confirm({ title: r.isActive ? 'Deactivate Voucher' : 'Activate Voucher', message: `${r.isActive ? 'Deactivate' : 'Activate'} the reward "${r.name}"?`, confirmLabel: r.isActive ? 'Deactivate' : 'Activate', cancelLabel: 'Cancel', type: 'warning' });
    if (!confirmed) return;
    try { await loyaltyManagerService.updateReward(r.id, { isActive: !r.isActive }); toast.success(r.isActive ? 'Voucher deactivated' : 'Voucher activated'); loadAll(); } 
    catch { toast.error('Failed to toggle status'); }
  };

  const handleDeleteReward = async (id: number) => {
    const reward = rewards.find(r => r.id === id);
    const confirmed = await confirm({ title: 'Delete Reward Voucher', message: `Delete "${reward?.name}"?`, details: 'This catalog entry will be permanently removed.', confirmLabel: 'Delete Voucher', cancelLabel: 'Cancel', type: 'danger' });
    if (!confirmed) return;
    try { await loyaltyManagerService.deleteReward(id); toast.success('Reward deleted'); loadAll(); } 
    catch { toast.error('Failed to delete reward'); }
  };

  const getPointsFor = (email: string) => { const acc = accounts.find(a => a.userEmail.toLowerCase() === email.toLowerCase()); return acc ? acc.points : 0; };
  const getLifetimePointsFor = (email: string) => { const acc = accounts.find(a => a.userEmail.toLowerCase() === email.toLowerCase()); return acc ? acc.totalEarned : 0; };

  const customersList = users.filter(u => u.role === 'CUSTOMER' || u.role === 'GUEST')
    .filter(u => { const q = search.toLowerCase(); return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.phone && u.phone.includes(q)); })
    .sort((a, b) => {
      if (sortByCustomers === 'name-asc') return a.name.localeCompare(b.name);
      if (sortByCustomers === 'name-desc') return b.name.localeCompare(a.name);
      if (sortByCustomers === 'points-desc') return getPointsFor(b.email) - getPointsFor(a.email);
      if (sortByCustomers === 'points-asc') return getPointsFor(a.email) - getPointsFor(b.email);
      if (sortByCustomers === 'earned-desc') return getLifetimePointsFor(b.email) - getLifetimePointsFor(a.email);
      return 0;
    });

  if (error) return <ManagerLayout title="Loyalty Program"><div className="flex items-center justify-center min-h-[50vh]"><ErrorState onRetry={loadAll} retrying={loading} /></div></ManagerLayout>;

  const cols: Column<StaffUser>[] = [
    {
      header: 'Customer Name',
      render: (c) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-bold text-xs shrink-0">
            {c.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-[var(--text-primary)]">{c.name}</div>
            <div className="text-xs text-[var(--text-secondary)]">Role: {c.role}</div>
          </div>
        </div>
      )
    },
    { header: 'Email', render: (c) => <span className="text-sm text-[var(--text-secondary)]">{c.email}</span> },
    { header: 'Phone', render: (c) => <span className="text-sm text-[var(--text-secondary)]">{c.phone || '—'}</span> },
    {
      header: 'Points Balance',
      align: 'right',
      render: (c) => (
        <>
          <span className="font-bold text-[var(--warning)] text-base">{getPointsFor(c.email).toLocaleString()}</span> <span className="text-xs text-[var(--text-secondary)]">pts</span>
        </>
      )
    },
    {
      header: 'Lifetime Points',
      align: 'right',
      render: (c) => (
        <span className="text-sm text-[var(--text-secondary)]">
          {getLifetimePointsFor(c.email).toLocaleString()} <span className="text-xs">pts</span>
        </span>
      )
    },
    {
      header: 'Status',
      render: (c) => <AppBadge variant={c.isActive ? 'success' : 'danger'} text={c.isActive ? 'ACTIVE' : 'SUSPENDED'} />
    },
    {
      header: 'Actions',
      align: 'right',
      render: (c) => {
        const totalOrdersCount = allOrders.filter(o => (o.user && o.user.email?.toLowerCase() === c.email?.toLowerCase()) || (o.user && o.user.name === c.name)).length;
        return (
          <div className="flex items-center justify-end gap-2">
            <AppButton variant="outline" size="sm" icon={ShoppingBag} onClick={() => handleOpenOrderHistory(c)}>Orders ({totalOrdersCount})</AppButton>
            <AppButton variant="outline" size="sm" icon={Award} onClick={() => openAdjustPoints(c)} className="border-[var(--warning)] text-[var(--warning)] hover:bg-[var(--warning)]/10">Adjust</AppButton>
          </div>
        );
      }
    }
  ];

  return (
    <ManagerLayout
      title="Loyalty Program"
      subtitle="Track customer loyalty balances, adjust points, and CRUD active rewards"
      tabs={[{ id: 'points', label: 'Points Balances' }, { id: 'rewards', label: 'Reward Catalog' }].map(t => ({ id: t.id, label: t.label, active: activeTab === t.id, onClick: () => { setActiveTab(t.id); setSearch(''); navigate(`/manager/loyalty?tab=${t.id}`); } }))}
    >
      {activeTab === 'points' && (
        <div className="flex flex-col gap-6">
          <AppCard className="!p-4" noPadding>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-6 py-4">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={16} />
                <input type="text" placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)]" />
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider shrink-0">Sort By</span>
                <select value={sortByCustomers} onChange={e => setSortByCustomers(e.target.value as any)}
                  className="px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)] w-full md:w-auto">
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="points-desc">Loyalty Points (High-Low)</option>
                  <option value="points-asc">Loyalty Points (Low-High)</option>
                  <option value="earned-desc">Lifetime Earned</option>
                </select>
              </div>
            </div>
          </AppCard>

          <AppCard noPadding>
            <AppTable 
              columns={cols}
              data={customersList}
              keyExtractor={(c) => c.id}
              loading={loading}
              emptyTitle="No customers found"
              emptyMessage="No customer profiles match your search criteria."
              emptyIcon={Award}
              rowClassName={(c) => !c.isActive ? 'opacity-60 grayscale-[0.5]' : ''}
            />
          </AppCard>
        </div>
      )}

      {activeTab === 'rewards' && (
        <div className="flex flex-col gap-6">
          <div className="flex justify-end">
            <AppButton variant="primary" icon={Plus} onClick={() => setShowAddReward(true)}>Add Reward Voucher</AppButton>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
          ) : (
            <div className="flex flex-col gap-4">
              {rewards.length === 0 && <AppEmptyState title="No rewards configured" description="There are no rewards configured in the catalog yet." icon={Star} />}
              {rewards.map(r => (
                <div key={r.id} className={`bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 md:px-6 md:py-5 flex flex-col md:flex-row items-start md:items-center gap-4 transition-all duration-200 ${r.isActive ? 'shadow-sm' : 'opacity-60'}`}>
                  <div className="flex items-center gap-4 flex-1">
                    {r.imageUrl || r.menuItemImageUrl ? (
                      <img src={r.imageUrl || r.menuItemImageUrl || ''} alt={r.name} className="w-12 h-12 rounded-lg object-cover bg-[var(--background)] shrink-0 border border-[var(--border)]" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center shrink-0 border border-[var(--primary)]/20">
                        <Star size={20} />
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-[var(--text-primary)]">{r.name}</div>
                      {r.description && <div className="text-sm text-[var(--text-secondary)] mt-0.5 line-clamp-1">{r.description}</div>}
                      <div className="text-xs text-[var(--text-secondary)] mt-1 font-medium flex items-center gap-1.5">
                        <span className="text-[var(--warning)] font-bold">{r.pointsCost} pts</span>
                        {r.menuItemName && <span className="bg-[var(--background)] px-1.5 py-0.5 rounded border border-[var(--border)]">Linked: {r.menuItemName}</span>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto mt-2 md:mt-0">
                    <AppBadge variant={r.isActive ? 'success' : 'neutral'} text={r.isActive ? 'ACTIVE' : 'INACTIVE'} />
                    <AppButton variant="outline" size="sm" onClick={() => handleToggleReward(r)}>{r.isActive ? 'Deactivate' : 'Activate'}</AppButton>
                    <div className="flex gap-1 ml-auto md:ml-0">
                      <AppButton variant="ghost" size="icon" onClick={() => openEditReward(r)}><Edit2 size={16} /></AppButton>
                      <AppButton variant="ghost" size="icon" onClick={() => handleDeleteReward(r.id)} className="text-[var(--danger)] hover:text-red-700 hover:bg-red-50"><Trash2 size={16} /></AppButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Reward Modals */}
      {(showAddReward || (showEditReward && editingReward)) && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => showAddReward ? setShowAddReward(false) : setShowEditReward(false)}>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-[var(--border)] flex justify-between items-center bg-gray-50 dark:bg-slate-800/50 shrink-0">
              <h3 className="font-bold text-lg m-0 flex items-center gap-2"><Star size={18} className="text-[var(--primary)]" /> {showAddReward ? 'Add New Voucher' : 'Edit Voucher'}</h3>
              <button onClick={() => showAddReward ? setShowAddReward(false) : setShowEditReward(false)} className="text-gray-400 hover:text-gray-700 dark:hover:text-white p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"><X size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <form onSubmit={showAddReward ? handleCreateReward : handleUpdateReward} className="flex flex-col gap-5">
                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Link to Existing Menu Item (Optional)</label>
                  <select
                    value={(showAddReward ? newRewardMenuItemId : editRewardMenuItemId) || ''}
                    onChange={e => showAddReward ? handleSelectMenuItemForNewReward(e.target.value ? Number(e.target.value) : null) : handleSelectMenuItemForEditReward(e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
                  >
                    <option value="">-- No linked menu item --</option>
                    {menuItems.map(item => (
                      <option key={item.id} value={item.id}>{item.name} ({item.category}) - {formatRM(item.price)}</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-1.5 italic">Selecting an item auto-fills details and calculates points cost.</p>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Voucher Name *</label>
                  <input value={showAddReward ? newRewardName : editRewardName} onChange={e => showAddReward ? setNewRewardName(e.target.value) : setEditRewardName(e.target.value)} required placeholder="e.g. Free Burger Ayam Special" className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)] transition-colors" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Points Cost *</label>
                  <input type="number" min="1" value={showAddReward ? newRewardCost : editRewardCost} onChange={e => showAddReward ? setNewRewardCost(Number(e.target.value)) : setEditRewardCost(Number(e.target.value))} required className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)] transition-colors" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Description (Optional)</label>
                  <textarea value={showAddReward ? newRewardDescription : editRewardDescription} onChange={e => showAddReward ? setNewRewardDescription(e.target.value) : setEditRewardDescription(e.target.value)} placeholder="Details about what the customer gets..." rows={3} className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)] resize-y transition-colors" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Image URL (Optional)</label>
                  <input value={showAddReward ? newRewardImageUrl : editRewardImageUrl} onChange={e => showAddReward ? setNewRewardImageUrl(e.target.value) : setEditRewardImageUrl(e.target.value)} placeholder="https://..." className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)] transition-colors" />
                </div>
                <AppButton type="submit" variant="primary" className="w-full mt-2" size="lg">{showAddReward ? 'Create Reward' : 'Update Reward'}</AppButton>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Points Modal */}
      {showAdjust && adjustAccount && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowAdjust(false)}>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-[var(--border)] flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-lg m-0 flex items-center gap-2"><Award size={18} className="text-[var(--primary)]" /> Adjust Loyalty Points</h3>
              <button onClick={() => setShowAdjust(false)} className="text-gray-400 hover:text-gray-700 dark:hover:text-white p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"><X size={20} /></button>
            </div>
            <div className="p-6 flex flex-col gap-5">
              <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-4 flex flex-col gap-1.5">
                <div className="text-sm"><strong>User:</strong> {adjustAccount.userName}</div>
                <div className="text-sm"><strong>Current Balance:</strong> <span className="font-bold text-[var(--warning)]">{adjustAccount.points} pts</span></div>
              </div>
              <form onSubmit={handleAdjustPoints} className="flex flex-col gap-5">
                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Action</label>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setAdjustType('ADD')} className={`flex-1 py-2.5 px-4 rounded-lg border flex items-center justify-center gap-2 text-sm font-bold transition-colors ${adjustType === 'ADD' ? 'bg-[var(--success)]/10 border-[var(--success)] text-[var(--success)]' : 'bg-[var(--background)] border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface)]'}`}>
                      <TrendingUp size={16} /> Add Points
                    </button>
                    <button type="button" onClick={() => setAdjustType('DEDUCT')} className={`flex-1 py-2.5 px-4 rounded-lg border flex items-center justify-center gap-2 text-sm font-bold transition-colors ${adjustType === 'DEDUCT' ? 'bg-[var(--danger)]/10 border-[var(--danger)] text-[var(--danger)]' : 'bg-[var(--background)] border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface)]'}`}>
                      <TrendingDown size={16} /> Deduct Points
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Amount</label>
                  <input type="number" min="1" value={adjustPoints} onChange={e => setAdjustPoints(Math.abs(Number(e.target.value)))} required placeholder="e.g. 50" className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)] transition-colors" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Reason</label>
                  <input value={adjustReason} onChange={e => setAdjustReason(e.target.value)} required placeholder="e.g. Compensation for delay" className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)] transition-colors" />
                </div>
                <AppButton type="submit" variant="primary" disabled={submittingAdjust} className="w-full mt-2" size="lg">{submittingAdjust ? 'Adjusting...' : 'Apply Adjustment'}</AppButton>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Customer Orders Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedCustomer(null)}>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-[var(--border)] flex justify-between items-center bg-gray-50 dark:bg-slate-800/50 shrink-0">
              <div>
                <h3 className="font-bold text-lg m-0 flex items-center gap-2"><ShoppingBag size={18} className="text-[var(--primary)]" /> Customer Purchase History</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1 mb-0">Purchases for <span className="font-bold text-[var(--text-primary)]">{selectedCustomer.name}</span> ({selectedCustomer.email})</p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="text-gray-400 hover:text-gray-700 dark:hover:text-white p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"><X size={20} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4 bg-[var(--background)]">
              {customerOrders.length === 0 ? (
                <div className="flex justify-center py-12"><AppEmptyState title="No orders found" description="This customer hasn't placed any orders yet." icon={ShoppingBag} /></div>
              ) : (
                customerOrders.map(order => (
                  <div key={order.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex flex-col gap-3 shadow-sm hover:border-[var(--primary)]/30 transition-colors">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <span className="font-bold text-sm font-mono text-[var(--text-primary)]">#{order.orderNumber}</span>
                      <AppBadge variant={order.status === 'READY' || order.status === 'COMPLETED' ? 'success' : 'warning'} text={order.status} />
                    </div>
                    
                    <div className="flex flex-wrap gap-3 text-xs text-[var(--text-secondary)]">
                      <span className="flex items-center gap-1.5"><Calendar size={12} /> {new Date(order.createdAt).toLocaleString('en-MY')}</span>
                      {order.pickupTime && <span className="flex items-center gap-1.5"><Clock size={12} /> Pickup: {new Date(order.pickupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                    </div>

                    {order.notes && (
                      <div className="text-xs bg-[var(--danger)]/10 text-[var(--danger)] px-3 py-2 rounded-lg italic flex items-center gap-2">
                        <MessageSquare size={12} /> Note: "{order.notes}"
                      </div>
                    )}

                    <div className="border-t border-dashed border-[var(--border)] my-1" />

                    <div className="flex flex-col gap-2">
                      {order.items?.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-[var(--text-primary)]">{item.quantity}x {item.menuItem?.name || 'Item'}</span>
                          <span className="font-bold text-[var(--text-primary)]">{item.isFree ? 'FREE' : formatRM(item.unitPrice * item.quantity)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-[var(--border)] pt-3 mt-1 flex justify-between items-center">
                      <span className="text-xs font-bold text-[var(--text-secondary)]">Total Paid ({order.paymentMethod}):</span>
                      <span className="font-black text-lg text-[var(--primary)]">{formatRM(order.total)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </ManagerLayout>
  );
};
