import React, { useState, useEffect, useCallback } from 'react';
import {
  ChefHat, Plus, Trash2, Edit2, Search, Package,
  X, Check, AlertTriangle, Info, ChevronRight,
  Save, FileText, Layers
} from 'lucide-react';
import { ManagerLayout } from '../../components/layout/ManagerLayout';
import { recipeService } from '../../services/recipe.service';
import { inventoryService } from '../../services/inventory.service';
import { menuService } from '../../services/menu.service';
import { categoryService } from '../../services/category.service';
import { Recipe, RecipeIngredientItem, RecipeIngredientRequest, InventoryItem, MenuItem, Category } from '../../types';
import toast from 'react-hot-toast';

// UI Components
import { AppCard } from '../../components/ui/AppCard';
import { AppButton } from '../../components/ui/AppButton';
import { AppBadge } from '../../components/ui/AppBadge';
import { AppModal } from '../../components/ui/AppModal';
import { AppFormField, formControlStyle } from '../../components/ui/AppFormField';
import { AppEmptyState } from '../../components/ui/AppEmptyState';
import { AppTable, Column } from '../../components/ui/AppTable';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { formatRM } from '../../utils/formatCurrency';

// ─── Ingredient Form Modal ────────────────────────────────────────────────────
interface IngredientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: RecipeIngredientRequest[]) => Promise<void>;
  onEdit: (data: RecipeIngredientRequest) => Promise<void>;
  inventoryItems: InventoryItem[];
  editingIngredient: RecipeIngredientItem | null;
  saving: boolean;
}

