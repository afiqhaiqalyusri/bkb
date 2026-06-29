import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Plus, Edit2, Trash2, X, Search, ShoppingBag,
  Calendar, MessageSquare, Shield, Mail, Phone, FileText,
  UserCheck, UserX, ChevronDown, ChevronUp, Users, AlertCircle
} from 'lucide-react';
import { ManagerLayout } from '../../components/layout/ManagerLayout';
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
import { formControlClass } from '../../components/ui/AppFormField';
import { StatusBadge } from '../../components/dashboard/StatusBadge';

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
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{label}</label>
      <input type={type} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
        className={formControlClass} />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-955/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={handleClose}>
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/40">
          <h3 className="font-bold text-sm uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5"><FileText size={16} /> Documents — {staff.name}</h3>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {field('IC / Passport Number', 'icNumber')}
          <div className="grid grid-cols-2 gap-4">
            {field('Typhoid Expiry Date', 'typhoidExpiry', 'date')}
            {field('Food Handler Expiry Date', 'foodHandlerExpiry', 'date')}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {field('Emergency Contact Name', 'emergencyContactName')}
            {field('Emergency Phone Number', 'emergencyContactPhone')}
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Notes / Remarks</label>
            <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3}
              className={`${formControlClass} resize-none`} placeholder="Note emergency protocols, shift preferences..." />
          </div>
          <AppButton type="submit" variant="primary" className="w-full mt-3 py-3 text-xs uppercase tracking-wider font-bold" size="lg">Save Documents</AppButton>
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
    <div className="fixed inset-0 bg-slate-955/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={handleClose}>
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/40">
          <h3 className="font-bold text-sm uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5"><Plus size={16} /> Add User Account</h3>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Full Name</label>
            <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required className={formControlClass} placeholder="e.g. John Doe" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Email Address</label>
            <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required className={formControlClass} placeholder="e.g. john@domain.com" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Phone Number</label>
            <input type="text" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className={formControlClass} placeholder="e.g. +60123456789" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Secure Password</label>
            <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required className={formControlClass} placeholder="••••••••" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Assigned Role</label>
            <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className={formControlClass}>
              <option value="CUSTOMER">Customer</option>
              <option value="GUEST">Guest</option>
              <option value="STAFF">Staff (Kitchen / Front Counter)</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <AppButton type="submit" variant="primary" disabled={saving} className="w-full mt-3 py-3 text-xs uppercase tracking-wider font-bold" size="lg">
            {saving ? 'Registering...' : 'Register User'}
          </AppButton>
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
    <div className="fixed inset-0 bg-slate-955/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={handleClose}>
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/40">
          <h3 className="font-bold text-sm uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5"><Edit2 size={16} /> Edit User Details</h3>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Full Name</label>
            <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required className={formControlClass} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Email Address</label>
            <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required className={formControlClass} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Phone Number</label>
            <input type="text" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className={formControlClass} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">New Password (optional)</label>
            <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className={formControlClass} placeholder="Leave blank to keep current" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Role</label>
            <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value as any }))} className={formControlClass}>
              <option value="CUSTOMER">Customer</option>
              <option value="GUEST">Guest</option>
              <option value="STAFF">Staff (Kitchen / Front Counter)</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <AppButton type="submit" variant="primary" disabled={saving} className="w-full mt-3 py-3 text-xs uppercase tracking-wider font-bold" size="lg">
            {saving ? 'Saving...' : 'Save User Details'}
          </AppButton>
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
      if (clean === 'staff' || clean === 'customers') setActiveTab(clean);
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
    if (!dateStr) return { label: 'Not uploaded', color: 'text-slate-400' };
    const d = new Date(dateStr);
    const diff = (d.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
    if (diff < 0) return { label: 'EXPIRED', color: 'text-red-500' };
    if (diff < 30) return { label: `Expires in ${Math.ceil(diff)}d`, color: 'text-amber-500' };
    return { label: d.toLocaleDateString('en-MY'), color: 'text-emerald-500' };
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

  const tabItems = [{ id: 'customers', label: 'Customers Directory' }, { id: 'staff', label: 'Staff & Admin Directory' }];

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
        
        {/* Toolbar Card */}
        <AppCard noPadding>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input type="text" placeholder={`Search ${activeTab} by credentials...`} value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10 placeholder-slate-400 transition-all" />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">Sort</span>
              <select value={activeTab === 'customers' ? sortByCustomers : sortByStaff} onChange={e => activeTab === 'customers' ? setSortByCustomers(e.target.value as any) : setSortByStaff(e.target.value as any)}
                className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10 transition-all w-full md:w-auto cursor-pointer">
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
              <AppButton variant="primary" size="sm" icon={Plus} className="shrink-0 text-xs font-bold uppercase tracking-wider py-2.5" onClick={() => { setAddUserDefaultRole(activeTab === 'customers' ? 'CUSTOMER' : 'STAFF'); setShowAddUser(true); }}>
                Add User
              </AppButton>
            </div>
          </div>
        </AppCard>

        {/* Customers Directory */}
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
                    <tr className="bg-slate-50/50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                      <th className="px-6 py-4.5">Customer</th>
                      <th className="px-6 py-4.5">Email</th>
                      <th className="px-6 py-4.5">Phone</th>
                      <th className="px-6 py-4.5">Role</th>
                      <th className="px-6 py-4.5">Registered</th>
                      <th className="px-6 py-4.5">Status</th>
                      <th className="px-6 py-4.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/80">
                    {customersList.map(c => {
                      const totalOrdersCount = allOrders.filter(o => (o.user && o.user.email?.toLowerCase() === c.email?.toLowerCase()) || (o.user && o.user.name === c.name)).length;
                      return (
                        <tr key={c.id} className={`hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors ${c.isActive ? '' : 'opacity-60'}`}>
                          <td className="px-6 py-4.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-bold text-xs shrink-0 border border-orange-500/10">
                                {c.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-bold text-slate-800 dark:text-white text-sm">{c.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">{c.email}</td>
                          <td className="px-6 py-4.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold">{c.phone || '—'}</td>
                          <td className="px-6 py-4.5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400">
                              {c.role}
                            </span>
                          </td>
                          <td className="px-6 py-4.5 text-xs sm:text-sm text-slate-400 dark:text-slate-500 font-semibold">{new Date(c.createdAt).toLocaleDateString('en-MY')}</td>
                          <td className="px-6 py-4.5"><StatusBadge status={c.isActive ? 'success' : 'danger'} label={c.isActive ? 'ACTIVE' : 'SUSPENDED'} /></td>
                          <td className="px-6 py-4.5">
                            <div className="flex items-center justify-end gap-1">
                              <AppButton variant="secondary" size="sm" icon={ShoppingBag} onClick={() => handleOpenOrderHistory(c)} className="text-[11px] py-1.5 uppercase font-bold tracking-wider">Orders ({totalOrdersCount})</AppButton>
                              <AppButton variant="ghost" size="icon" onClick={() => setEditUser(c)}><Edit2 size={14} /></AppButton>
                              <button onClick={() => handleToggleUserStatus(c)} className={`p-2 rounded-lg transition-colors ${c.isActive ? 'text-rose-500 hover:bg-rose-50' : 'text-emerald-500 hover:bg-emerald-50'}`}>{c.isActive ? <UserX size={14} /> : <UserCheck size={14} />}</button>
                              <AppButton variant="ghost" size="icon" onClick={() => handleDeleteUser(c)} className="text-rose-500 hover:bg-rose-50"><Trash2 size={14} /></AppButton>
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

        {/* Staff & Admin Directory */}
        {activeTab === 'staff' && (
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
                const hasExpiredDoc = isStaffOrManager && (typhoidStat.color.includes('red') || foodStat.color.includes('red'));

                return (
                  <div key={s.id} className={`bg-white dark:bg-slate-900 border rounded-2xl overflow-hidden shadow-sm transition-all duration-200 ${hasExpiredDoc ? 'border-rose-350' : 'border-slate-100 dark:border-slate-800'} ${s.isActive ? '' : 'opacity-60'}`}>
                    <div className="p-4 md:px-6 md:py-5 flex flex-col md:flex-row items-start md:items-center gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/60 dark:bg-slate-950 dark:border-slate-800 flex items-center justify-center font-black text-slate-700 dark:text-white text-sm shrink-0">
                          {s.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 dark:text-white text-sm sm:text-base leading-tight mb-1">{s.name}</div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 dark:text-slate-500 font-semibold">
                            <span className="flex items-center gap-1.5"><Mail size={12} /> {s.email}</span>
                            {s.phone && <span className="flex items-center gap-1.5"><Phone size={12} /> {s.phone}</span>}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto shrink-0">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 uppercase tracking-wider ${
                          s.role === 'MANAGER' 
                            ? 'bg-orange-500/10 text-primary border border-orange-500/20' 
                            : s.role === 'ADMIN' 
                              ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' 
                              : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                        }`}>
                          <Shield size={10} strokeWidth={2.5} /> {s.role}
                        </span>

                        {hasExpiredDoc && (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-600 border border-rose-500/20 flex items-center gap-1.5 uppercase tracking-wider">
                            <AlertCircle size={10} /> Expired Docs
                          </span>
                        )}

                        <AppButton variant="secondary" size="sm" icon={Edit2} onClick={() => setEditUser(s)} className="text-xs uppercase font-bold tracking-wider py-2">Edit</AppButton>
                        {isStaffOrManager && <AppButton variant="secondary" size="sm" icon={FileText} onClick={() => setDocUser(s)} className="text-xs uppercase font-bold tracking-wider py-2">Docs</AppButton>}

                        <div className="flex gap-1 ml-auto md:ml-2">
                          <button onClick={() => handleToggleUserStatus(s)} className={`p-2 rounded-lg transition-colors ${s.isActive ? 'text-rose-500 hover:bg-rose-50' : 'text-emerald-500 hover:bg-emerald-50'}`}>{s.isActive ? <UserX size={15} /> : <UserCheck size={15} />}</button>
                          <AppButton variant="ghost" size="icon" onClick={() => handleDeleteUser(s)} className="text-rose-500 hover:bg-rose-50"><Trash2 size={15} /></AppButton>
                          {isStaffOrManager && <AppButton variant="ghost" size="icon" onClick={() => setExpandedStaff(isExpanded ? null : s.id)}>{isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</AppButton>}
                        </div>
                      </div>
                    </div>

                    {isExpanded && isStaffOrManager && (
                      <div className="border-t border-slate-100 dark:border-slate-800 p-5 bg-slate-50/50 dark:bg-slate-900/30 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                        <div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">IC / Passport Number</div>
                          <div className="text-xs sm:text-sm font-bold text-slate-700 dark:text-white">{s.icNumber || '—'}</div>
                        </div>
                        <div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Typhoid Cert Expiry</div>
                          <div className={`text-xs sm:text-sm font-bold ${typhoidStat.color}`}>{typhoidStat.label}</div>
                        </div>
                        <div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Food Handler Expiry</div>
                          <div className={`text-xs sm:text-sm font-bold ${foodStat.color}`}>{foodStat.label}</div>
                        </div>
                        <div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Emergency Contact Details</div>
                          <div className="text-xs sm:text-sm font-bold text-slate-700 dark:text-white">{s.emergencyContactName ? `${s.emergencyContactName} (${s.emergencyContactPhone || '—'})` : '—'}</div>
                        </div>
                        {s.notes && (
                          <div className="col-span-full">
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Administrative Notes</div>
                            <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">{s.notes}</div>
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
        <div className="fixed inset-0 bg-slate-955/65 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedCustomer(null)}>
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
              <div>
                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5"><ShoppingBag size={16} /> Customer Purchase History</h3>
                <p className="text-[10px] text-slate-450 mt-1 mb-0 font-medium">Orders placed by <span className="font-bold text-slate-800 dark:text-white">{selectedCustomer.name}</span></p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="text-slate-400 hover:text-slate-650"><X size={18} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4 bg-slate-50 dark:bg-slate-955/20">
              {customerOrders.length === 0 ? (
                <div className="flex justify-center py-12"><AppEmptyState title="No orders found" description="This customer hasn't placed any orders yet." icon={ShoppingBag} /></div>
              ) : (
                customerOrders.map(order => (
                  <div key={order.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <span className="font-bold text-xs sm:text-sm text-slate-700 dark:text-white">Order #{order.orderNumber}</span>
                      <StatusBadge status={order.status === 'READY' || order.status === 'COMPLETED' ? 'success' : 'warning'} label={order.status} />
                    </div>
                    
                    <div className="flex flex-wrap gap-3 text-xs text-slate-400 font-semibold">
                      <span className="flex items-center gap-1.5"><Calendar size={12} /> {new Date(order.createdAt).toLocaleString('en-MY')}</span>
                    </div>

                    {order.notes && (
                      <div className="text-xs bg-rose-50 text-rose-600 border border-rose-100 px-3.5 py-2 rounded-xl italic flex items-center gap-2 font-medium">
                        <MessageSquare size={12} /> Note: "{order.notes}"
                      </div>
                    )}

                    <div className="border-t border-dashed border-slate-100 dark:border-slate-800/80 my-1" />

                    <div className="flex flex-col gap-2">
                      {order.items?.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between text-xs sm:text-sm font-semibold">
                          <span className="text-slate-600 dark:text-slate-300">{item.quantity}x {item.menuItem?.name || 'Item'}</span>
                          <span className="font-extrabold text-slate-850 dark:text-white">{item.isFree ? 'FREE' : formatRM(item.unitPrice * item.quantity)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-850 pt-3 mt-1 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Paid ({order.paymentMethod}):</span>
                      <span className="font-black text-base sm:text-lg text-primary">{formatRM(order.total)}</span>
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
