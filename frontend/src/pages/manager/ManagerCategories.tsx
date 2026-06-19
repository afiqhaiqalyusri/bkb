import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Tag, RefreshCw } from 'lucide-react';
import { ManagerLayout } from './ManagerDashboard';
import { categoryService } from '../../services/category.service';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Category } from '../../types';
import { ErrorState } from '../../components/ui/ErrorState';
import toast from 'react-hot-toast';
import { useConfirmation } from '../../components/ConfirmationProvider';

export const ManagerCategories: React.FC = () => {
  const { confirm } = useConfirmation();
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    categoryService.getAll()
      .then(r => {
        setCats(r.data);
        setError(false);
      })
      .catch((err) => {
        setError(true);
        toast.error('Failed to load categories');
        console.error(err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await categoryService.create(newName.trim());
      toast.success('Category created');
      setNewName('');
      load();
    } catch { toast.error('Failed to create category'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number, name: string) => {
    const confirmed = await confirm({
      title: 'Delete Category',
      message: `Are you sure you want to delete the category "${name}"?`,
      type: 'danger',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel'
    });
    if (!confirmed) return;
    try {
      await categoryService.delete(id);
      toast.success('Category deleted');
      load();
    } catch { toast.error('Failed to delete'); }
  };

  if (error) {
    return (
      <ManagerLayout title="Categories" subtitle="Manage menu item categories">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 280px)', width: '100%' }}>
          <ErrorState onRetry={load} retrying={loading} />
        </div>
      </ManagerLayout>
    );
  }

  return (
    <ManagerLayout title="Categories" subtitle="Manage menu item categories">
      {/* Add form */}
      <div style={{ background: 'var(--bkb-card-bg)', border: '1px solid var(--bkb-border)', borderRadius: 16, padding: 24, marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '0.95rem', fontWeight: 700 }}>Add New Category</h3>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 12 }}>
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="e.g. Pasta, Desserts..."
            style={{ flex: 1, padding: '10px 14px', background: 'var(--bkb-dark)', border: '1px solid var(--bkb-border)', borderRadius: 8, color: 'var(--bkb-text)', fontSize: '0.9rem' }}
            required
          />
          <button className="bkb-btn-primary" type="submit" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px' }}>
            <Plus size={16} /> Add Category
          </button>
        </form>
      </div>

      {/* Category grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><LoadingSpinner size="lg" /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
          {cats.map(cat => (
            <div key={cat.id} style={{
              background: 'var(--bkb-card-bg)', border: '1px solid var(--bkb-border)',
              borderRadius: 14, padding: '18px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(232,69,10,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bkb-orange)' }}>
                  <Tag size={16} />
                </div>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{cat.name}</span>
              </div>
              <button
                onClick={() => handleDelete(cat.id, cat.name)}
                style={{ background: 'none', border: 'none', color: 'var(--bkb-gray-400)', cursor: 'pointer', padding: 4 }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </ManagerLayout>
  );
};
