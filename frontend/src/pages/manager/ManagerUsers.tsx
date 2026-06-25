import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Plus, Edit2, Trash2, X, Search, ShoppingBag,
  Calendar, MessageSquare, Shield, Mail, Phone, FileText,
  UserCheck, UserX, ChevronDown, ChevronUp, Users, AlertCircle
} from 'lucide-react';
import { ManagerLayout } from './ManagerDashboard';
import { staffService } from '../../services/manager.service';
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

interface StaffUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'CUSTOMER' | 'STAFF' | 'MANAGER' | 'GUEST' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
  icNumber?: string;
  typhoidExpiry?: string;
  foodHandlerExpiry?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  notes?: string;
}

// 1. Staff Documents Modal
const DocModal: React.FC<{ staff: StaffUser; onClose: () => void; onSave: () => void }> = ({ staff, onClose, onSave }) => {
  const { confirm } = useConfirmation();
  const [form, setForm] = useState({
    icNumber: staff.icNumber || '',
    typhoidExpiry: staff.typhoidExpiry || '',
    foodHandlerExpiry: staff.foodHandlerExpiry || '',
    emergencyContactName: staff.emergencyContactName || '',
    emergencyContactPhone: staff.emergencyContactPhone || '',
    notes: staff.notes || '',
  });

  const hasChanges = () => Object.entries(form).some(([k, v]) => v !== ((staff as any)[k] || ''));
  useUnsavedChangesBlocker(hasChanges());

  const handleClose = async () => {
    if (hasChanges()) {
      const discard = await confirm({ title: 'Unsaved Changes', message: 'Discard changes?', confirmLabel: 'Discard', cancelLabel: 'Stay', type: 'warning' });
      if (!discard) return;
    }
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await staffService.updateDocuments(staff.id, form);
      toast.success('Documents saved successfully'); onSave(); onClose();
    } catch { toast.error('Failed to save documents'); }
  };

  const field = (label: string, key: keyof typeof form, type = 'text') => (
    <div>
      <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">{label}</label>
      <input type={type} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
        className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)]" />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={handleClose}>
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-lg overflow-hidden shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--background)]">
          <h3 className="font-bold text-lg m-0 flex items-center gap-2"><FileText size={18} className="text-[var(--primary)]" /> Documents — {staff.name}</h3>
          <button onClick={handleClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {field('IC Number', 'icNumber')}
          <div className="grid grid-cols-2 gap-4">
            {field('Typhoid Cert Expiry', 'typhoidExpiry', 'date')}
            {field('Food Handler Expiry', 'foodHandlerExpiry', 'date')}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {field('Emergency Contact', 'emergencyContactName')}
            {field('Emergency Phone', 'emergencyContactPhone')}
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Notes / Remarks</label>
            <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3}
              className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)] resize-y" />
          </div>
          <AppButton type="submit" variant="primary" className="w-full mt-2" size="lg">Save Documents</AppButton>
        </form>
      </div>
    </div>
  );
};

// 2. Add User Modal
const AddUserModal: React.FC<{ defaultRole: 'CUSTOMER' | 'STAFF'; onClose: () => void; onSave: () => void }> = ({ defaultRole, onClose, onSave }) => {
  const { confirm } = useConfirmation();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: defaultRole as string });
  const [saving, setSaving] = useState(false);

  const hasChanges = () => form.name !== '' || form.email !== '' || form.phone !== '' || form.password !== '' || form.role !== defaultRole;
  useUnsavedChangesBlocker(hasChanges());

  const handleClose = async () => {
    if (hasChanges()) {
      const discard = await confirm({ title: 'Unsaved Changes', message: 'Discard input?', confirmLabel: 'Discard', cancelLabel: 'Stay', type: 'warning' });
      if (!discard) return;
    }
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      await staffService.add(form);
      toast.success('User registered successfully'); onSave(); onClose();
    } catch { toast.error('Failed to register user'); } 
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={handleClose}>
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-md overflow-hidden shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--background)]">
          <h3 className="font-bold text-lg m-0 flex items-center gap-2"><Plus size={18} className="text-[var(--primary)]" /> Add User Account</h3>
          <button onClick={handleClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Name</label>
            <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)]" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Email</label>
            <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)]" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Phone</label>
            <input type="text" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)]" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Password</label>
            <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)]" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Role</label>
            <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)]">
              <option value="CUSTOMER">Customer</option>
              <option value="GUEST">Guest</option>
              <option value="STAFF">Staff (Kitchen / Front Counter)</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <AppButton type="submit" variant="primary" disabled={saving} className="w-full mt-2" size="lg">{saving ? 'Registering...' : 'Add Account'}</AppButton>
        </form>
      </div>
    </div>
  );
};

