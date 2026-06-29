import React, { useState, useEffect, useCallback } from 'react';
import {
  ChefHat, Plus, Trash2, Edit2, Search, Package,
  X, Check, ChevronRight, Save, FileText
} from 'lucide-react';
import { ManagerLayout } from '../../components/layout/ManagerLayout';
import { recipeService } from '../../services/recipe.service';
import { inventoryService } from '../../services/inventory.service';
import { menuService } from '../../services/menu.service';
import { Recipe, RecipeIngredientItem, RecipeIngredientRequest, InventoryItem, MenuItem } from '../../types';
import toast from 'react-hot-toast';

// UI Components
import { AppCard } from '../../components/ui/AppCard';
import { AppButton } from '../../components/ui/AppButton';
import { AppBadge } from '../../components/ui/AppBadge';
import { AppModal } from '../../components/ui/AppModal';
import { AppFormField, formControlClass } from '../../components/ui/AppFormField';
import { AppEmptyState } from '../../components/ui/AppEmptyState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { formatRM } from '../../utils/formatCurrency';

// ─── Stock Status Badge ───────────────────────────────────────────────────────
const StockBadge: React.FC<{ status: string; stock: number; unit: string }> = ({ status, stock, unit }) => {
  const variant =
    status === 'CRITICAL' ? 'danger' :
    status === 'LOW' ? 'warning' : 'success';
  return <AppBadge variant={variant} text={`${stock} ${unit}`} icon />;
};

