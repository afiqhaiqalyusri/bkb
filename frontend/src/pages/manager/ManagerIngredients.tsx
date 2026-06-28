import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ChevronRight, AlertCircle, Sparkles, Image as ImageIcon, Search, Sliders } from 'lucide-react';
import { ManagerLayout } from '../../components/layout/ManagerLayout';
import { ingredientService } from '../../services/ingredient.service';
import { menuService } from '../../services/menu.service';
import { categoryService } from '../../services/category.service';
import { MenuItem, MenuItemIngredient, Category } from '../../types';
import { ErrorState } from '../../components/ui/ErrorState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { useConfirmation } from '../../components/ConfirmationProvider';

// UI Components
import { AppCard } from '../../components/ui/AppCard';
import { AppButton } from '../../components/ui/AppButton';
import { AppBadge } from '../../components/ui/AppBadge';
import { AppEmptyState } from '../../components/ui/AppEmptyState';
import { AppTable, Column } from '../../components/ui/AppTable';

export const IngredientsContent: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [ingredients, setIngredients] = useState<MenuItemIngredient[]>([]);
  const { confirm } = useConfirmation();

  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('');
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);

  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingIngredients, setLoadingIngredients] = useState(false);
  const [error, setError] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<MenuItemIngredient | null>(null);
  const [form, setForm] = useState({ ingredientName: '', defaultLevel: 'MEDIUM' as 'NONE' | 'LESS' | 'MEDIUM' | 'EXTRA' });
  const [submitting, setSubmitting] = useState(false);

  const loadInitialData = async () => {
    try {
      setLoadingCats(true); setError(false);
      const [catsRes, itemsRes] = await Promise.all([categoryService.getAll(), menuService.getAllItems()]);
      setCategories(catsRes.data); setMenuItems(itemsRes.data);
      if (catsRes.data.length > 0) setSelectedCategoryName(catsRes.data[0].name);
    } catch (err) { setError(true); toast.error('Failed to load menu data'); } 
    finally { setLoadingCats(false); }
  };

  useEffect(() => { loadInitialData(); }, []);

  const filteredMenuItems = menuItems.filter(item => item.category === selectedCategoryName);

  useEffect(() => {
    if (selectedMenuItem) loadIngredients(selectedMenuItem.id);
    else setIngredients([]);
  }, [selectedMenuItem]);

  const loadIngredients = async (menuItemId: number) => {
    try {
      setLoadingIngredients(true);
      const res = await ingredientService.getByMenuItem(menuItemId);
      setIngredients(res.data);
    } catch { toast.error('Failed to load customizations'); } 
    finally { setLoadingIngredients(false); }
  };

  const handleOpenAdd = () => {
    setEditingIngredient(null); setForm({ ingredientName: '', defaultLevel: 'MEDIUM' }); setShowModal(true);
  };

  const handleOpenEdit = (ing: MenuItemIngredient) => {
    setEditingIngredient(ing); setForm({ ingredientName: ing.ingredientName, defaultLevel: ing.defaultLevel }); setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMenuItem) return;
    if (!form.ingredientName.trim()) { toast.error('Ingredient name is required'); return; }

    const isEdit = !!editingIngredient;
    const confirmed = await confirm({
      title: isEdit ? 'Save Customization Changes' : 'Add Customization Option',
      message: isEdit ? `Save changes for "${form.ingredientName.trim()}"?` : `Add customization "${form.ingredientName.trim()}" to "${selectedMenuItem.name}"?`,
      confirmLabel: isEdit ? 'Save Changes' : 'Add Option', cancelLabel: 'Cancel', type: 'warning'
    });
    if (!confirmed) return;

    setSubmitting(true);
    try {
      if (isEdit && editingIngredient) {
        await ingredientService.update(editingIngredient.id, { menuItemId: selectedMenuItem.id, ingredientName: form.ingredientName.trim(), defaultLevel: form.defaultLevel });
        toast.success('Customization updated');
      } else {
        await ingredientService.create({ menuItemId: selectedMenuItem.id, ingredientName: form.ingredientName.trim(), defaultLevel: form.defaultLevel });
        toast.success('Customization option added');
      }
      setShowModal(false); loadIngredients(selectedMenuItem.id);
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to save customization option'); } 
    finally { setSubmitting(false); }
  };

  const handleDelete = async (ing: MenuItemIngredient) => {
    if (!selectedMenuItem) return;
    const confirmed = await confirm({
      title: 'Delete Customization Option', message: `Permanently delete "${ing.ingredientName}" from "${selectedMenuItem.name}"?`,
      confirmLabel: 'Delete Option', cancelLabel: 'Cancel', type: 'danger'
    });
    if (!confirmed) return;
    try { await ingredientService.delete(ing.id); toast.success('Customization deleted'); loadIngredients(selectedMenuItem.id); } 
    catch { toast.error('Failed to delete customization'); }
  };

  if (error) return <div className="flex items-center justify-center min-h-[50vh]"><ErrorState onRetry={loadInitialData} retrying={loadingCats} /></div>;

  const cols: Column<MenuItemIngredient>[] = [
    { header: 'Ingredient Name', accessor: 'ingredientName' },
    { 
      header: 'Default Level', 
      render: (ing) => {
        const variants: Record<string, 'danger' | 'warning' | 'neutral' | 'primary'> = {
          'NONE': 'danger', 'LESS': 'warning', 'MEDIUM': 'neutral', 'EXTRA': 'primary'
        };
        return <AppBadge variant={variants[ing.defaultLevel] || 'neutral'} text={ing.defaultLevel} />;
      }
    },
    { 
      header: '', 
      align: 'right',
      render: (ing) => (
        <div className="flex gap-1 justify-end">
          <AppButton variant="ghost" size="icon" onClick={() => handleOpenEdit(ing)}><Edit2 size={16} /></AppButton>
          <AppButton variant="ghost" size="icon" onClick={() => handleDelete(ing)} className="text-[var(--danger)] hover:text-red-700 hover:bg-red-50"><Trash2 size={16} /></AppButton>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col md:flex-row gap-6 min-h-[calc(100vh-200px)]">
      {/* Left Sidebar */}
      <div className="w-full md:w-72 flex flex-col gap-4 shrink-0">
        <AppCard title="Categories" className="!p-4" noPadding>
          <div className="flex flex-col gap-1 px-4 py-3 max-h-[300px] overflow-y-auto">
            {loadingCats ? (
              <div className="flex justify-center p-4"><LoadingSpinner size="sm" /></div>
            ) : (
              categories.map(cat => {
                const active = selectedCategoryName === cat.name;
                return (
                  <button key={cat.id} onClick={() => { setSelectedCategoryName(cat.name); setSelectedMenuItem(null); }}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${active ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--background)]'}`}>
                    <span>{cat.name}</span>
                    {active && <ChevronRight size={16} />}
                  </button>
                );
              })
            )}
          </div>
        </AppCard>

        <AppCard title={`Menu Items (${filteredMenuItems.length})`} className="!p-4" noPadding>
          <div className="flex flex-col gap-1 px-4 py-3 max-h-[500px] overflow-y-auto">
            {filteredMenuItems.length === 0 ? (
              <div className="text-center text-sm text-[var(--text-secondary)] p-4">No items in category</div>
            ) : (
              filteredMenuItems.map(item => {
                const active = selectedMenuItem?.id === item.id;
                return (
                  <button key={item.id} onClick={() => setSelectedMenuItem(item)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${active ? 'bg-[var(--primary)]/10 border border-[var(--primary)]/20' : 'bg-[var(--background)] border border-transparent hover:border-[var(--border)]'}`}>
                    <div className="w-8 h-8 rounded bg-[var(--surface)] flex items-center justify-center shrink-0 border border-[var(--border)] overflow-hidden">
                      {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" /> : <ImageIcon size={14} className="text-[var(--text-secondary)]" />}
                    </div>
                    <span className={`font-semibold truncate ${active ? 'text-[var(--primary)]' : 'text-[var(--text-primary)]'}`}>{item.name}</span>
                  </button>
                );
              })
            )}
          </div>
        </AppCard>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-4">
        {!selectedMenuItem ? (
          <AppCard className="h-full flex items-center justify-center">
            <AppEmptyState title="Select a Menu Item" description="Choose a category and select an item from the left panel to configure its customizable ingredients." icon={Search} />
          </AppCard>
        ) : (
          <AppCard title={selectedMenuItem.name} subtitle={selectedMenuItem.description || 'No description provided.'} className="h-full" headerAction={
            <AppButton variant="primary" size="sm" icon={Plus} onClick={handleOpenAdd}>Add Option</AppButton>
          }>
            {loadingIngredients ? (
              <div className="flex justify-center p-12"><LoadingSpinner size="md" /></div>
            ) : ingredients.length === 0 ? (
              <AppEmptyState title="No customization options" description="Customers will not be prompted for customizable ingredients for this item." icon={Sliders} />
            ) : (
              <AppTable columns={cols} data={ingredients} keyExtractor={(i) => i.id} />
            )}
          </AppCard>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-md overflow-hidden shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--background)]">
              <h3 className="font-bold text-lg m-0 flex items-center gap-2"><Sparkles size={18} className="text-[var(--primary)]" /> {editingIngredient ? 'Edit' : 'Add'} Customization</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Ingredient Name</label>
                <input type="text" placeholder="e.g. Cheese Slice, Onion" value={form.ingredientName} onChange={e => setForm({ ...form, ingredientName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)]" required />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Default Level</label>
                <select value={form.defaultLevel} onChange={e => setForm({ ...form, defaultLevel: e.target.value as any })}
                  className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)]">
                  <option value="NONE">NONE (Opt-in only)</option>
                  <option value="LESS">LESS</option>
                  <option value="MEDIUM">MEDIUM (Standard include)</option>
                  <option value="EXTRA">EXTRA</option>
                </select>
                <p className="text-xs text-[var(--text-secondary)] mt-2 mb-0">Specifies the default inclusion state when a customer orders.</p>
              </div>

              <div className="flex gap-3 mt-2">
                <AppButton type="button" variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</AppButton>
                <AppButton type="submit" variant="primary" className="flex-1" disabled={submitting}>{submitting ? 'Saving...' : 'Save Options'}</AppButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const ManagerIngredients: React.FC = () => {
  return (
    <ManagerLayout title="Customization Options">
      <IngredientsContent />
    </ManagerLayout>
  );
};