// 3. Edit User Modal
const EditUserModal: React.FC<{ user: StaffUser; onClose: () => void; onSave: () => void }> = ({ user, onClose, onSave }) => {
  const { confirm } = useConfirmation();
  const [form, setForm] = useState({ name: user.name, email: user.email, phone: user.phone || '', password: '', role: user.role });
  const [saving, setSaving] = useState(false);

  const hasChanges = () => form.name !== user.name || form.email !== user.email || form.phone !== (user.phone || '') || form.password !== '' || form.role !== user.role;
  useUnsavedChangesBlocker(hasChanges());

  const handleClose = async () => {
    if (hasChanges()) {
      const discard = await confirm({ title: 'Unsaved Changes', message: 'Discard edits?', confirmLabel: 'Discard', cancelLabel: 'Stay', type: 'warning' });
      if (!discard) return;
    }
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const data: Record<string, string> = { name: form.name, email: form.email, phone: form.phone, role: form.role };
      if (form.password.trim()) data.password = form.password;
      await staffService.update(user.id, data);
      toast.success('User details updated'); onSave(); onClose();
    } catch { toast.error('Failed to update user details'); } 
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={handleClose}>
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-md overflow-hidden shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--background)]">
          <h3 className="font-bold text-lg m-0 flex items-center gap-2"><Edit2 size={18} className="text-[var(--primary)]" /> Edit User</h3>
          <button onClick={handleClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Name</label>
            <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)]" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Email</label>
            <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)]" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Phone</label>
            <input type="text" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)]" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">New Password (optional)</label>
            <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)]" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Role</label>
            <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value as any }))} className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)]">
              <option value="CUSTOMER">Customer</option>
              <option value="GUEST">Guest</option>
              <option value="STAFF">Staff (Kitchen / Front Counter)</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <AppButton type="submit" variant="primary" disabled={saving} className="w-full mt-2" size="lg">{saving ? 'Saving...' : 'Save Details'}</AppButton>
        </form>
      </div>
    </div>
  );
};