// ─── Ingredient Row ───────────────────────────────────────────────────────────
const IngredientRow: React.FC<{
  ingredient: RecipeIngredientItem;
  onEdit: (ingredient: RecipeIngredientItem) => void;
  onDelete: (id: number) => void;
}> = ({ ingredient, onEdit, onDelete }) => (
  <div className="flex items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-slate-200 transition-colors group">
    {/* Icon */}
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
      ingredient.trackingType === 'AUTO' 
        ? 'bg-blue-50 text-blue-500 dark:bg-blue-950/20' 
        : 'bg-purple-50 text-purple-500 dark:bg-purple-950/20'
    }`}>
      <Package size={16} />
    </div>

    {/* Name & Details */}
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-bold text-slate-800 dark:text-white text-sm">
          {ingredient.inventoryName}
        </span>
        {ingredient.isOptional && (
          <span className="text-[9px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-950/20 dark:text-purple-400 px-2 py-0.5 rounded-md uppercase tracking-wider">
            Optional
          </span>
        )}
        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 bg-white border border-slate-100 dark:bg-slate-950 dark:border-slate-800 px-2 py-0.5 rounded-md uppercase tracking-wider">
          {ingredient.trackingType}
        </span>
      </div>
      <div className="text-[11px] text-slate-450 mt-1 font-semibold flex items-center gap-1.5 flex-wrap">
        <span>Serving Qty: <strong className="text-slate-700 dark:text-slate-350">{ingredient.quantity}</strong> {ingredient.unit}</span>
        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
        <span className="flex items-center gap-1">Stock Status: <StockBadge status={ingredient.stockStatus} stock={ingredient.currentStock} unit={ingredient.unit} /></span>
      </div>
    </div>

    {/* Actions */}
    <div className="flex items-center gap-1 shrink-0">
      <AppButton variant="ghost" size="icon" onClick={() => onEdit(ingredient)} title="Edit"><Edit2 size={13} /></AppButton>
      <AppButton variant="ghost" size="icon" onClick={() => onDelete(ingredient.id)} className="text-rose-500 hover:text-rose-700" title="Remove"><Trash2 size={13} /></AppButton>
    </div>
  </div>
);

// ─── Ingredient Form Modal ────────────────────────────────────────────────────
interface IngredientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: RecipeIngredientRequest) => Promise<void>;
  inventoryItems: InventoryItem[];
  editingIngredient: RecipeIngredientItem | null;
  saving: boolean;
}

const IngredientFormModal: React.FC<IngredientFormModalProps> = ({
  isOpen, onClose, onSave, inventoryItems, editingIngredient, saving
}) => {
  const [inventoryId, setInventoryId] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [isOptional, setIsOptional] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (editingIngredient) {
      setInventoryId(editingIngredient.inventoryId);
      setQuantity(editingIngredient.quantity);
      setIsOptional(editingIngredient.isOptional);
    } else {
      setInventoryId(0);
      setQuantity(1);
      setIsOptional(false);
    }
    setSearch('');
  }, [editingIngredient, isOpen]);

  const filtered = inventoryItems.filter(i =>
    i.itemName.toLowerCase().includes(search.toLowerCase()) ||
    (i.category || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inventoryId) { toast.error('Please select an inventory item'); return; }
    if (quantity <= 0) { toast.error('Quantity must be greater than 0'); return; }
    await onSave({ inventoryId, quantity, isOptional });
  };

  const selectedItem = inventoryItems.find(i => i.id === inventoryId);

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingIngredient ? 'Edit Ingredient' : 'Add Recipe Ingredient'}
      subtitle="Link an inventory raw material item to this recipe serving."
      icon={<Package size={18} />}
      size="md"
      onSubmit={handleSubmit}
      actions={[
        { label: 'Cancel', variant: 'outline', onClick: onClose },
        { label: editingIngredient ? 'Save Changes' : 'Add Ingredient', variant: 'primary', isLoading: saving, type: 'submit', onClick: () => {} },
      ]}
    >
      <div className="flex flex-col gap-4">
        {/* Inventory Item Selector */}
        <AppFormField label="Raw Ingredient" required>
          <div className="relative mb-2">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search ingredient index..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={`${formControlClass} pl-9 py-2 text-xs`}
            />
          </div>
          <div className="max-h-44 overflow-y-auto border border-slate-100 rounded-xl bg-slate-50 dark:bg-slate-950 dark:border-slate-800">
            {filtered.length === 0 ? (
              <div className="p-4 text-xs text-slate-400 text-center font-semibold">
                No inventory items found
              </div>
            ) : (
              filtered.map(item => (
                <div
                  key={item.id}
                  onClick={() => { setInventoryId(item.id); setSearch(''); }}
                  className={`flex items-center justify-between p-3 cursor-pointer border-b border-slate-100 dark:border-slate-900/50 last:border-0 transition-colors ${
                    inventoryId === item.id 
                      ? 'bg-orange-500/10 text-primary' 
                      : 'hover:bg-white dark:hover:bg-slate-900'
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white">
                      {item.itemName}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 font-semibold">
                      Category: {item.category} · Unit: {item.unit} · Stock: {item.currentStock}
                    </div>
                  </div>
                  {inventoryId === item.id && <Check size={14} className="text-primary shrink-0" />}
                </div>
              ))
            )}
          </div>
          {selectedItem && (
            <div className="mt-2 p-2.5 bg-orange-500/5 border border-orange-500/20 rounded-xl text-xs font-bold text-primary">
              Linked: {selectedItem.itemName} ({selectedItem.unit})
            </div>
          )}
        </AppFormField>

        {/* Quantity */}
        <AppFormField label="Served Quantity" required hint={selectedItem ? `Served unit is measured in (${selectedItem.unit})` : 'Select an inventory item first'}>
          <input
            type="number"
            value={quantity}
            onChange={e => setQuantity(parseFloat(e.target.value) || 0)}
            min="0.01"
            step="0.01"
            className={formControlClass}
          />
        </AppFormField>

        {/* Optional Toggle */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-xl">
          <label className="flex items-center gap-3 cursor-pointer flex-1">
            <input 
              type="checkbox" 
              checked={isOptional} 
              onChange={e => setIsOptional(e.target.checked)} 
              className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary" 
            />
            <div>
              <div className="text-xs font-bold text-slate-700 dark:text-white">Optional Ingredient</div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-semibold">
                Will not trigger "Sold Out" status if stock level becomes critical.
              </p>
            </div>
          </label>
        </div>
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
    <div className="flex flex-col gap-3.5">
      <textarea
        value={value}
        onChange={e => { setValue(e.target.value); setDirty(true); }}
        placeholder="e.g. Grill chicken patty for 4 mins each side. Assemble pickles on top bun..."
        rows={4}
        className={`${formControlClass} resize-none min-h-[90px]`}
      />
      {dirty && (
        <AppButton size="sm" icon={Save} isLoading={saving} onClick={() => onSave(value)} className="self-end text-xs font-bold uppercase tracking-wider px-4">
          Save Preparation Notes
        </AppButton>
      )}
    </div>
  );
};

