import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Plus, Edit2, Trash2, X, Search, ShoppingBag,
  Calendar, MessageSquare, Shield, Mail, Phone, FileText,
  UserCheck, UserX, ChevronDown, ChevronUp, Clock, Users
} from 'lucide-react';
import { ManagerLayout } from './ManagerDashboard';
import { staffService } from '../../services/manager.service';
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
  icNumber?: string;
  typhoidExpiry?: string;
  foodHandlerExpiry?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  notes?: string;
}

/* ─────────────────────────────────────────────────────────────
   MODALS
   ───────────────────────────────────────────────────────────── */

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

  const hasChanges = () => {
    return form.icNumber !== (staff.icNumber || '') ||
           form.typhoidExpiry !== (staff.typhoidExpiry || '') ||
           form.foodHandlerExpiry !== (staff.foodHandlerExpiry || '') ||
           form.emergencyContactName !== (staff.emergencyContactName || '') ||
           form.emergencyContactPhone !== (staff.emergencyContactPhone || '') ||
           form.notes !== (staff.notes || '');
  };

  useUnsavedChangesBlocker(hasChanges());

  const handleClose = async () => {
    if (hasChanges()) {
      const discard = await confirm({
        title: 'Unsaved Changes',
        message: 'Are you sure you want to discard your changes?',
        confirmLabel: 'Discard',
        cancelLabel: 'Stay',
        type: 'warning'
      });
      if (!discard) return;
    }
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await staffService.updateDocuments(staff.id, form);
      toast.success('Documents saved successfully');
      onSave();
      onClose();
    } catch {
      toast.error('Failed to save documents');
    }
  };

  const field = (label: string, key: keyof typeof form, type = 'text') => (
    <div>
      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{label}</label>
      <input type={type} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
        style={{ width: '100%', padding: '12px 16px', background: 'var(--background)', border: '1.5px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)', fontSize: '0.88rem', boxSizing: 'border-box', outline: 'none' }} />
    </div>
  );

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxWidth: 520, background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 24, padding: '24px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Poppins' }}>Documents — {staff.name}</h3>
          <button type="button" onClick={handleClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {field('IC Number', 'icNumber')}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {field('Typhoid Cert Expiry', 'typhoidExpiry', 'date')}
            {field('Food Handler Cert Expiry', 'foodHandlerExpiry', 'date')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {field('Emergency Contact Name', 'emergencyContactName')}
            {field('Emergency Contact Phone', 'emergencyContactPhone')}
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Notes / Remarks</label>
            <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              rows={3} style={{ width: '100%', padding: '12px 16px', background: 'var(--background)', border: '1.5px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)', fontSize: '0.88rem', resize: 'vertical', boxSizing: 'border-box', outline: 'none' }} />
          </div>
          <button type="submit" style={{ marginTop: 12, padding: '14px', background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 20, fontWeight: 700, cursor: 'pointer', fontSize: '0.92rem', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 12px rgba(230, 51, 41, 0.2)' }}>Save Documents</button>
        </form>
      </div>
    </div>
  );
};

// 2. Add User Modal
const AddUserModal: React.FC<{ defaultRole: 'CUSTOMER' | 'STAFF'; onClose: () => void; onSave: () => void }> = ({ defaultRole, onClose, onSave }) => {
  const { confirm } = useConfirmation();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: defaultRole as string,
  });
  const [saving, setSaving] = useState(false);

  const hasChanges = () => {
    return form.name !== '' || form.email !== '' || form.phone !== '' || form.password !== '' || form.role !== defaultRole;
  };

  useUnsavedChangesBlocker(hasChanges());

  const handleClose = async () => {
    if (hasChanges()) {
      const discard = await confirm({
        title: 'Unsaved Changes',
        message: 'Are you sure you want to discard your input?',
        confirmLabel: 'Discard',
        cancelLabel: 'Stay',
        type: 'warning'
      });
      if (!discard) return;
    }
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await staffService.add(form);
      toast.success('User account registered successfully');
      onSave();
      onClose();
    } catch {
      toast.error('Failed to register user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxWidth: 440, background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 24, padding: '24px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Poppins' }}>Add User Account</h3>
          <button type="button" onClick={handleClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Name</label>
            <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required
              style={{ width: '100%', padding: '12px 16px', background: 'var(--background)', border: '1.5px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)', boxSizing: 'border-box', outline: 'none', fontSize: '0.88rem' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Email</label>
            <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required
              style={{ width: '100%', padding: '12px 16px', background: 'var(--background)', border: '1.5px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)', boxSizing: 'border-box', outline: 'none', fontSize: '0.88rem' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Phone Number</label>
            <input type="text" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              style={{ width: '100%', padding: '12px 16px', background: 'var(--background)', border: '1.5px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)', boxSizing: 'border-box', outline: 'none', fontSize: '0.88rem' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Password</label>
            <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required
              style={{ width: '100%', padding: '12px 16px', background: 'var(--background)', border: '1.5px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)', boxSizing: 'border-box', outline: 'none', fontSize: '0.88rem' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Role</label>
            <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
              style={{ width: '100%', padding: '12px 16px', background: 'var(--background)', border: '1.5px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)', boxSizing: 'border-box', outline: 'none', fontSize: '0.88rem' }}>
              <option value="CUSTOMER">Customer</option>
              <option value="GUEST">Guest</option>
              <option value="STAFF">Staff (Kitchen / Front Counter)</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <button type="submit" disabled={saving} style={{ marginTop: 12, padding: '14px', background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 20, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.92rem', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 12px rgba(230, 51, 41, 0.2)', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Registering...' : 'Add Account'}
          </button>
        </form>
      </div>
    </div>
  );
};

// 3. Edit User Details Modal
const EditUserModal: React.FC<{ user: StaffUser; onClose: () => void; onSave: () => void }> = ({ user, onClose, onSave }) => {
  const { confirm } = useConfirmation();
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    password: '',
    role: user.role,
  });
  const [saving, setSaving] = useState(false);

  const hasChanges = () => {
    return form.name !== user.name ||
           form.email !== user.email ||
           form.phone !== (user.phone || '') ||
           form.password !== '' ||
           form.role !== user.role;
  };

  useUnsavedChangesBlocker(hasChanges());

  const handleClose = async () => {
    if (hasChanges()) {
      const discard = await confirm({
        title: 'Unsaved Changes',
        message: 'Are you sure you want to discard your edits?',
        confirmLabel: 'Discard',
        cancelLabel: 'Stay',
        type: 'warning'
      });
      if (!discard) return;
    }
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data: Record<string, string> = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        role: form.role,
      };
      if (form.password.trim()) {
        data.password = form.password;
      }
      await staffService.update(user.id, data);
      toast.success('User details updated successfully');
      onSave();
      onClose();
    } catch {
      toast.error('Failed to update user details');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxWidth: 440, background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 24, padding: '24px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Poppins' }}>Edit User Details</h3>
          <button type="button" onClick={handleClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Name</label>
            <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required
              style={{ width: '100%', padding: '12px 16px', background: 'var(--background)', border: '1.5px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)', boxSizing: 'border-box', outline: 'none', fontSize: '0.88rem' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Email</label>
            <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required
              style={{ width: '100%', padding: '12px 16px', background: 'var(--background)', border: '1.5px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)', boxSizing: 'border-box', outline: 'none', fontSize: '0.88rem' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Phone Number</label>
            <input type="text" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              style={{ width: '100%', padding: '12px 16px', background: 'var(--background)', border: '1.5px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)', boxSizing: 'border-box', outline: 'none', fontSize: '0.88rem' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>New Password (leave blank to keep unchanged)</label>
            <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              style={{ width: '100%', padding: '12px 16px', background: 'var(--background)', border: '1.5px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)', boxSizing: 'border-box', outline: 'none', fontSize: '0.88rem' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Role</label>
            <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value as any }))}
              style={{ width: '100%', padding: '12px 16px', background: 'var(--background)', border: '1.5px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)', boxSizing: 'border-box', outline: 'none', fontSize: '0.88rem' }}>
              <option value="CUSTOMER">Customer</option>
              <option value="GUEST">Guest</option>
              <option value="STAFF">Staff (Kitchen / Front Counter)</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <button type="submit" disabled={saving} style={{ marginTop: 12, padding: '14px', background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 20, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.92rem', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 12px rgba(230, 51, 41, 0.2)', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : 'Save Details'}
          </button>
        </form>
      </div>
    </div>
  );
};


/* ─────────────────────────────────────────────────────────────
   SCHEDULED ORDER CARD
   ───────────────────────────────────────────────────────────── */
const getItemEmoji = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('milo') || n.includes('air') || n.includes('drink') || n.includes('teh') || n.includes('kopi')) return '🥤';
  if (n.includes('oblong')) return '🥖';
  if (n.includes('chicken')) return '🍗';
  if (n.includes('beef') || n.includes('wagyu')) return '🥩';
  return '🍔';
};

const formatCustomisationsForStaff = (raw?: string) => {
  if (!raw) return '';
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
        if (c.ingredient.toLowerCase() === 'remarks') return `Remarks: "${c.level}"`;
        if (c.ingredient.toLowerCase() === 'cheese') return 'Extra Cheese';
        return `${c.ingredient} (${c.level.toLowerCase()})`;
      })
      .join(', ');
  } catch {
    return '';
  }
};



/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────────────────────── */
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



  // Search & Filters
  const [search, setSearch] = useState('');
  const [sortByCustomers, setSortByCustomers] = useState<'name-asc' | 'name-desc' | 'created-desc'>('name-asc');
  const [sortByStaff, setSortByStaff] = useState<'name-asc' | 'name-desc' | 'email' | 'role' | 'status'>('name-asc');

  // Expanded row state for Staff Directory
  const [expandedStaff, setExpandedStaff] = useState<number | null>(null);

  // Modals visibility triggers
  const [showAddUser, setShowAddUser] = useState(false);
  const [addUserDefaultRole, setAddUserDefaultRole] = useState<'CUSTOMER' | 'STAFF'>('CUSTOMER');
  const [editUser, setEditUser] = useState<StaffUser | null>(null);
  const [docUser, setDocUser] = useState<StaffUser | null>(null);

  // Customer Orders Modal State
  const [selectedCustomer, setSelectedCustomer] = useState<StaffUser | null>(null);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);

  // Sync tab state from query parameter ?tab=
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam) {
      const clean = tabParam.toLowerCase();
      if (clean === 'staff' && user?.role !== 'ADMIN') {
        setActiveTab('customers');
      } else {
        setActiveTab(clean);
      }
    }
  }, [location, user]);

  const loadAll = () => {
    setLoading(true);
    setError(false);
    Promise.all([
      staffService.getAll(),
      orderService.getAll()
    ]).then(([sRes, ordersRes]) => {
      setUsers(sRes.data);
      setAllOrders(ordersRes.data || []);
      setError(false);
    }).catch(err => {
      setError(true);
      toast.error('Failed to load user directory data');
      console.error(err);
    }).finally(() => setLoading(false));
  };



  useEffect(() => {
    loadAll();
  }, []);

  const handleToggleUserStatus = async (u: StaffUser) => {
    const actionStr = u.isActive ? 'suspend' : 'activate';
    const confirmed = await confirm({
      title: u.isActive ? 'Suspend User Account' : 'Activate User Account',
      message: `Are you sure you want to ${actionStr} the user account for "${u.name}"?`,
      confirmLabel: u.isActive ? 'Suspend' : 'Activate',
      cancelLabel: 'Cancel',
      type: 'warning'
    });
    if (!confirmed) return;
    try {
      await staffService.toggleStatus(u.id);
      toast.success(`User "${u.name}" status updated successfully`);
      loadAll();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDeleteUser = async (u: StaffUser) => {
    const confirmed = await confirm({
      title: 'Delete User Account',
      message: `Are you sure you want to permanently delete the user account for "${u.name}"?`,
      details: 'This action is destructive and cannot be undone.',
      confirmLabel: 'Delete Permanently',
      cancelLabel: 'Cancel',
      type: 'danger'
    });
    if (!confirmed) return;
    try {
      await staffService.delete(u.id);
      toast.success(`User "${u.name}" deleted successfully`);
      loadAll();
    } catch {
      toast.error('Failed to delete user');
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

  const certStatus = (dateStr?: string) => {
    if (!dateStr) return { label: 'Not uploaded', color: 'var(--text-secondary)' };
    const d = new Date(dateStr);
    const now = new Date();
    const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (diff < 0) return { label: 'EXPIRED', color: '#EF4444' };
    if (diff < 30) return { label: `Expires in ${Math.ceil(diff)}d`, color: '#F59E0B' };
    return { label: d.toLocaleDateString('en-MY'), color: '#22C55E' };
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
      if (sortByCustomers === 'created-desc') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return 0;
    });

  const staffList = users
    .filter(u => u.role === 'STAFF' || u.role === 'MANAGER' || u.role === 'ADMIN')
    .filter(u => {
      const q = search.toLowerCase();
      return u.name.toLowerCase().includes(q) ||
             u.email.toLowerCase().includes(q) ||
             (u.phone && u.phone.includes(q)) ||
             u.role.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortByStaff === 'name-asc') return a.name.localeCompare(b.name);
      if (sortByStaff === 'name-desc') return b.name.localeCompare(a.name);
      if (sortByStaff === 'email') return a.email.localeCompare(b.email);
      if (sortByStaff === 'role') return a.role.localeCompare(b.role);
      if (sortByStaff === 'status') {
        if (a.isActive === b.isActive) return a.name.localeCompare(b.name);
        return a.isActive ? -1 : 1;
      }
      return 0;
    });

  if (error) {
    return (
      <ManagerLayout title="Users Directory">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 280px)', width: '100%' }}>
          <ErrorState onRetry={loadAll} retrying={loading} />
        </div>
      </ManagerLayout>
    );
  }

  const tabItems = [
    { id: 'customers', label: 'Customers Directory' },
    ...(user?.role === 'ADMIN' ? [{ id: 'staff', label: 'Staff & Admin Directory' }] : [])
  ];

  return (
    <ManagerLayout
      title="Users Directory"
      subtitle="Manage registered customer accounts and configure staff roles"
      tabs={tabItems.map(t => ({
        id: t.id,
        label: t.label,
        active: activeTab === t.id,
        onClick: () => { setActiveTab(t.id); setSearch(''); navigate(`/manager/users?tab=${t.id}`); }
      }))}
    >
      {/* 1. Modals mount */}
      {docUser && <DocModal staff={docUser} onClose={() => setDocUser(null)} onSave={loadAll} />}
      {showAddUser && <AddUserModal defaultRole={addUserDefaultRole} onClose={() => setShowAddUser(false)} onSave={loadAll} />}
      {editUser && <EditUserModal user={editUser} onClose={() => setEditUser(null)} onSave={loadAll} />}

      {/* 2. CUSTOMERS TAB */}
      {activeTab === 'customers' && (
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
                <option value="created-desc">Registration Date</option>
              </select>
            </div>
            <button
              onClick={() => { setAddUserDefaultRole('CUSTOMER'); setShowAddUser(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', fontSize: '0.8rem', border: 'none', cursor: 'pointer', borderRadius: 12, background: 'var(--primary)', color: '#fff', fontWeight: 700 }}
            >
              <Plus size={14} /> Add Customer
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 60 }}><LoadingSpinner size="lg" /></div>
          ) : (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 800 }}>
                  <thead>
                    <tr style={{ background: 'var(--cream-dark)', borderBottom: '1px solid var(--border)' }}>
                      {['Customer Name', 'Email Address', 'Phone', 'Role', 'Registration Date', 'Status', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '14px 18px', fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {customersList.length === 0 ? (
                      <tr>
                        <td colSpan={7}>
                          <div style={{ padding: 40 }}>
                            <EmptyState title="No customers found" description="No customer profiles match your search criteria." icon={Users} />
                          </div>
                        </td>
                      </tr>
                    ) : (
                      customersList.map(c => {
                        const totalOrdersCount = allOrders.filter(o =>
                          (o.user && o.user.email?.toLowerCase() === c.email?.toLowerCase()) ||
                          (o.user && o.user.name === c.name)
                        ).length;

                        return (
                          <tr key={c.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.86rem', opacity: c.isActive ? 1 : 0.6 }}>
                            <td style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-primary)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(232,69,10,0.15), rgba(232,69,10,0.05))', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem' }}>
                                  {c.name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div>{c.name}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>{c.email}</td>
                            <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>{c.phone || '—'}</td>
                            <td style={{ padding: '14px 18px' }}>
                              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase' }}>{c.role}</span>
                            </td>
                            <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>{new Date(c.createdAt).toLocaleDateString('en-MY')}</td>
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
                                <button onClick={() => setEditUser(c)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4 }} title="Edit Details">
                                  <Edit2 size={13} />
                                </button>
                                <button onClick={() => handleToggleUserStatus(c)} style={{ background: 'none', border: 'none', color: c.isActive ? '#EF4444' : '#22C55E', cursor: 'pointer', padding: 4 }} title={c.isActive ? 'Suspend' : 'Activate'}>
                                  {c.isActive ? <UserX size={13} /> : <UserCheck size={13} />}
                                </button>
                                <button onClick={() => handleDeleteUser(c)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 4 }} title="Delete Profile">
                                  <Trash2 size={13} />
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

      {/* 3. STAFF TAB (ADMIN ONLY) */}
      {activeTab === 'staff' && user?.role === 'ADMIN' && (
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
                placeholder="Search staff, managers or admins..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '0.85rem', flex: 1, outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Sort By</span>
              <select
                value={sortByStaff}
                onChange={e => setSortByStaff(e.target.value as any)}
                style={{ padding: '10px 14px', background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)', outline: 'none', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="email">Email</option>
                <option value="role">Role</option>
                <option value="status">Status (Active First)</option>
              </select>
            </div>
            <button
              onClick={() => { setAddUserDefaultRole('STAFF'); setShowAddUser(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', fontSize: '0.8rem', border: 'none', cursor: 'pointer', borderRadius: 12, background: 'var(--primary)', color: '#fff', fontWeight: 700 }}
            >
              <Plus size={14} /> Add Staff
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 60 }}><LoadingSpinner size="lg" /></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {staffList.length === 0 ? (
                <EmptyState title="No staff members found" description="No staff profiles match your search criteria." icon={Shield} />
              ) : (
                staffList.map(s => {
                  const isExpanded = expandedStaff === s.id;
                  const typhoidStat = certStatus(s.typhoidExpiry);
                  const foodStat = certStatus(s.foodHandlerExpiry);
                  const isStaffOrManager = s.role === 'STAFF' || s.role === 'MANAGER';
                  const hasExpiredDoc = isStaffOrManager && (typhoidStat.color === '#EF4444' || foodStat.color === '#EF4444');

                  return (
                    <div key={s.id} style={{
                      background: 'var(--surface)',
                      border: `1.5px solid ${hasExpiredDoc ? 'rgba(239,68,68,0.25)' : 'var(--border)'}`,
                      borderRadius: 16, overflow: 'hidden', opacity: s.isActive ? 1 : 0.6,
                      boxShadow: 'var(--shadow-sm)'
                    }}>
                      {/* main row */}
                      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--cream-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.82rem', border: '1px solid var(--border)' }}>
                          {s.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>{s.name}</div>
                          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: 3, fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={11} />{s.email}</span>
                            {s.phone && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={11} />{s.phone}</span>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: s.role === 'MANAGER' ? 'rgba(255,107,0,0.1)' : (s.role === 'ADMIN' ? 'rgba(239,68,68,0.1)' : 'var(--cream-dark)'), color: s.role === 'MANAGER' ? 'var(--primary)' : (s.role === 'ADMIN' ? 'var(--red)' : 'var(--text-primary)') }}>
                            <Shield size={10} style={{ display: 'inline', marginRight: 3, verticalAlign: 'middle' }} /> {s.role}
                          </span>

                          {hasExpiredDoc && <span style={{ fontSize: '0.7rem', background: 'rgba(239,68,68,0.1)', color: '#EF4444', padding: '3px 8px', borderRadius: 6, fontWeight: 800 }}>⚠️ Expired Docs</span>}

                          <button onClick={() => setEditUser(s)} style={{ padding: '6px 10px', fontSize: '0.78rem', background: 'var(--cream-dark)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
                            <Edit2 size={12} /> Edit
                          </button>

                          {isStaffOrManager && (
                            <button onClick={() => setDocUser(s)} style={{ padding: '6px 10px', fontSize: '0.78rem', background: 'var(--cream-dark)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
                              <FileText size={12} /> Docs
                            </button>
                          )}

                          <button onClick={() => handleToggleUserStatus(s)} style={{ background: 'none', border: 'none', color: s.isActive ? '#EF4444' : '#22C55E', cursor: 'pointer', padding: 6 }}>
                            {s.isActive ? <UserX size={15} /> : <UserCheck size={15} />}
                          </button>
                          <button onClick={() => handleDeleteUser(s)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 6 }}><Trash2 size={15} /></button>

                          {isStaffOrManager && (
                            <button onClick={() => setExpandedStaff(isExpanded ? null : s.id)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4 }}>
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expanded docs drawer */}
                      {isExpanded && isStaffOrManager && (
                        <div style={{ borderTop: '1px solid var(--border)', padding: '14px 20px', background: 'var(--cream-dark)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
                          {[
                            { label: 'IC Number', value: s.icNumber || '—', color: 'var(--text-primary)' },
                            { label: 'Typhoid Cert', value: typhoidStat.label, color: typhoidStat.color },
                            { label: 'Food Handler Cert', value: foodStat.label, color: foodStat.color },
                            { label: 'Emergency Contact', value: s.emergencyContactName ? `${s.emergencyContactName} (${s.emergencyContactPhone || '—'})` : '—', color: 'var(--text-primary)' },
                          ].map((d, i) => (
                            <div key={i}>
                              <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{d.label}</div>
                              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: d.color }}>{d.value}</div>
                            </div>
                          ))}
                          {s.notes && (
                            <div style={{ gridColumn: '1 / -1' }}>
                              <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Admin Notes</div>
                              <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{s.notes}</div>
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
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>No orders placed by this customer yet.</div>
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