export const ManagerUsers: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { confirm } = useConfirmation();

  const [activeTab, setActiveTab] = useState('customers');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [users, setUsers] = useState<StaffUser[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);

  const [search, setSearch] = useState('');
  const [sortByCustomers, setSortByCustomers] = useState<'name-asc' | 'name-desc' | 'created-desc'>('name-asc');
  const [sortByStaff, setSortByStaff] = useState<'name-asc' | 'name-desc' | 'email' | 'role' | 'status'>('name-asc');
  const [expandedStaff, setExpandedStaff] = useState<number | null>(null);

  const [showAddUser, setShowAddUser] = useState(false);
  const [addUserDefaultRole, setAddUserDefaultRole] = useState<'CUSTOMER' | 'STAFF'>('CUSTOMER');
  const [editUser, setEditUser] = useState<StaffUser | null>(null);
  const [docUser, setDocUser] = useState<StaffUser | null>(null);

  const [selectedCustomer, setSelectedCustomer] = useState<StaffUser | null>(null);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam) {
      const clean = tabParam.toLowerCase();
      if (clean === 'staff' && user?.role !== 'ADMIN') setActiveTab('customers');
      else setActiveTab(clean);
    }
  }, [location, user]);

  const loadAll = () => {
    setLoading(true); setError(false);
    Promise.all([staffService.getAll(), orderService.getAll()])
      .then(([sRes, ordersRes]) => { setUsers(sRes.data); setAllOrders(ordersRes.data || []); })
      .catch(() => { setError(true); toast.error('Failed to load user data'); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAll(); }, []);

  const handleToggleUserStatus = async (u: StaffUser) => {
    const confirmed = await confirm({ title: u.isActive ? 'Suspend User' : 'Activate User', message: `${u.isActive ? 'Suspend' : 'Activate'} account for "${u.name}"?`, confirmLabel: u.isActive ? 'Suspend' : 'Activate', cancelLabel: 'Cancel', type: 'warning' });
    if (!confirmed) return;
    try { await staffService.toggleStatus(u.id); toast.success(`User status updated`); loadAll(); } 
    catch { toast.error('Failed to update status'); }
  };

  const handleDeleteUser = async (u: StaffUser) => {
    const confirmed = await confirm({ title: 'Delete User', message: `Permanently delete account for "${u.name}"?`, confirmLabel: 'Delete Permanently', cancelLabel: 'Cancel', type: 'danger' });
    if (!confirmed) return;
    try { await staffService.delete(u.id); toast.success(`User deleted`); loadAll(); } 
    catch { toast.error('Failed to delete user'); }
  };

  const handleOpenOrderHistory = (u: StaffUser) => {
    setSelectedCustomer(u);
    setCustomerOrders(allOrders.filter(o => (o.user && o.user.email?.toLowerCase() === u.email?.toLowerCase()) || (o.guestPhone && o.guestPhone === u.phone) || (o.user && o.user.name === u.name)));
  };

  const certStatus = (dateStr?: string) => {
    if (!dateStr) return { label: 'Not uploaded', color: 'text-[var(--text-secondary)]' };
    const d = new Date(dateStr);
    const diff = (d.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
    if (diff < 0) return { label: 'EXPIRED', color: 'text-[var(--danger)]' };
    if (diff < 30) return { label: `Expires in ${Math.ceil(diff)}d`, color: 'text-[var(--warning)]' };
    return { label: d.toLocaleDateString('en-MY'), color: 'text-[var(--success)]' };
  };

  const customersList = users.filter(u => u.role === 'CUSTOMER' || u.role === 'GUEST')
    .filter(u => { const q = search.toLowerCase(); return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.phone && u.phone.includes(q)); })
    .sort((a, b) => {
      if (sortByCustomers === 'name-asc') return a.name.localeCompare(b.name);
      if (sortByCustomers === 'name-desc') return b.name.localeCompare(a.name);
      if (sortByCustomers === 'created-desc') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return 0;
    });

  const staffList = users.filter(u => u.role === 'STAFF' || u.role === 'MANAGER' || u.role === 'ADMIN')
    .filter(u => { const q = search.toLowerCase(); return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.phone && u.phone.includes(q)) || u.role.toLowerCase().includes(q); })
    .sort((a, b) => {
      if (sortByStaff === 'name-asc') return a.name.localeCompare(b.name);
      if (sortByStaff === 'name-desc') return b.name.localeCompare(a.name);
      if (sortByStaff === 'email') return a.email.localeCompare(b.email);
      if (sortByStaff === 'role') return a.role.localeCompare(b.role);
      if (sortByStaff === 'status') { if (a.isActive === b.isActive) return a.name.localeCompare(b.name); return a.isActive ? -1 : 1; }
      return 0;
    });

  if (error) return <ManagerLayout title="Users Directory"><div className="flex items-center justify-center min-h-[50vh]"><ErrorState onRetry={loadAll} retrying={loading} /></div></ManagerLayout>;

  const tabItems = [{ id: 'customers', label: 'Customers Directory' }, ...(user?.role === 'ADMIN' ? [{ id: 'staff', label: 'Staff & Admin Directory' }] : [])];

  return (
    <ManagerLayout
      title="Users Directory"
      subtitle="Manage registered customer accounts and configure staff roles"
      tabs={tabItems.map(t => ({ id: t.id, label: t.label, active: activeTab === t.id, onClick: () => { setActiveTab(t.id); setSearch(''); navigate(`/manager/users?tab=${t.id}`); } }))}
    >
      {docUser && <DocModal staff={docUser} onClose={() => setDocUser(null)} onSave={loadAll} />}
      {showAddUser && <AddUserModal defaultRole={addUserDefaultRole} onClose={() => setShowAddUser(false)} onSave={loadAll} />}
      {editUser && <EditUserModal user={editUser} onClose={() => setEditUser(null)} onSave={loadAll} />}

      <div className="flex flex-col gap-6">
        <AppCard className="!p-4" noPadding>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-6 py-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={16} />
              <input type="text" placeholder={`Search ${activeTab}...`} value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)]" />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider shrink-0">Sort</span>
              <select value={activeTab === 'customers' ? sortByCustomers : sortByStaff} onChange={e => activeTab === 'customers' ? setSortByCustomers(e.target.value as any) : setSortByStaff(e.target.value as any)}
                className="px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)] w-full md:w-auto">
                {activeTab === 'customers' ? (
                  <>
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                    <option value="created-desc">Registration Date</option>
                  </>
                ) : (
                  <>
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                    <option value="email">Email</option>
                    <option value="role">Role</option>
                    <option value="status">Status</option>
                  </>
                )}
              </select>
              <AppButton variant="primary" icon={Plus} className="shrink-0" onClick={() => { setAddUserDefaultRole(activeTab === 'customers' ? 'CUSTOMER' : 'STAFF'); setShowAddUser(true); }}>
                Add {activeTab === 'customers' ? 'Customer' : 'Staff'}
              </AppButton>
            </div>
          </div>
        </AppCard>

        {activeTab === 'customers' && (
          <AppCard noPadding>
            {loading ? (
              <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
            ) : customersList.length === 0 ? (
              <div className="py-12"><AppEmptyState title="No customers found" description="No customer profiles match your search criteria." icon={Users} /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[var(--background)] border-b border-[var(--border)] text-[var(--text-secondary)] text-xs font-bold uppercase tracking-wider">
                      <th className="px-6 py-4 font-bold">Customer Name</th>
                      <th className="px-6 py-4 font-bold">Email</th>
                      <th className="px-6 py-4 font-bold">Phone</th>
                      <th className="px-6 py-4 font-bold">Role</th>
                      <th className="px-6 py-4 font-bold">Registration Date</th>
                      <th className="px-6 py-4 font-bold">Status</th>
                      <th className="px-6 py-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customersList.map(c => {
                      const totalOrdersCount = allOrders.filter(o => (o.user && o.user.email?.toLowerCase() === c.email?.toLowerCase()) || (o.user && o.user.name === c.name)).length;
                      return (
                        <tr key={c.id} className={`border-b border-[var(--border)] last:border-0 hover:bg-[rgba(0,0,0,0.01)] transition-colors ${c.isActive ? '' : 'opacity-60'}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-bold text-xs shrink-0">
                                {c.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-semibold text-[var(--text-primary)]">{c.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{c.email}</td>
                          <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{c.phone || '—'}</td>
                          <td className="px-6 py-4"><span className="text-xs font-bold text-[var(--text-primary)] uppercase bg-[var(--background)] px-2 py-1 rounded">{c.role}</span></td>
                          <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{new Date(c.createdAt).toLocaleDateString('en-MY')}</td>
                          <td className="px-6 py-4"><AppBadge variant={c.isActive ? 'success' : 'danger'} text={c.isActive ? 'ACTIVE' : 'SUSPENDED'} /></td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-1">
                              <AppButton variant="outline" size="sm" icon={ShoppingBag} onClick={() => handleOpenOrderHistory(c)}>Orders ({totalOrdersCount})</AppButton>
                              <AppButton variant="ghost" size="icon" onClick={() => setEditUser(c)}><Edit2 size={16} /></AppButton>
                              <AppButton variant="ghost" size="icon" onClick={() => handleToggleUserStatus(c)} className={c.isActive ? 'text-[var(--danger)] hover:text-red-700' : 'text-[var(--success)] hover:text-green-700'}>{c.isActive ? <UserX size={16} /> : <UserCheck size={16} />}</AppButton>
                              <AppButton variant="ghost" size="icon" onClick={() => handleDeleteUser(c)} className="text-[var(--danger)] hover:text-red-700 hover:bg-red-50"><Trash2 size={16} /></AppButton>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </AppCard>
        )}

        {activeTab === 'staff' && user?.role === 'ADMIN' && (
          <div className="flex flex-col gap-4">
            {loading ? (
              <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
            ) : staffList.length === 0 ? (
              <AppEmptyState title="No staff members found" description="No staff profiles match your search criteria." icon={Shield} />
            ) : (
              staffList.map(s => {
                const isExpanded = expandedStaff === s.id;
                const typhoidStat = certStatus(s.typhoidExpiry);
                const foodStat = certStatus(s.foodHandlerExpiry);
                const isStaffOrManager = s.role === 'STAFF' || s.role === 'MANAGER';
                const hasExpiredDoc = isStaffOrManager && (typhoidStat.color.includes('danger') || foodStat.color.includes('danger'));

                return (
                  <div key={s.id} className={`bg-[var(--surface)] border rounded-xl overflow-hidden shadow-sm transition-all duration-200 ${hasExpiredDoc ? 'border-[var(--danger)]/50' : 'border-[var(--border)]'} ${s.isActive ? '' : 'opacity-60'}`}>
                    <div className="p-4 md:px-6 md:py-5 flex flex-col md:flex-row items-start md:items-center gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 rounded-full bg-[var(--background)] border border-[var(--border)] flex items-center justify-center font-bold text-[var(--text-primary)] text-sm shrink-0">
                          {s.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-[var(--text-primary)] mb-1">{s.name}</div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-secondary)]">
                            <span className="flex items-center gap-1.5"><Mail size={12} /> {s.email}</span>
                            {s.phone && <span className="flex items-center gap-1.5"><Phone size={12} /> {s.phone}</span>}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 ${s.role === 'MANAGER' ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : s.role === 'ADMIN' ? 'bg-red-500/10 text-red-500' : 'bg-[var(--background)] text-[var(--text-primary)]'}`}>
                          <Shield size={12} /> {s.role}
                        </span>

                        {hasExpiredDoc && (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-red-500/10 text-red-500 flex items-center gap-1.5">
                            <AlertCircle size={12} /> Expired Docs
                          </span>
                        )}

                        <AppButton variant="outline" size="sm" icon={Edit2} onClick={() => setEditUser(s)}>Edit</AppButton>
                        {isStaffOrManager && <AppButton variant="outline" size="sm" icon={FileText} onClick={() => setDocUser(s)}>Docs</AppButton>}

                        <div className="flex gap-1 ml-auto md:ml-2">
                          <AppButton variant="ghost" size="icon" onClick={() => handleToggleUserStatus(s)} className={s.isActive ? 'text-[var(--danger)] hover:text-red-700' : 'text-[var(--success)] hover:text-green-700'}>{s.isActive ? <UserX size={16} /> : <UserCheck size={16} />}</AppButton>
                          <AppButton variant="ghost" size="icon" onClick={() => handleDeleteUser(s)} className="text-[var(--danger)] hover:text-red-700 hover:bg-red-50"><Trash2 size={16} /></AppButton>
                          {isStaffOrManager && <AppButton variant="ghost" size="icon" onClick={() => setExpandedStaff(isExpanded ? null : s.id)}>{isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</AppButton>}
                        </div>
                      </div>
                    </div>

                    {isExpanded && isStaffOrManager && (
                      <div className="border-t border-[var(--border)] p-4 md:px-6 bg-[var(--background)] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">IC Number</div>
                          <div className="text-sm font-semibold">{s.icNumber || '—'}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Typhoid Cert</div>
                          <div className={`text-sm font-semibold ${typhoidStat.color}`}>{typhoidStat.label}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Food Handler Cert</div>
                          <div className={`text-sm font-semibold ${foodStat.color}`}>{foodStat.label}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Emergency Contact</div>
                          <div className="text-sm font-semibold">{s.emergencyContactName ? `${s.emergencyContactName} (${s.emergencyContactPhone || '—'})` : '—'}</div>
                        </div>
                        {s.notes && (
                          <div className="col-span-full">
                            <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Admin Notes</div>
                            <div className="text-sm text-[var(--text-secondary)]">{s.notes}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Customer Orders Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelectedCustomer(null)}>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--background)] shrink-0">
              <div>
                <h3 className="font-bold text-lg m-0 flex items-center gap-2"><ShoppingBag size={18} className="text-[var(--primary)]" /> Customer Purchase History</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1 mb-0">Purchases for <span className="font-bold text-[var(--text-primary)]">{selectedCustomer.name}</span> ({selectedCustomer.email})</p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><X size={20} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4 bg-[var(--background)]">
              {customerOrders.length === 0 ? (
                <div className="flex justify-center py-12"><AppEmptyState title="No orders found" description="This customer hasn't placed any orders yet." icon={ShoppingBag} /></div>
              ) : (
                customerOrders.map(order => (
                  <div key={order.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex flex-col gap-3 shadow-sm">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <span className="font-bold text-sm">#{order.orderNumber}</span>
                      <AppBadge variant={order.status === 'READY' || order.status === 'COMPLETED' ? 'success' : 'warning'} text={order.status} />
                    </div>
                    
                    <div className="flex flex-wrap gap-3 text-xs text-[var(--text-secondary)]">
                      <span className="flex items-center gap-1.5"><Calendar size={12} /> {new Date(order.createdAt).toLocaleString('en-MY')}</span>
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
                          <span className="font-bold">{item.isFree ? 'FREE' : formatRM(item.unitPrice * item.quantity)}</span>
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
