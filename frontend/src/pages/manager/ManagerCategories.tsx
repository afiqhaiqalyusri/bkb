import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Tag } from 'lucide-react';
import { ManagerLayout } from '../../components/layout/ManagerLayout';
import { categoryService } from '../../services/category.service';
import { Category } from '../../types';
import { ErrorState } from '../../components/ui/ErrorState';
import toast from 'react-hot-toast';
import { useConfirmation } from '../../components/ConfirmationProvider';

// UI Components
import { AppCard } from '../../components/ui/AppCard';
import { AppButton } from '../../components/ui/AppButton';
import { AppEmptyState } from '../../components/ui/AppEmptyState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { formControlStyle } from '../../components/ui/AppFormField';

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
      .then(r => { setCats(r.data); setError(false); })
      .catch(() => { setError(true); toast.error('Failed to load categories'); })
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
      message: `Are you sure you want to delete the category "${name}"? This may affect existing menu items.`,
      type: 'danger',
      confirmLabel: 'Delete Category',
      cancelLabel: 'Cancel',
    });
    if (!confirmed) return;
    try {
      await categoryService.delete(id);
      toast.success('Category deleted');
      load();
    } catch { toast.error('Failed to delete category'); }
  };

  if (error) {
    return (
      <ManagerLayout title="Categories" subtitle="Manage menu item categories">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 280px)' }}>
          <ErrorState onRetry={load} retrying={loading} />
        </div>
      </ManagerLayout>
    );
  }

  return (
    <ManagerLayout title="Categories" subtitle="Manage menu item categories">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 720 }}>

        {/* Add Form */}
        <AppCard title="Add New Category" subtitle="Create a new food category to organise your menu items">
          <form onSubmit={handleAdd} style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Tag size={15} style={{
                position: 'absolute', left: 12, top: '50%',
                transform: 'translateY(-50%)', color: 'var(--text-secondary)',
                pointerEvents: 'none',
              }} />
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. Pasta, Desserts, Specials…"
                style={{ ...formControlStyle, paddingLeft: 36 }}
                required
              />
            </div>
            <AppButton type="submit" icon={Plus} isLoading={saving} size="md">
              Add Category
            </AppButton>
          </form>
        </AppCard>

        {/* Category List */}
        <AppCard title={`Categories (${cats.length})`} subtitle="All available menu categories">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
              <LoadingSpinner size="md" />
            </div>
          ) : cats.length === 0 ? (
            <AppEmptyState
              title="No categories yet"
              description="Add your first category above to start organising your menu."
              icon={Tag}
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {cats.map(cat => (
                <div
                  key={cat.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    background: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 8,
                      background: 'rgba(255,107,0,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--primary)', flexShrink: 0,
                    }}>
                      <Tag size={15} />
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                      {cat.name}
                    </span>
                  </div>
                  <AppButton
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(cat.id, cat.name)}
                    className="text-[var(--text-secondary)] hover:text-[var(--danger)] hover:bg-red-50"
                    title={`Delete ${cat.name}`}
                  >
                    <Trash2 size={15} />
                  </AppButton>
                </div>
              ))}
            </div>
          )}
        </AppCard>
      </div>
    </ManagerLayout>
  );
};