// ─── Manager Recipes Page (Main) ──────────────────────────────────────────────
export const ManagerRecipes: React.FC = () => {
  const [categories, setCategories] = useState<string[]>(['All']);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [menuSearch, setMenuSearch] = useState('');
  const [menuLoading, setMenuLoading] = useState(true);

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

  const [showIngredientModal, setShowIngredientModal] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<RecipeIngredientItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [notesSaving, setNotesSaving] = useState(false);

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
    .finally(() => { setMenuLoading(false); });
  }, []);

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

  const handleAddIngredient = async (data: RecipeIngredientRequest) => {
    if (!selectedItem) return;
    setSaving(true);
    try {
      const res = await recipeService.addIngredient(selectedItem.id, data);
      setRecipe(res.data);
      setShowIngredientModal(false);
      toast.success('Ingredient added to recipe');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to add ingredient');
    } finally {
      setSaving(false);
    }
  };

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

  return (
    <ManagerLayout
      title="Recipe Management"
      subtitle="Link catalog menu items to required kitchen raw ingredients"
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Categories Panel */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <AppCard noPadding>
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Categories</span>
            </div>
            <div className="p-2 flex flex-col gap-0.5 max-h-64 lg:max-h-none overflow-y-auto">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-150 ${
                    selectedCategory === cat 
                      ? 'bg-orange-500/10 text-primary' 
                      : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </AppCard>
        </div>

        {/* Menu Items Selector Panel */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <AppCard noPadding className="flex flex-col max-h-[500px] lg:max-h-none overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Menu Items ({filteredItems.length})</span>
              <div className="relative mt-2.5">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search item..."
                  value={menuSearch}
                  onChange={e => setMenuSearch(e.target.value)}
                  className={`${formControlClass} pl-8.5 py-1.5 text-xs placeholder-slate-400`}
                />
              </div>
            </div>
            
            <div className="p-2 overflow-y-auto flex-1 flex flex-col gap-0.5">
              {menuLoading ? (
                <div className="flex justify-center py-8"><LoadingSpinner size="sm" /></div>
              ) : filteredItems.length === 0 ? (
                <AppEmptyState title="No items found" icon={ChefHat} />
              ) : (
                filteredItems.map(item => {
                  const isSelected = selectedItem?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectItem(item)}
                      className={`w-full text-left p-2.5 rounded-xl border border-transparent cursor-pointer flex items-center gap-3 transition-colors ${
                        isSelected 
                          ? 'bg-orange-500/5 text-primary border-orange-500/10' 
                          : 'hover:bg-slate-50 dark:hover:bg-slate-900'
                      }`}
                    >
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-slate-50" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0 border border-orange-500/15">
                          <ChefHat size={15} className="text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-bold leading-tight ${isSelected ? 'text-primary' : 'text-slate-700 dark:text-slate-300'} truncate`}>
                          {item.name}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 font-semibold uppercase tracking-wider">
                          {item.category}
                        </div>
                      </div>
                      {isSelected && <ChevronRight size={14} className="text-primary shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </AppCard>
        </div>

        {/* Recipe Editor Details Panel */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {!selectedItem ? (
            <AppCard className="h-64 flex items-center justify-center">
              <AppEmptyState
                title="Select Menu Item"
                description="Choose an item from the side panel to view, add, or configure its raw ingredient recipe."
                icon={ChefHat}
              />
            </AppCard>
          ) : recipeLoading ? (
            <AppCard className="h-64 flex items-center justify-center">
              <LoadingSpinner size="lg" />
            </AppCard>
          ) : (
            <>
              {/* Active Selection Info Header */}
              <AppCard>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {selectedItem.imageUrl ? (
                      <img src={selectedItem.imageUrl} alt={selectedItem.name} className="w-12 h-12 rounded-xl object-cover border border-slate-50 shadow-sm shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0 border border-orange-500/15">
                        <ChefHat size={20} className="text-primary" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-extrabold text-slate-800 dark:text-white text-base leading-tight">
                        {selectedItem.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">
                        {selectedItem.category} · {formatRM(selectedItem.price)}
                      </p>
                    </div>
                  </div>
                  <AppButton variant="primary" size="sm" icon={Plus} onClick={openAddModal} className="text-xs uppercase font-bold tracking-wider py-2.5">
                    Add Ingredient
                  </AppButton>
                </div>
              </AppCard>

              {/* Recipe Components */}
              <AppCard title="Recipe Components" subtitle="Raw ingredients mapped for single serving deduction">
                {!recipe || recipe.ingredients.length === 0 ? (
                  <AppEmptyState
                    title="No ingredients defined"
                    description="Map raw items from inventory to set serving quantities."
                    icon={Package}
                    action={
                      <AppButton variant="primary" size="sm" icon={Plus} onClick={openAddModal} className="text-xs uppercase font-bold tracking-wider mt-3">
                        Define Recipe
                      </AppButton>
                    }
                  />
                ) : (
                  <div className="flex flex-col gap-3">
                    {recipe.ingredients.map(ing => (
                      <IngredientRow
                        key={ing.id}
                        ingredient={ing}
                        onEdit={openEditModal}
                        onDelete={handleRemoveIngredient}
                      />
                    ))}
                  </div>
                )}
              </AppCard>

              {/* Preparation Guidelines */}
              <AppCard title="Kitchen Guidelines" subtitle="Preparation instructions displayed on order execution" icon={FileText}>
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
        onSave={editingIngredient ? handleEditIngredient : handleAddIngredient}
        inventoryItems={inventoryItems}
        editingIngredient={editingIngredient}
        saving={saving}
      />
    </ManagerLayout>
  );
};
