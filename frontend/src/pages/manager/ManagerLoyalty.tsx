import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Star, Plus, Edit2, Trash2, X, Search, ShoppingBag,
  Calendar, MessageSquare, Award, AlertCircle
} from 'lucide-react';
import { ManagerLayout } from './ManagerDashboard';
import { staffService, loyaltyManagerService } from '../../services/manager.service';
import { menuService } from '../../services/menu.service';
import { orderService } from '../../services/order.service';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatRM } from '../../utils/formatCurrency';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { useConfirmation } from '../../components/ConfirmationProvider';
import { useUnsavedChangesBlocker } from '../../hooks/useUnsavedChangesBlocker';

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

  // Lists from services
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [accounts, setAccounts] = useState<LoyaltyAccount[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [sortByCustomers, setSortByCustomers] = useState<'name-asc' | 'name-desc' | 'points-desc' | 'points-asc' | 'earned-desc'>('name-asc');

  // Modals visibility triggers
  const [showAddReward, setShowAddReward] = useState(false);
  const [showEditReward, setShowEditReward] = useState(false);

  // Adjust Points Form State
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustAccount, setAdjustAccount] = useState<LoyaltyAccount | null>(null);
  const [adjustPoints, setAdjustPoints] = useState(0);
  const [adjustType, setAdjustType] = useState<'ADD' | 'DEDUCT'>('ADD');
  const [adjustReason, setAdjustReason] = useState('');
  const [submittingAdjust, setSubmittingAdjust] = useState(false);

  // Customer Orders Modal State
  const [selectedCustomer, setSelectedCustomer] = useState<StaffUser | null>(null);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);

  // Add Reward Form State
  const [newRewardName, setNewRewardName] = useState('');
  const [newRewardCost, setNewRewardCost] = useState(100);
  const [newRewardMenuItemId, setNewRewardMenuItemId] = useState<number | null>(null);
  const [newRewardDescription, setNewRewardDescription] = useState('');
  const [newRewardImageUrl, setNewRewardImageUrl] = useState('');

  // Edit Reward Form State
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [editRewardName, setEditRewardName] = useState('');
  const [editRewardCost, setEditRewardCost] = useState(100);
  const [editRewardMenuItemId, setEditRewardMenuItemId] = useState<number | null>(null);
  const [editRewardDescription, setEditRewardDescription] = useState('');
  const [editRewardImageUrl, setEditRewardImageUrl] = useState('');

  // Unsaved changes blocker check
  const isDirty =
    (showAddReward && (newRewardName !== '' || newRewardCost !== 100 || newRewardMenuItemId !== null || newRewardDescription !== '' || newRewardImageUrl !== '')) ||
    (showEditReward && editingReward && (editRewardName !== editingReward.name || editRewardCost !== editingReward.pointsCost || editRewardMenuItemId !== (editingReward.menuItemId || null) || editRewardDescription !== (editingReward.description || '') || editRewardImageUrl !== (editingReward.imageUrl || ''))) ||
    (showAdjust && (adjustPoints !== 0 || adjustReason !== ''));

  useUnsavedChangesBlocker(isDirty);

  // Sync tab state from query parameter ?tab=
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam) {
      const clean = tabParam.toLowerCase();
      if (clean === 'rewards' || clean === 'catalog') {
        setActiveTab('rewards');
      } else {
        setActiveTab('points');
      }
    }
  }, [location]);

  const loadAll = () => {
    setLoading(true);
    setError(false);
    Promise.all([
      staffService.getAll(),
      loyaltyManagerService.getAllAccounts(),
      loyaltyManagerService.getAllRewards(),
      menuService.getAllItems(),
      orderService.getAll()
    ]).then(([sRes, accsRes, rewardsRes, menuRes, ordersRes]) => {
      setUsers(sRes.data);
      setAccounts(accsRes.data);
      setRewards(rewardsRes.data);
      setMenuItems(menuRes.data);
      setAllOrders(ordersRes.data || []);
      setError(false);
    }).catch(err => {
      setError(true);
      toast.error('Failed to load loyalty dashboard data');
      console.error(err);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAll();
  }, []);

  const openAdjustPoints = (u: StaffUser) => {
    let acc = accounts.find(a => a.userEmail.toLowerCase() === u.email.toLowerCase());
    if (!acc) {
      acc = { id: 0, userName: u.name, userEmail: u.email, points: 0, totalEarned: 0 };
    }
    setAdjustAccount(acc);
    setAdjustPoints(0);
    setAdjustType('ADD');
    setAdjustReason('');
    setShowAdjust(true);
  };

  const handleAdjustPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustAccount) return;

    if (adjustType === 'DEDUCT' && user?.role !== 'ADMIN') {
      toast.error('Only Admins are permitted to deduct points');
      return;
    }

    const amount = adjustType === 'DEDUCT' ? -Math.abs(adjustPoints) : Math.abs(adjustPoints);
    const actionStr = amount >= 0 ? `add ${amount}` : `deduct ${Math.abs(amount)}`;

    const confirmed = await confirm({
      title: amount >= 0 ? 'Add Loyalty Points' : 'Deduct Loyalty Points',
      message: `Are you sure you want to ${actionStr} points for ${adjustAccount.userName}?`,
      details: `Reason: ${adjustReason}`,
      confirmLabel: amount >= 0 ? 'Add Points' : 'Deduct Points',
      cancelLabel: 'Cancel',
      type: amount >= 0 ? 'info' : 'danger'
    });
    if (!confirmed) return;

    setSubmittingAdjust(true);
    try {
      await loyaltyManagerService.adjustPoints(adjustAccount.id, amount, adjustReason);
      toast.success('Loyalty points adjusted successfully!');
      setShowAdjust(false);
      loadAll();
    } catch {
      toast.error('Failed to adjust points');
    } finally {
      setSubmittingAdjust(false);
    }
  };

  const handleOpenOrderHistory = (u: StaffUser) => {
    setSelectedCustomer(u);
    const filtered = allOrders.filter(o =>
      (o.user && o.user.email?.toLowerCase() === u.email?.toLowerCase()) ||
      (o.guestPhone && o.guestPhone === u.phone) ||
      (o.user && o.user.name === u.name)
    );
    setCustomerOrders(filtered);
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
      setNewRewardName('');
      setNewRewardDescription('');
      setNewRewardImageUrl('');
      setNewRewardCost(100);
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
    const confirmed = await confirm({
      title: 'Create Reward Voucher',
      message: `Are you sure you want to add the reward "${newRewardName}"?`,
      confirmLabel: 'Create',
      cancelLabel: 'Cancel',
      type: 'info'
    });
    if (!confirmed) return;
    try {
      await loyaltyManagerService.createReward(newRewardName, newRewardCost, newRewardMenuItemId, newRewardDescription || null, newRewardImageUrl || null);
      toast.success('Voucher added successfully');
      setShowAddReward(false);
      setNewRewardName(''); setNewRewardCost(100); setNewRewardMenuItemId(null); setNewRewardDescription(''); setNewRewardImageUrl('');
      loadAll();
    } catch {
      toast.error('Failed to create reward voucher');
    }
  };

  const openEditReward = (r: Reward) => {
    setEditingReward(r);
    setEditRewardName(r.name);
    setEditRewardCost(r.pointsCost);
    setEditRewardMenuItemId(r.menuItemId || null);
    setEditRewardDescription(r.description || '');
    setEditRewardImageUrl(r.imageUrl || '');
    setShowEditReward(true);
  };

  const handleUpdateReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReward) return;
    const confirmed = await confirm({
      title: 'Save Voucher Changes',
      message: `Save changes for reward "${editRewardName}"?`,
      confirmLabel: 'Save',
      cancelLabel: 'Cancel',
      type: 'warning'
    });
    if (!confirmed) return;
    try {
      await loyaltyManagerService.updateReward(editingReward.id, {
        name: editRewardName,
        pointsCost: editRewardCost,
        menuItemId: editRewardMenuItemId,
        description: editRewardDescription || null,
        imageUrl: editRewardImageUrl || null
      });
      toast.success('Reward voucher updated');
      setShowEditReward(false);
      loadAll();
    } catch {
      toast.error('Failed to update reward');
    }
  };

  const handleToggleReward = async (r: Reward) => {
    const actionStr = r.isActive ? 'deactivate' : 'activate';
    const confirmed = await confirm({
      title: r.isActive ? 'Deactivate Voucher' : 'Activate Voucher',
      message: `Are you sure you want to ${actionStr} the reward "${r.name}"?`,
      confirmLabel: r.isActive ? 'Deactivate' : 'Activate',
      cancelLabel: 'Cancel',
      type: 'warning'
    });
    if (!confirmed) return;
    try {
      await loyaltyManagerService.updateReward(r.id, { isActive: !r.isActive });
      toast.success(r.isActive ? 'Voucher deactivated' : 'Voucher activated');
      loadAll();
    } catch {
      toast.error('Failed to toggle status');
    }
  };

  const handleDeleteReward = async (id: number) => {
    const reward = rewards.find(r => r.id === id);
    const confirmed = await confirm({
      title: 'Delete Reward Voucher',
      message: `Are you sure you want to delete "${reward?.name}"?`,
      details: 'This catalog entry will be permanently removed.',
      confirmLabel: 'Delete Voucher',
      cancelLabel: 'Cancel',
      type: 'danger'
    });
    if (!confirmed) return;
    try {
      await loyaltyManagerService.deleteReward(id);
      toast.success('Reward deleted');
      loadAll();
    } catch {
      toast.error('Failed to delete reward');
    }
  };

  const getPointsFor = (email: string) => {
    const acc = accounts.find(a => a.userEmail.toLowerCase() === email.toLowerCase());
    return acc ? acc.points : 0;
  };

  const getLifetimePointsFor = (email: string) => {
    const acc = accounts.find(a => a.userEmail.toLowerCase() === email.toLowerCase());
    return acc ? acc.totalEarned : 0;
  };

  const customersList = users
    .filter(u => u.role === 'CUSTOMER' || u.role === 'GUEST')
    .filter(u => {
      const q = search.toLowerCase();
      return u.name.toLowerCase().includes(q) ||
             u.email.toLowerCase().includes(q) ||
             (u.phone && u.phone.includes(q));
    })
    .sort((a, b) => {
      if (sortByCustomers === 'name-asc') return a.name.localeCompare(b.name);
      if (sortByCustomers === 'name-desc') return b.name.localeCompare(a.name);
      if (sortByCustomers === 'points-desc') return getPointsFor(b.email) - getPointsFor(a.email);
      if (sortByCustomers === 'points-asc') return getPointsFor(a.email) - getPointsFor(b.email);
      if (sortByCustomers === 'earned-desc') return getLifetimePointsFor(b.email) - getLifetimePointsFor(a.email);
      return 0;
    });

  if (error) {
    return (
      <ManagerLayout title="Loyalty Program">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 280px)', width: '100%' }}>
          <ErrorState onRetry={loadAll} retrying={loading} />
        </div>
      </ManagerLayout>
    );
  }

  const tabItems = [
    { id: 'points', label: 'Points Balances' },
    { id: 'rewards', label: 'Reward Catalog' }
  ];

  return (
    <ManagerLayout
      title="Loyalty Program"
      subtitle="Track customer loyalty balances, adjust points, and CRUD active rewards"
      tabs={tabItems.map(t => ({
        id: t.id,
        label: t.label,
        active: activeTab === t.id,
        onClick: () => { setActiveTab(t.id); setSearch(''); navigate(`/manager/loyalty?tab=${t.id}`); }
      }))}
    >
      {/* 2. POINTS BALANCE TAB */}
      {activeTab === 'points' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Filters controls */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 16, padding: '16px 20px',
            display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--background)', border: '1.5px solid var(--border)', borderRadius: 12, padding: '10px 14px' }}>
              <Search size={18} style={{ color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder="Search customers by name, email or phone..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '0.85rem', flex: 1, outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Sort By</span>
              <select
                value={sortByCustomers}
                onChange={e => setSortByCustomers(e.target.value as any)}
                style={{ padding: '10px 14px', background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)', outline: 'none', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="points-desc">Loyalty Points (High-Low)</option>
                <option value="points-asc">Loyalty Points (Low-High)</option>
                <option value="earned-desc">Lifetime Earned Points</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 60 }}><LoadingSpinner size="lg" /></div>
          ) : (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 800 }}>
                  <thead>
                    <tr style={{ background: 'var(--cream-dark)', borderBottom: '1px solid var(--border)' }}>
                      {['Customer Name', 'Email Address', 'Phone', 'Points Balance', 'Lifetime Points', 'Status', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '14px 18px', fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {customersList.length === 0 ? (
                      <tr>
                        <td colSpan={7}>
                          <div style={{ padding: 40 }}>
                            <EmptyState title="No customers found" description="No customer profiles match your search criteria." icon={Award} />
                          </div>
                        </td>
                      </tr>
                    ) : (
                      customersList.map(c => {
                        const totalOrdersCount = allOrders.filter(o =>
                          (o.user && o.user.email?.toLowerCase() === c.email?.toLowerCase()) ||
                          (o.user && o.user.name === c.name)
                        ).length;
                        const pts = getPointsFor(c.email);
                        const lifePts = getLifetimePointsFor(c.email);

                        return (
                          <tr key={c.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.86rem', opacity: c.isActive ? 1 : 0.6 }}>
                            <td style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-primary)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(232,69,10,0.15), rgba(232,69,10,0.05))', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem' }}>
                                  {c.name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div>{c.name}</div>
                                  <div style={{ fontSize: '0.66rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Role: {c.role}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>{c.email}</td>
                            <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>{c.phone || '—'}</td>
                            <td style={{ padding: '14px 18px' }}>
                              <span style={{ color: '#F59E0B', fontWeight: 700 }}>{pts.toLocaleString()}</span> pts
                            </td>
                            <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>{lifePts.toLocaleString()} pts</td>
                            <td style={{ padding: '14px 18px' }}>
                              <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: c.isActive ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: c.isActive ? '#22C55E' : '#EF4444' }}>
                                {c.isActive ? 'ACTIVE' : 'SUSPENDED'}
                              </span>
                            </td>
                            <td style={{ padding: '14px 18px' }}>
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <button
                                  onClick={() => handleOpenOrderHistory(c)}
                                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', border: '1px solid var(--border)', background: 'var(--cream-dark)', color: 'var(--text-primary)', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                                >
                                  <ShoppingBag size={12} />
                                  Orders ({totalOrdersCount})
                                </button>
                                <button
                                  onClick={() => openAdjustPoints(c)}
                                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', background: 'rgba(245,158,11,0.08)', color: '#D97706', border: 'none', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                                >
                                  <Award size={12} />
                                  Adjust Points
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. REWARDS VOUCHERS TAB */}
      {activeTab === 'rewards' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowAddReward(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', fontSize: '0.8rem', border: '1px solid var(--border)', cursor: 'pointer', borderRadius: 12, background: 'var(--surface)', color: 'var(--text-primary)', fontWeight: 700 }}
            >
              <Plus size={14} /> Add Reward Voucher
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 60 }}><LoadingSpinner size="lg" /></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {rewards.length === 0 && <EmptyState title="No rewards configured" description="There are no rewards configured in the catalog yet." icon={Star} />}
              {rewards.map(r => (
                <div key={r.id} style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 16, padding: '16px 20px',
                  display: 'flex', alignItems: 'center', gap: 16, opacity: r.isActive ? 1 : 0.6,
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  {(r.imageUrl || r.menuItemImageUrl) ? (
                    <img
                      src={r.imageUrl || r.menuItemImageUrl || ''}
                      alt={r.name}
                      style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', background: 'var(--cream-dark)', flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{ width: 48, height: 48, borderRadius: 10, background: 'rgba(255,107,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                      <Star size={18} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{r.name}</div>
                    {r.description && <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.3 }}>{r.description}</div>}
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: 4, fontWeight: 500 }}>
                      {r.pointsCost} pts to redeem {r.menuItemName ? `· Linked Item: ${r.menuItemName}` : ''}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: r.isActive ? 'rgba(34,197,94,0.1)' : 'var(--cream-dark)', color: r.isActive ? '#22C55E' : 'var(--text-secondary)' }}>
                    {r.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <button onClick={() => handleToggleReward(r)} style={{ padding: '6px 12px', fontSize: '0.78rem', border: '1px solid var(--border)', background: 'var(--cream-dark)', color: 'var(--text-primary)', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>
                      {r.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => openEditReward(r)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 6 }}>
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDeleteReward(r.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 6 }}><Trash2 size={15} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Reward Modal */}
      {showAddReward && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }} onClick={() => setShowAddReward(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 440, padding: '24px 28px', background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 24, display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Poppins' }}>Add New Reward Voucher</h3>
              <button type="button" onClick={() => setShowAddReward(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateReward} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Link to Existing Menu Item (Optional)</label>
                <select
                  value={newRewardMenuItemId || ''}
                  onChange={e => handleSelectMenuItemForNewReward(e.target.value ? Number(e.target.value) : null)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', background: 'var(--background)', border: '1.5px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)', outline: 'none', fontSize: '0.88rem' }}
                >
                  <option value="">-- No linked menu item --</option>
                  {menuItems.map(item => (
                    <option key={item.id} value={item.id}>{item.name} ({item.category}) - {formatRM(item.price)}</option>
                  ))}
                </select>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'block', marginTop: 4, fontStyle: 'italic' }}>
                  Selecting a menu item auto-fills details and calculates points cost.
                </span>
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Voucher Name *</label>
                <input value={newRewardName} onChange={e => setNewRewardName(e.target.value)} required
                  placeholder="e.g. Free Burger Ayam Special"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', background: 'var(--background)', border: '1.5px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)', outline: 'none', fontSize: '0.88rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Points Cost *</label>
                <input type="number" min="1" value={newRewardCost} onChange={e => setNewRewardCost(Number(e.target.value))} required
                  style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', background: 'var(--background)', border: '1.5px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)', outline: 'none', fontSize: '0.88rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Voucher Description (Optional)</label>
                <textarea value={newRewardDescription} onChange={e => setNewRewardDescription(e.target.value)}
                  placeholder="Details about what the customer gets with this voucher..."
                  rows={3}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', background: 'var(--background)', border: '1.5px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)', outline: 'none', fontSize: '0.88rem', resize: 'vertical' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Voucher Image URL (Optional)</label>
                <input value={newRewardImageUrl} onChange={e => setNewRewardImageUrl(e.target.value)}
                  placeholder="e.g. https://images.unsplash.com/..."
                  style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', background: 'var(--background)', border: '1.5px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)', outline: 'none', fontSize: '0.88rem' }} />
              </div>
              <button type="submit" style={{ marginTop: 8, padding: '14px', background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 20, fontWeight: 700, cursor: 'pointer', fontSize: '0.92rem', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 12px rgba(230, 51, 41, 0.2)' }}>Create Reward</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Reward Modal */}
      {showEditReward && editingReward && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }} onClick={() => setShowEditReward(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 440, padding: '24px 28px', background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 24, display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Poppins' }}>Edit Reward Voucher</h3>
              <button type="button" onClick={() => setShowEditReward(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleUpdateReward} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Link to Existing Menu Item (Optional)</label>
                <select
                  value={editRewardMenuItemId || ''}
                  onChange={e => handleSelectMenuItemForEditReward(e.target.value ? Number(e.target.value) : null)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', background: 'var(--background)', border: '1.5px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)', outline: 'none', fontSize: '0.88rem' }}
                >
                  <option value="">-- No linked menu item --</option>
                  {menuItems.map(item => (
                    <option key={item.id} value={item.id}>{item.name} ({item.category}) - {formatRM(item.price)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Voucher Name *</label>
                <input value={editRewardName} onChange={e => setEditRewardName(e.target.value)} required
                  style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', background: 'var(--background)', border: '1.5px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)', outline: 'none', fontSize: '0.88rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Points Cost *</label>
                <input type="number" min="1" value={editRewardCost} onChange={e => setEditRewardCost(Number(e.target.value))} required
                  style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', background: 'var(--background)', border: '1.5px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)', outline: 'none', fontSize: '0.88rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Voucher Description (Optional)</label>
                <textarea value={editRewardDescription} onChange={e => setEditRewardDescription(e.target.value)}
                  rows={3}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', background: 'var(--background)', border: '1.5px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)', outline: 'none', fontSize: '0.88rem', resize: 'vertical' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Voucher Image URL (Optional)</label>
                <input value={editRewardImageUrl} onChange={e => setEditRewardImageUrl(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', background: 'var(--background)', border: '1.5px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)', outline: 'none', fontSize: '0.88rem' }} />
              </div>
              <button type="submit" style={{ marginTop: 8, padding: '14px', background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 20, fontWeight: 700, cursor: 'pointer', fontSize: '0.92rem', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 12px rgba(230, 51, 41, 0.2)' }}>Update Reward</button>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Points Modal */}
      {showAdjust && adjustAccount && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }} onClick={() => setShowAdjust(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, padding: '24px 28px', background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Poppins' }}>Adjust Loyalty Points</h3>
              <button type="button" onClick={() => setShowAdjust(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ background: 'var(--cream-dark)', padding: 12, borderRadius: 10, fontSize: '0.8rem', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
              <div><strong>User:</strong> {adjustAccount.userName}</div>
              <div style={{ marginTop: 4 }}><strong>Current Loyalty Balance:</strong> <span style={{ color: '#F59E0B', fontWeight: 700 }}>{adjustAccount.points}</span> pts</div>
            </div>
            <form onSubmit={handleAdjustPoints} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Adjustment Action</label>
                <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                  <button
                    type="button"
                    onClick={() => setAdjustType('ADD')}
                    style={{
                      flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid',
                      borderColor: adjustType === 'ADD' ? 'var(--success)' : 'var(--border)',
                      background: adjustType === 'ADD' ? 'rgba(34,197,94,0.06)' : 'transparent',
                      color: adjustType === 'ADD' ? '#22C55E' : 'var(--text-secondary)',
                      cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem',
                    }}
                  >
                    ➕ Add Points
                  </button>
                  {user?.role === 'ADMIN' && (
                    <button
                      type="button"
                      onClick={() => setAdjustType('DEDUCT')}
                      style={{
                        flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid',
                        borderColor: adjustType === 'DEDUCT' ? 'var(--red)' : 'var(--border)',
                        background: adjustType === 'DEDUCT' ? 'rgba(255,107,0,0.06)' : 'transparent',
                        color: adjustType === 'DEDUCT' ? 'var(--red)' : 'var(--text-secondary)',
                        cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem',
                      }}
                    >
                      ➖ Deduct Points
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  Points Amount
                </label>
                <input type="number" min="1" value={adjustPoints} onChange={e => setAdjustPoints(Math.abs(Number(e.target.value)))} required
                  placeholder="e.g. 50"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', background: 'var(--background)', border: '1.5px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)', outline: 'none', fontSize: '0.88rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Reason for Adjustment</label>
                <input value={adjustReason} onChange={e => setAdjustReason(e.target.value)} required
                  placeholder="e.g. Compensation for order delay"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', background: 'var(--background)', border: '1.5px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)', outline: 'none', fontSize: '0.88rem' }} />
              </div>
              <button type="submit" disabled={submittingAdjust} style={{ marginTop: 12, padding: '14px', background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 20, fontWeight: 700, cursor: 'pointer', fontSize: '0.92rem', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 12px rgba(230, 51, 41, 0.2)', opacity: submittingAdjust ? 0.7 : 1 }}>
                {submittingAdjust ? 'Adjusting...' : 'Apply Adjustment'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Customer Orders History Modal */}
      {selectedCustomer && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, backdropFilter: 'blur(4px)'
        }} onClick={() => setSelectedCustomer(null)}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 640, maxHeight: '80vh',
              background: 'var(--surface)', border: '1.5px solid var(--border)',
              borderRadius: 'var(--radius-xl)', padding: '24px 28px', display: 'flex',
              flexDirection: 'column', gap: 16, overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Poppins' }}>
                  🛍️ Customer Purchase History
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                  Purchase history for <strong>{selectedCustomer.name}</strong> ({selectedCustomer.email})
                </p>
              </div>
              <button type="button" onClick={() => setSelectedCustomer(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
              {customerOrders.length === 0 ? (
                <EmptyState title="No orders found" description="No orders have been placed by this customer yet." icon={ShoppingBag} />
              ) : (
                customerOrders.map(order => (
                  <div key={order.id} style={{
                    background: 'var(--cream-dark)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)', padding: 16, display: 'flex', flexDirection: 'column', gap: 8
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <span style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '0.84rem', color: 'var(--text-primary)' }}>
                        #{order.orderNumber}
                      </span>
                      <span style={{
                        fontSize: '0.7rem', fontWeight: 800, padding: '3px 8px', borderRadius: 'var(--radius-sm)',
                        background: order.status === 'READY' || order.status === 'COMPLETED' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                        color: order.status === 'READY' || order.status === 'COMPLETED' ? '#22C55E' : '#F59E0B'
                      }}>
                        {order.status}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={11} /> {new Date(order.createdAt).toLocaleString()}
                      </span>
                      {order.pickupTime && (
                        <span>⏰ Pickup Slot: {new Date(order.pickupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      )}
                    </div>

                    {order.notes && (
                      <div style={{ fontSize: '0.74rem', background: 'var(--background)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', color: 'var(--red)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <MessageSquare size={10} /> Note: "{order.notes}"
                      </div>
                    )}

                    <div style={{ borderTop: '1px dashed var(--border)', margin: '4px 0' }} />

                    {/* Order items */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {order.items?.map((item: any, i: number) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text-primary)' }}>
                          <span>{item.quantity}x {item.menuItem?.name || 'Item'}</span>
                          <span style={{ fontWeight: 600 }}>{item.isFree ? 'FREE' : formatRM(item.unitPrice * item.quantity)}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Total Paid ({order.paymentMethod}):</span>
                      <span style={{ fontFamily: 'Poppins', fontWeight: 900, color: 'var(--red)', fontSize: '0.95rem' }}>{formatRM(order.total)}</span>
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