const IngredientFormModal: React.FC<IngredientFormModalProps> = ({
  isOpen, onClose, onAdd, onEdit, inventoryItems, editingIngredient, saving
}) => {
  const [selectedItems, setSelectedItems] = useState<Record<number, { quantity: number; isOptional: boolean }>>({});
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (editingIngredient) {
      setSelectedItems({
        [editingIngredient.inventoryId]: { quantity: editingIngredient.quantity, isOptional: editingIngredient.isOptional }
      });
    } else {
      setSelectedItems({});
    }
    setSearch('');
  }, [editingIngredient, isOpen]);

  const filtered = inventoryItems.filter(i =>
    i.itemName.toLowerCase().includes(search.toLowerCase()) ||
    (i.category || '').toLowerCase().includes(search.toLowerCase())
  );

  const toggleItem = (itemId: number) => {
    if (editingIngredient) return; // Cannot toggle when editing a specific ingredient
    setSelectedItems(prev => {
      const next = { ...prev };
      if (next[itemId]) {
        delete next[itemId];
      } else {
        next[itemId] = { quantity: 1, isOptional: false };
      }
      return next;
    });
  };

  const updateItem = (itemId: number, field: 'quantity' | 'isOptional', value: number | boolean) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const keys = Object.keys(selectedItems);
    if (keys.length === 0) {
      toast.error('Please select at least one inventory item');
      return;
    }
    for (const key of keys) {
      if (selectedItems[Number(key)].quantity <= 0) {
        toast.error('Quantities must be greater than 0');
        return;
      }
    }
    
    if (editingIngredient) {
      const data = selectedItems[editingIngredient.inventoryId];
      await onEdit({ inventoryId: editingIngredient.inventoryId, ...data });
    } else {
      const payload = keys.map(k => ({
        inventoryId: Number(k),
        ...selectedItems[Number(k)]
      }));
      await onAdd(payload);
    }
  };

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingIngredient ? 'Edit Recipe Ingredient' : 'Add Ingredients to Recipe'}
      subtitle={editingIngredient ? 'Update the quantity or optional status' : 'Select one or more inventory items to add'}
      icon={<Package size={18} className="text-[var(--primary)]" />}
      size="md"
      onSubmit={handleSubmit}
      actions={[
        { label: 'Cancel', variant: 'outline', onClick: onClose },
        { label: editingIngredient ? 'Save Changes' : 'Add Ingredients', variant: 'primary', isLoading: saving, type: 'submit', onClick: () => {} },
      ]}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Inventory Item Selector */}
        {!editingIngredient && (
          <div style={{ position: 'relative' }}>
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none" />
            <input
              type="text"
              placeholder="Search inventory items…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
            />
          </div>
        )}
        
        <div className={`overflow-y-auto border border-[var(--border)] rounded-xl bg-[var(--background)] shadow-sm ${editingIngredient ? '' : 'max-h-[160px]'}`}>
          {filtered.length === 0 ? (
            <div className="p-4 text-sm text-[var(--text-secondary)] text-center">
              No inventory items found
            </div>
          ) : (
            filtered.map(item => {
              if (editingIngredient && item.id !== editingIngredient.inventoryId) return null;
              const isSelected = !!selectedItems[item.id];
              return (
                <div
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className={`flex items-center justify-between p-3 border-b border-[var(--border)] transition-colors last:border-0 ${editingIngredient ? '' : 'cursor-pointer hover:bg-[var(--surface)]'} ${isSelected ? 'bg-[var(--primary)]/5' : ''}`}
                >
                  <div>
                    <div className="font-semibold text-sm text-[var(--text-primary)]">
                      {item.itemName}
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)] mt-0.5 font-medium">
                      {item.category} · {item.unit} · Stock: {item.currentStock}
                    </div>
                  </div>
                  {isSelected && <Check size={16} className="text-[var(--primary)] shrink-0" />}
                </div>
              );
            })
          )}
        </div>

        {/* Quantities Section */}
        {Object.keys(selectedItems).length > 0 && (
          <div className="flex flex-col gap-3 mt-2">
            <h4 className="font-bold text-sm text-[var(--text-primary)]">Configure Quantities</h4>
            <div className="max-h-[250px] overflow-y-auto pr-1 flex flex-col gap-2">
              {Object.keys(selectedItems).map(idStr => {
                const id = Number(idStr);
                const item = inventoryItems.find(i => i.id === id);
                const data = selectedItems[id];
                if (!item) return null;
                return (
                  <div key={id} className="p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl flex flex-col sm:flex-row gap-3 sm:items-center justify-between animate-fade-in">
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-[var(--text-primary)]">{item.itemName}</span>
                      <span className="text-xs text-[var(--text-secondary)]">Unit: {item.unit}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="number" min="0.01" step="0.01" 
                        value={data.quantity} 
                        onChange={e => updateItem(id, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-24 px-2 py-1.5 bg-[var(--background)] border border-[var(--border)] rounded text-sm text-center focus:outline-none focus:border-[var(--primary)]"
                        placeholder="Qty"
                      />
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={data.isOptional} onChange={e => updateItem(id, 'isOptional', e.target.checked)} className="w-4 h-4 accent-[var(--primary)]" />
                        <span className="text-xs font-medium text-[var(--text-secondary)]">Optional</span>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppModal>
  );
};

// ─── Notes Editor ─────────────────────────────────────────────────────────────
const NotesEditor: React.FC<{
  notes: string;
  onSave: (notes: string) => Promise<void>;
  saving: boolean;
}> = ({ notes: initialNotes, onSave, saving }) => {
  const [value, setValue] = useState(initialNotes || '');
  const [dirty, setDirty] = useState(false);

  useEffect(() => { setValue(initialNotes || ''); setDirty(false); }, [initialNotes]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <textarea
        value={value}
        onChange={e => { setValue(e.target.value); setDirty(true); }}
        placeholder="e.g. Toast bun separately. Grill patty to 75°C internal temp. Apply sauce before closing bun."
        rows={4}
        className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-[var(--primary)] transition-colors resize-y leading-relaxed"
      />
      {dirty && (
        <div className="flex justify-end">
          <AppButton size="sm" icon={Save} isLoading={saving} onClick={() => onSave(value)} variant="primary">
            Save Notes
          </AppButton>
        </div>
      )}
    </div>
  );
};

// ─── Manager Recipes Page (Main) ──────────────────────────────────────────────
export const ManagerRecipes: React.FC = () => {
  // Panel 1: Category filter
  const [categories, setCategories] = useState<string[]>(['All']);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Panel 2: Menu item list
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [menuSearch, setMenuSearch] = useState('');
  const [menuLoading, setMenuLoading] = useState(true);

  // Panel 3: Recipe editor
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);

  // Modal state
  const [showIngredientModal, setShowIngredientModal] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<RecipeIngredientItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [notesSaving, setNotesSaving] = useState(false);

  // Load menu items and categories on mount
  useEffect(() => {
    Promise.all([
      menuService.getAllItems(),
      inventoryService.getAll(),
    ]).then(([menuRes, invRes]) => {
      const items = menuRes.data || [];
      setMenuItems(items);
      const cats = ['All', ...Array.from(new Set(items.map((i: MenuItem) => i.category).filter(Boolean)))];
      setCategories(cats as string[]);
      setInventoryItems(invRes.data || []);
    }).catch(() => toast.error('Failed to load data'))
    .finally(() => { setMenuLoading(false); setInventoryLoading(false); });
  }, []);

  // Load recipe when a menu item is selected
  const loadRecipe = useCallback(async (menuItemId: number) => {
    setRecipeLoading(true);
    try {
      const res = await recipeService.getByMenuItem(menuItemId);
      setRecipe(res.data);
    } catch {
      toast.error('Failed to load recipe');
    } finally {
      setRecipeLoading(false);
    }
  }, []);

  const handleSelectItem = (item: MenuItem) => {
    setSelectedItem(item);
    loadRecipe(item.id);
  };

  const filteredItems = menuItems.filter(item => {
    const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchSearch = !menuSearch || item.name.toLowerCase().includes(menuSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  // Add ingredient
  const handleAddIngredient = async (data: RecipeIngredientRequest[]) => {
    if (!selectedItem) return;
    setSaving(true);
    try {
      let finalRecipe = recipe;
      for (const req of data) {
        const res = await recipeService.addIngredient(selectedItem.id, req);
        finalRecipe = res.data;
      }
      setRecipe(finalRecipe);
      setShowIngredientModal(false);
      toast.success(`Added ${data.length} ingredient(s)`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to add ingredients');
    } finally {
      setSaving(false);
    }
  };

  // Edit ingredient
  const handleEditIngredient = async (data: RecipeIngredientRequest) => {
    if (!selectedItem || !editingIngredient) return;
    setSaving(true);
    try {
      const res = await recipeService.updateIngredient(selectedItem.id, editingIngredient.id, data);
      setRecipe(res.data);
      setShowIngredientModal(false);
      setEditingIngredient(null);
      toast.success('Ingredient updated');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update ingredient');
    } finally {
      setSaving(false);
    }
  };

  // Remove ingredient
  const handleRemoveIngredient = async (ingredientId: number) => {
    if (!selectedItem) return;
    try {
      const res = await recipeService.removeIngredient(selectedItem.id, ingredientId);
      setRecipe(res.data);
      toast.success('Ingredient removed');
    } catch {
      toast.error('Failed to remove ingredient');
    }
  };

  // Save notes
  const handleSaveNotes = async (notes: string) => {
    if (!selectedItem) return;
    setNotesSaving(true);
    try {
      const res = await recipeService.updateNotes(selectedItem.id, notes);
      setRecipe(res.data);
      toast.success('Preparation notes saved');
    } catch {
      toast.error('Failed to save notes');
    } finally {
      setNotesSaving(false);
    }
  };

  const openAddModal = () => { setEditingIngredient(null); setShowIngredientModal(true); };
  const openEditModal = (ing: RecipeIngredientItem) => { setEditingIngredient(ing); setShowIngredientModal(true); };

  const ingredientColumns: Column<RecipeIngredientItem>[] = [
    {
      header: 'Ingredient',
      render: (ing) => (
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${ing.trackingType === 'AUTO' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'}`}>
            <Package size={14} />
          </div>
          <div>
            <div className="font-bold text-[var(--text-primary)] flex items-center gap-2">
              {ing.inventoryName}
              {ing.isOptional && <span className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">Optional</span>}
            </div>
            <div className="text-[11px] text-[var(--text-secondary)] mt-0.5 font-medium bg-[var(--surface)] border border-[var(--border)] px-1.5 py-0.5 rounded inline-block">
              {ing.trackingType}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Required Quantity',
      render: (ing) => (
        <span className="font-bold text-[var(--text-primary)]">{ing.quantity} <span className="text-[var(--text-secondary)] font-medium text-xs">{ing.unit}</span></span>
      )
    },
    {
      header: 'Stock Status',
      render: (ing) => (
        <div className="flex items-center gap-2">
          <AppBadge variant={ing.stockStatus === 'CRITICAL' ? 'danger' : ing.stockStatus === 'LOW' ? 'warning' : 'success'} text={`${ing.currentStock} ${ing.unit}`} icon />
        </div>
      )
    },
    {
      header: 'Actions',
      align: 'right',
      render: (ing) => (
        <div className="flex gap-2 justify-end">
          <AppButton variant="ghost" size="icon" onClick={() => openEditModal(ing)}><Edit2 size={16} /></AppButton>
          <AppButton variant="ghost" size="icon" onClick={() => handleRemoveIngredient(ing.id)} className="text-[var(--danger)] hover:text-red-700 hover:bg-red-50"><Trash2 size={16} /></AppButton>
        </div>
      )
    }
  ];

  return (
    <ManagerLayout
      title="Recipe Management"
      subtitle="Define standard ingredients required to prepare each menu item"
    >
      <div className="grid grid-cols-1 md:grid-cols-[200px_280px_1fr] gap-4 md:gap-6 min-h-[calc(100vh-140px)]">

        {/* ── Panel 1: Category Selector ── */}
        <AppCard className="!p-0 flex flex-col h-[300px] md:h-full">
          <div className="px-4 py-3 border-b border-[var(--border)] bg-gray-50 dark:bg-slate-800/50 shrink-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Categories
            </span>
          </div>
          <div className="overflow-y-auto p-2 flex-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors mb-1 ${selectedCategory === cat ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-bold' : 'text-[var(--text-secondary)] font-medium hover:bg-[var(--background)]'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </AppCard>

        {/* ── Panel 2: Menu Item List ── */}
        <AppCard className="!p-0 flex flex-col h-[400px] md:h-full">
          <div className="px-4 py-3 border-b border-[var(--border)] bg-gray-50 dark:bg-slate-800/50 shrink-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Menu Items ({filteredItems.length})
            </span>
            <div className="relative mt-2">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none" />
              <input
                type="text"
                placeholder="Search items…"
                value={menuSearch}
                onChange={e => setMenuSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-[var(--background)] border border-[var(--border)] rounded text-xs focus:outline-none focus:border-[var(--primary)] transition-colors"
              />
            </div>
          </div>
          <div className="overflow-y-auto p-2 flex-1">
            {menuLoading ? (
              <div className="flex justify-center p-6"><LoadingSpinner size="sm" /></div>
            ) : filteredItems.length === 0 ? (
              <div className="py-12"><AppEmptyState title="No items" icon={ChefHat} /></div>
            ) : (
              filteredItems.map(item => {
                const isSelected = selectedItem?.id === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    className={`w-full text-left p-2 rounded-lg flex items-center gap-3 transition-colors mb-1 border border-transparent ${isSelected ? 'bg-[var(--primary)]/10 border-[var(--primary)]/20' : 'hover:bg-[var(--background)] hover:border-[var(--border)]'}`}
                  >
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-10 h-10 rounded-md object-cover shrink-0 border border-[var(--border)]" />
                    ) : (
                      <div className="w-10 h-10 rounded-md bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center shrink-0 border border-[var(--primary)]/20">
                        <ChefHat size={16} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm truncate ${isSelected ? 'font-bold text-[var(--primary)]' : 'font-semibold text-[var(--text-primary)]'}`}>
                        {item.name}
                      </div>
                      <div className="text-[11px] text-[var(--text-secondary)] truncate">
                        {item.category}
                      </div>
                    </div>
                    {isSelected && <ChevronRight size={14} className="text-[var(--primary)] shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </AppCard>

        {/* ── Panel 3: Recipe Editor ── */}
        <div className="flex flex-col gap-4 overflow-y-auto h-full">
          {!selectedItem ? (
            <AppCard className="h-full flex items-center justify-center min-h-[400px]">
              <AppEmptyState
                title="Select a menu item"
                description="Choose a menu item from the list to view and edit its recipe ingredients."
                icon={ChefHat}
              />
            </AppCard>
          ) : recipeLoading ? (
            <AppCard className="flex items-center justify-center min-h-[400px]">
              <LoadingSpinner size="lg" />
            </AppCard>
          ) : (
            <>
              {/* Header Card */}
              <AppCard className="shrink-0">
                <div className="flex items-center gap-4">
                  {selectedItem.imageUrl ? (
                    <img src={selectedItem.imageUrl} alt={selectedItem.name} className="w-16 h-16 rounded-xl object-cover shrink-0 border border-[var(--border)] shadow-sm" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center shrink-0 border border-[var(--primary)]/20">
                      <ChefHat size={28} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-lg font-bold text-[var(--text-primary)] truncate">
                      {selectedItem.name}
                    </div>
                    <div className="text-sm text-[var(--text-secondary)] mt-0.5">
                      {selectedItem.category} · {formatRM(selectedItem.price)}
                    </div>
                    {recipe && (
                      <div className="text-xs text-[var(--text-secondary)] mt-1.5 font-medium flex items-center gap-2">
                        <span className="bg-[var(--background)] border border-[var(--border)] px-2 py-0.5 rounded-full">
                          {recipe.ingredients.length} ingredient{recipe.ingredients.length !== 1 ? 's' : ''}
                        </span>
                        {recipe.updatedAt && <span>Updated {new Date(recipe.updatedAt).toLocaleDateString('en-MY')}</span>}
                      </div>
                    )}
                  </div>
                  <AppButton icon={Plus} onClick={openAddModal} variant="primary">
                    Add Ingredient
                  </AppButton>
                </div>
              </AppCard>

              {/* Ingredients Card */}
              <AppCard
                title="Recipe Ingredients"
                subtitle="Standard ingredients required to prepare this item"
                className="!p-0 shrink-0"
                headerAction={
                  <div className="flex items-center gap-2">
                    {recipe && recipe.ingredients.some(i => i.stockStatus === 'CRITICAL') && (
                      <AppBadge variant="danger" text="Low Stock" icon />
                    )}
                    {recipe && recipe.ingredients.some(i => i.stockStatus === 'LOW') && (
                      <AppBadge variant="warning" text="Stock Alert" icon />
                    )}
                  </div>
                }
              >
                <AppTable
                  columns={ingredientColumns}
                  data={recipe?.ingredients || []}
                  keyExtractor={ing => ing.id}
                  emptyTitle="No ingredients yet"
                  emptyMessage="Add inventory items to define what's needed to prepare this menu item."
                  emptyIcon={Package}
                />
                {(!recipe || recipe.ingredients.length === 0) && (
                  <div className="flex justify-center pb-8 pt-4 bg-[var(--surface)] border-b border-x border-[var(--border)] rounded-b-xl -mt-6 z-10 relative">
                    <AppButton icon={Plus} onClick={openAddModal} size="sm">
                      Add First Ingredient
                    </AppButton>
                  </div>
                )}
              </AppCard>

              {/* Preparation Notes Card */}
              <AppCard
                title="Preparation Notes"
                subtitle="Kitchen instructions for preparing this item"
                icon={FileText}
                className="shrink-0"
              >
                <NotesEditor
                  notes={recipe?.notes || ''}
                  onSave={handleSaveNotes}
                  saving={notesSaving}
                />
              </AppCard>
            </>
          )}
        </div>
      </div>

      {/* Ingredient Form Modal */}
      <IngredientFormModal
        isOpen={showIngredientModal}
        onClose={() => { setShowIngredientModal(false); setEditingIngredient(null); }}
        onAdd={handleAddIngredient}
        onEdit={handleEditIngredient}
        inventoryItems={inventoryItems}
        editingIngredient={editingIngredient}
        saving={saving}
      />
    </ManagerLayout>
  );
};
