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
import { AppTable, Column } from '../../components/ui/AppTable';
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

  const columns: Column<Category>[] = [
    {
      header: 'Category Name',
      accessor: 'name',
      render: (cat) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center shrink-0">
            <Tag size={14} />
          </div>
          <span className="font-bold text-[var(--text-primary)]">{cat.name}</span>
        </div>
      )
    },
    {
      header: 'Actions',
      align: 'right',
      render: (cat) => (
        <AppButton
          variant="ghost"
          size="icon"
          onClick={() => handleDelete(cat.id, cat.name)}
          className="text-[var(--danger)] hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
          title={`Delete ${cat.name}`}
        >
          <Trash2 size={16} />
        </AppButton>
      )
    }
  ];

  return (
    <ManagerLayout title="Categories" subtitle="Manage menu item categories">
      <div className="flex flex-col gap-6 max-w-3xl">

        {/* Add Form */}
        <AppCard title="Add New Category" subtitle="Create a new food category to organise your menu items">
          <form onSubmit={handleAdd} className="flex gap-3">
            <div className="flex-1 relative">
              <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none" />
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. Pasta, Desserts, Specials…"
                className="w-full pl-9 pr-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)]"
                required
              />
            </div>
            <AppButton type="submit" icon={Plus} isLoading={saving} size="md">
              Add Category
            </AppButton>
          </form>
        </AppCard>

        {/* Category List */}
        <AppCard title={`Categories (${cats.length})`} subtitle="All available menu categories" noPadding>
          <AppTable
            columns={columns}
            data={cats}
            keyExtractor={cat => cat.id}
            loading={loading}
            emptyTitle="No categories yet"
            emptyMessage="Add your first category above to start organising your menu."
            emptyIcon={Tag}
          />
        </AppCard>
      </div>
    </ManagerLayout>
  );
};
