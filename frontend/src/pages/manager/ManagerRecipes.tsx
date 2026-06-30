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
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 14px',
    background: 'var(--background)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    transition: 'border-color 0.15s',
  }}
  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
  >
    {/* Icon */}
    <div style={{
      width: 36, height: 36, borderRadius: 8, flexShrink: 0,
      background: ingredient.trackingType === 'AUTO'
        ? 'rgba(59,130,246,0.08)' : 'rgba(139,92,246,0.08)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: ingredient.trackingType === 'AUTO' ? '#3B82F6' : '#8B5CF6',
    }}>
      <Package size={16} />
    </div>

    {/* Name & Details */}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
          {ingredient.inventoryName}
        </span>
        {ingredient.isOptional && (
          <span style={{
            fontSize: '0.65rem', fontWeight: 700, color: '#8B5CF6',
            background: 'rgba(139,92,246,0.1)', padding: '1px 6px', borderRadius: 99,
          }}>
            OPTIONAL
          </span>
        )}
        <span style={{
          fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-secondary)',
          background: 'var(--surface)', border: '1px solid var(--border)',
          padding: '1px 6px', borderRadius: 99,
        }}>
          {ingredient.trackingType}
        </span>
      </div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
        Qty: <strong>{ingredient.quantity}</strong> {ingredient.unit}
        &nbsp;·&nbsp;
        Stock: <StockBadge status={ingredient.stockStatus} stock={ingredient.currentStock} unit={ingredient.unit} />
      </div>
    </div>

    {/* Actions */}
    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
      <AppButton variant="ghost" size="icon" onClick={() => onEdit(ingredient)} title="Edit">
        <Edit2 size={14} />
      </AppButton>
      <AppButton
        variant="ghost"
        size="icon"
        onClick={() => onDelete(ingredient.id)}
        className="hover:text-[var(--danger)]"
        title="Remove"
      >
        <Trash2 size={14} />
      </AppButton>
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
      title={editingIngredient ? 'Edit Recipe Ingredient' : 'Add Ingredient to Recipe'}
      subtitle="Link an inventory item to this recipe with a required quantity."
      icon={<Package size={18} />}
      size="md"
      onSubmit={handleSubmit}
      actions={[
        { label: 'Cancel', variant: 'outline', onClick: onClose },
        { label: editingIngredient ? 'Save Changes' : 'Add Ingredient', variant: 'primary', isLoading: saving, type: 'submit', onClick: () => {} },
      ]}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Inventory Item Selector */}
        <AppFormField label="Inventory Item" required>
          <div style={{ position: 'relative', marginBottom: 6 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search inventory items…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ ...formControlStyle, paddingLeft: 32, fontSize: '0.82rem' }}
            />
          </div>
          <div style={{
            maxHeight: 180, overflowY: 'auto',
            border: '1px solid var(--border)', borderRadius: 8,
            background: 'var(--background)',
          }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '12px 14px', fontSize: '0.82rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                No inventory items found
              </div>
            ) : (
              filtered.map(item => (
                <div
                  key={item.id}
                  onClick={() => { setInventoryId(item.id); setSearch(''); }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', cursor: 'pointer',
                    background: inventoryId === item.id ? 'rgba(255,107,0,0.07)' : 'transparent',
                    borderBottom: '1px solid var(--border)',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => { if (inventoryId !== item.id) (e.currentTarget as HTMLElement).style.background = 'var(--surface)'; }}
                  onMouseLeave={e => { if (inventoryId !== item.id) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.83rem', color: 'var(--text-primary)' }}>
                      {item.itemName}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      {item.category} · {item.unit} · Stock: {item.currentStock}
                    </div>
                  </div>
                  {inventoryId === item.id && <Check size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />}
                </div>
              ))
            )}
          </div>
          {selectedItem && (
            <div style={{
              marginTop: 6, padding: '6px 10px',
              background: 'rgba(255,107,0,0.05)',
              border: '1px solid rgba(255,107,0,0.2)',
              borderRadius: 6, fontSize: '0.78rem', color: 'var(--primary)',
            }}>
              Selected: <strong>{selectedItem.itemName}</strong> ({selectedItem.unit})
            </div>
          )}
        </AppFormField>

        {/* Quantity */}
        <AppFormField label="Required Quantity per Serving" required hint={selectedItem ? `Unit: ${selectedItem.unit}` : 'Select an inventory item first'}>
          <input
            type="number"
            value={quantity}
            onChange={e => setQuantity(parseFloat(e.target.value) || 0)}
            min="0.01"
            step="0.01"
            style={formControlStyle}
          />
        </AppFormField>

        {/* Optional Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flex: 1 }}>
            <div
              onClick={() => setIsOptional(v => !v)}
              style={{
                width: 40, height: 22, borderRadius: 99, flexShrink: 0,
                background: isOptional ? 'var(--primary)' : 'var(--border)',
                position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
              }}
            >
              <div style={{
                position: 'absolute', top: 3, left: isOptional ? 21 : 3,
                width: 16, height: 16, borderRadius: '50%', background: '#fff',
                transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </div>
            <div>
              <div style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text-primary)' }}>Optional Ingredient</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                Optional ingredients won't cause the item to be unavailable if out of stock
              </div>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <textarea
        value={value}
        onChange={e => { setValue(e.target.value); setDirty(true); }}
        placeholder="e.g. Toast bun separately. Grill patty to 75°C internal temp. Apply sauce before closing bun."
        rows={4}
        style={{ ...formControlStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
      />
      {dirty && (
        <AppButton size="sm" icon={Save} isLoading={saving} onClick={() => onSave(value)}>
          Save Notes
        </AppButton>
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

  return (
    <ManagerLayout
      title="Recipe Management"
      subtitle="Define standard ingredients required to prepare each menu item"
    >
      <div style={{ display: 'grid', gridTemplateColumns: '200px 280px 1fr', gap: 16, height: 'calc(100vh - 120px)', minHeight: 0 }}>

        {/* ── Panel 1: Category Selector ── */}
        <AppCard noPadding>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
              Categories
            </span>
          </div>
          <div style={{ overflowY: 'auto', padding: '8px 8px' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  width: '100%', textAlign: 'left',
                  padding: '8px 12px', borderRadius: 6, border: 'none',
                  background: selectedCategory === cat ? 'rgba(255,107,0,0.1)' : 'transparent',
                  color: selectedCategory === cat ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: selectedCategory === cat ? 700 : 500,
                  fontSize: '0.83rem', cursor: 'pointer',
                  transition: 'all 0.12s',
                }}
                onMouseEnter={e => { if (selectedCategory !== cat) (e.currentTarget as HTMLElement).style.background = 'var(--background)'; }}
                onMouseLeave={e => { if (selectedCategory !== cat) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                {cat}
              </button>
            ))}
          </div>
        </AppCard>

        {/* ── Panel 2: Menu Item List ── */}
        <AppCard noPadding style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
              Menu Items ({filteredItems.length})
            </span>
            <div style={{ position: 'relative', marginTop: 8 }}>
              <Search size={13} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search items…"
                value={menuSearch}
                onChange={e => setMenuSearch(e.target.value)}
                style={{ ...formControlStyle, paddingLeft: 28, fontSize: '0.8rem', padding: '7px 8px 7px 28px' }}
              />
            </div>
          </div>
          <div style={{ overflowY: 'auto', flex: 1, padding: '8px 8px' }}>
            {menuLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}><LoadingSpinner size="sm" /></div>
            ) : filteredItems.length === 0 ? (
              <AppEmptyState title="No items" icon={ChefHat} />
            ) : (
              filteredItems.map(item => {
                const isSelected = selectedItem?.id === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    style={{
                      width: '100%', textAlign: 'left',
                      padding: '9px 12px', borderRadius: 8, border: 'none',
                      background: isSelected ? 'rgba(255,107,0,0.1)' : 'transparent',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                      marginBottom: 2, transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--background)'; }}
                    onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 36, height: 36, borderRadius: 6, background: 'rgba(255,107,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <ChefHat size={16} style={{ color: 'var(--primary)' }} />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '0.83rem', fontWeight: isSelected ? 700 : 500,
                        color: isSelected ? 'var(--primary)' : 'var(--text-primary)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        {item.category}
                      </div>
                    </div>
                    {isSelected && <ChevronRight size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />}
                  </button>
                );
              })
            )}
          </div>
        </AppCard>

        {/* ── Panel 3: Recipe Editor ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', minHeight: 0 }}>
          {!selectedItem ? (
            <AppCard style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AppEmptyState
                title="Select a menu item"
                description="Choose a menu item from the list to view and edit its recipe ingredients."
                icon={ChefHat}
              />
            </AppCard>
          ) : recipeLoading ? (
            <AppCard style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
              <LoadingSpinner size="lg" />
            </AppCard>
          ) : (
            <>
              {/* Header Card */}
              <AppCard>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {selectedItem.imageUrl ? (
                    <img src={selectedItem.imageUrl} alt={selectedItem.name} style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 56, height: 56, borderRadius: 10, background: 'rgba(255,107,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ChefHat size={24} style={{ color: 'var(--primary)' }} />
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {selectedItem.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                      {selectedItem.category} · {formatRM(selectedItem.price)}
                    </div>
                    {recipe && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                        {recipe.ingredients.length} ingredient{recipe.ingredients.length !== 1 ? 's' : ''}
                        {recipe.updatedAt && ` · Last updated ${new Date(recipe.updatedAt).toLocaleDateString('en-MY')}`}
                      </div>
                    )}
                  </div>
                  <AppButton icon={Plus} onClick={openAddModal} size="sm">
                    Add Ingredient
                  </AppButton>
                </div>
              </AppCard>

              {/* Ingredients Card */}
              <AppCard
                title="Recipe Ingredients"
                subtitle="Standard ingredients required to prepare this item"
                headerAction={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {recipe && recipe.ingredients.some(i => i.stockStatus === 'CRITICAL') && (
                      <AppBadge variant="danger" text="Low Stock" icon />
                    )}
                    {recipe && recipe.ingredients.some(i => i.stockStatus === 'LOW') && (
                      <AppBadge variant="warning" text="Stock Alert" icon />
                    )}
                  </div>
                }
              >
                {!recipe || recipe.ingredients.length === 0 ? (
                  <AppEmptyState
                    title="No ingredients yet"
                    description="Add inventory items to define what's needed to prepare this menu item."
                    icon={Package}
                    action={
                      <AppButton icon={Plus} onClick={openAddModal} size="sm">
                        Add First Ingredient
                      </AppButton>
                    }
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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

              {/* Preparation Notes Card */}
              <AppCard
                title="Preparation Notes"
                subtitle="Kitchen instructions for preparing this item"
                icon={FileText}
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
        onSave={editingIngredient ? handleEditIngredient : handleAddIngredient}
        inventoryItems={inventoryItems}
        editingIngredient={editingIngredient}
        saving={saving}
      />
    </ManagerLayout>
  );
};
