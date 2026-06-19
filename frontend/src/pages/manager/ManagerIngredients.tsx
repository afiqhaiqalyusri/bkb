import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Tag, ChevronRight, CornerDownRight, AlertCircle, Sparkles } from 'lucide-react';
import { ManagerLayout } from './ManagerDashboard';
import { ingredientService } from '../../services/ingredient.service';
import { menuService } from '../../services/menu.service';
import { categoryService } from '../../services/category.service';
import { MenuItem, MenuItemIngredient, Category } from '../../types';
import { ErrorState } from '../../components/ui/ErrorState';
import toast from 'react-hot-toast';
import { useConfirmation } from '../../components/ConfirmationProvider';

export const IngredientsContent: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [ingredients, setIngredients] = useState<MenuItemIngredient[]>([]);
  const { confirm } = useConfirmation();

  // Navigation / Selection State
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('');
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);

  // Loading States
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingIngredients, setLoadingIngredients] = useState(false);
  const [error, setError] = useState(false);

  // Form State for CRUD
  const [showModal, setShowModal] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<MenuItemIngredient | null>(null);
  const [form, setForm] = useState({
    ingredientName: '',
    defaultLevel: 'MEDIUM' as 'NONE' | 'LESS' | 'MEDIUM' | 'EXTRA'
  });
  const [submitting, setSubmitting] = useState(false);

  // Load Categories and Menu Items on mount
  const loadInitialData = async () => {
    try {
      setLoadingCats(true);
      setError(false);
      const [catsRes, itemsRes] = await Promise.all([
        categoryService.getAll(),
        menuService.getAllItems()
      ]);
      setCategories(catsRes.data);
      setMenuItems(itemsRes.data);

      // Select first category by default if available
      if (catsRes.data.length > 0) {
        setSelectedCategoryName(catsRes.data[0].name);
      }
      setError(false);
    } catch (err) {
      setError(true);
      toast.error('Failed to load menu data');
    } finally {
      setLoadingCats(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Filter menu items by selected category
  const filteredMenuItems = menuItems.filter(item => item.category === selectedCategoryName);

  // Load ingredients when selected menu item changes
  useEffect(() => {
    if (selectedMenuItem) {
      loadIngredients(selectedMenuItem.id);
    } else {
      setIngredients([]);
    }
  }, [selectedMenuItem]);

  // Load ingredients for a specific item
  const loadIngredients = async (menuItemId: number) => {
    try {
      setLoadingIngredients(true);
      const res = await ingredientService.getByMenuItem(menuItemId);
      setIngredients(res.data);
    } catch {
      toast.error('Failed to load customizations');
    } finally {
      setLoadingIngredients(false);
    }
  };

  // Select a menu item
  const handleSelectMenuItem = (item: MenuItem) => {
    setSelectedMenuItem(item);
  };

  // Open modal for add
  const handleOpenAdd = () => {
    setEditingIngredient(null);
    setForm({ ingredientName: '', defaultLevel: 'MEDIUM' });
    setShowModal(true);
  };

  // Open modal for edit
  const handleOpenEdit = (ing: MenuItemIngredient) => {
    setEditingIngredient(ing);
    setForm({
      ingredientName: ing.ingredientName,
      defaultLevel: ing.defaultLevel
    });
    setShowModal(true);
  };

  // Submit Add / Edit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMenuItem) return;
    if (!form.ingredientName.trim()) {
      toast.error('Ingredient name is required');
      return;
    }

    const isEdit = !!editingIngredient;
    const confirmed = await confirm({
      title: isEdit ? 'Save Customization Changes' : 'Add Customization Option',
      message: isEdit
        ? `Are you sure you want to save changes for "${form.ingredientName.trim()}"?`
        : `Are you sure you want to add the customization "${form.ingredientName.trim()}" to "${selectedMenuItem.name}"?`,
      confirmLabel: isEdit ? 'Save Changes' : 'Add Option',
      cancelLabel: 'Cancel',
      type: 'warning'
    });

    if (!confirmed) return;

    setSubmitting(true);
    try {
      if (isEdit && editingIngredient) {
        await ingredientService.update(editingIngredient.id, {
          menuItemId: selectedMenuItem.id,
          ingredientName: form.ingredientName.trim(),
          defaultLevel: form.defaultLevel
        });
        toast.success('Customization updated successfully');
      } else {
        await ingredientService.create({
          menuItemId: selectedMenuItem.id,
          ingredientName: form.ingredientName.trim(),
          defaultLevel: form.defaultLevel
        });
        toast.success('Customization option added');
      }
      setShowModal(false);
      loadIngredients(selectedMenuItem.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save customization option');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete option
  const handleDelete = async (ing: MenuItemIngredient) => {
    if (!selectedMenuItem) return;
    const confirmed = await confirm({
      title: 'Delete Customization Option',
      message: `Are you sure you want to permanently delete the customization option "${ing.ingredientName}" from "${selectedMenuItem.name}"?`,
      details: 'This will remove the option from checkout configurations immediately. Existing orders in processing will retain their selected customizations.',
      confirmLabel: 'Delete Option',
      cancelLabel: 'Cancel',
      type: 'danger'
    });
    if (!confirmed) return;

    try {
      await ingredientService.delete(ing.id);
      toast.success('Customization option deleted');
      loadIngredients(selectedMenuItem.id);
    } catch {
      toast.error('Failed to delete customization option');
    }
  };

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 280px)', width: '100%' }}>
        <ErrorState onRetry={loadInitialData} retrying={loadingCats} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 24, minHeight: 'calc(100vh - 200px)' }}>
        
        {/* Left Side Panel: Category Select & Menu Items list */}
        <div style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 16, flexShrink: 0 }}>
          
          {/* Category Picker Card */}
          <div className="card" style={{ padding: '16px 20px', background: 'var(--white)' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Select Category
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {loadingCats ? (
                <div style={{ padding: 12, textAlign: 'center' }}>
                  <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2, margin: '0 auto' }} />
                </div>
              ) : (
                categories.map(cat => {
                  const active = selectedCategoryName === cat.name;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategoryName(cat.name);
                        setSelectedMenuItem(null);
                      }}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: 'none',
                        background: active ? 'rgba(255,107,0,0.08)' : 'transparent',
                        color: active ? 'var(--red)' : 'var(--text-muted)',
                        fontWeight: active ? 700 : 500,
                        fontSize: '0.85rem',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.18s ease',
                      }}
                    >
                      <span>{cat.name}</span>
                      {active && <ChevronRight size={14} />}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Menu Items Card under selected category */}
          <div className="card" style={{ padding: '16px 20px', background: 'var(--white)', flex: 1, maxHeight: '500px', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Menu Items ({filteredMenuItems.length})
            </h3>
            
            {filteredMenuItems.length === 0 ? (
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
                No items in this category
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {filteredMenuItems.map(item => {
                  const active = selectedMenuItem?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectMenuItem(item)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid',
                        borderColor: active ? 'rgba(255,107,0,0.2)' : 'transparent',
                        background: active ? 'rgba(255,107,0,0.04)' : 'var(--cream-dark)',
                        color: active ? 'var(--red)' : 'var(--text-dark)',
                        fontWeight: active ? 700 : 500,
                        fontSize: '0.82rem',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.18s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                      }}
                    >
                      <span style={{ fontSize: '1rem' }}>🍔</span>
                      <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.name}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side Panel: Ingredients Editor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {selectedMenuItem ? (
            <div className="card" style={{ padding: '24px 28px', background: 'var(--white)', flex: 1, display: 'flex', flexDirection: 'column' }}>
              
              {/* Header section */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(74,44,42,0.06)', paddingBottom: 16, marginBottom: 20 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h2 style={{ fontFamily: 'Poppins', fontWeight: 900, fontSize: '1.25rem', color: 'var(--text-dark)' }}>
                      {selectedMenuItem.name}
                    </h2>
                    <span style={{
                      fontSize: '0.7rem',
                      background: selectedMenuItem.isAvailable ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                      color: selectedMenuItem.isAvailable ? '#10B981' : '#EF4444',
                      padding: '3px 8px', borderRadius: 'var(--radius-pill)', fontWeight: 700
                    }}>
                      {selectedMenuItem.isAvailable ? 'Active' : 'Unavailable'}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    {selectedMenuItem.description || 'No description provided.'}
                  </p>
                </div>
                
                <button
                  className="btn-primary"
                  onClick={handleOpenAdd}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, height: 40, padding: '0 16px', fontSize: '0.85rem' }}
                >
                  <Plus size={16} />
                  Add Option
                </button>
              </div>

              {/* Table / List */}
              {loadingIngredients ? (
                <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
                  <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
                </div>
              ) : ingredients.length === 0 ? (
                <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🥗</div>
                  <h4 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-dark)', marginBottom: 4 }}>No customization options</h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: 280 }}>
                    Customers will not be prompted for customizable ingredients (like no onions, extra cheese) for this item.
                  </p>
                </div>
              ) : (
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 1fr 100px',
                    padding: '12px 16px',
                    background: 'var(--cream-dark)',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: 10
                  }}>
                    <div>Ingredient Name</div>
                    <div>Default Level</div>
                    <div style={{ textAlign: 'right' }}>Actions</div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {ingredients.map(ing => (
                      <div
                        key={ing.id}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1.2fr 1fr 100px',
                          alignItems: 'center',
                          padding: '14px 16px',
                          background: 'var(--warm-white)',
                          borderRadius: '8px',
                          border: '1px solid rgba(74,44,42,0.04)',
                          fontSize: '0.86rem',
                          color: 'var(--text-dark)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ fontWeight: 600 }}>{ing.ingredientName}</div>
                        <div>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            padding: '4px 10px',
                            borderRadius: '6px',
                            background: ing.defaultLevel === 'NONE' 
                              ? 'rgba(239,68,68,0.06)' 
                              : ing.defaultLevel === 'EXTRA'
                                ? 'rgba(255,107,0,0.06)'
                                : 'rgba(74,44,42,0.06)',
                            color: ing.defaultLevel === 'NONE' 
                              ? '#EF4444' 
                              : ing.defaultLevel === 'EXTRA'
                                ? 'var(--red)'
                                : 'var(--text-dark)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.2px'
                          }}>
                            {ing.defaultLevel}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                          <button
                            onClick={() => handleOpenEdit(ing)}
                            style={{
                              background: 'none', border: 'none', color: 'var(--text-secondary)',
                              cursor: 'pointer', padding: 6, borderRadius: 6,
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(ing)}
                            style={{
                              background: 'none', border: 'none', color: 'var(--text-secondary)',
                              cursor: 'pointer', padding: 6, borderRadius: 6,
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card" style={{ padding: '60px 40px', background: 'var(--white)', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>🍔</div>
              <h3 style={{ fontFamily: 'Poppins', fontWeight: 900, fontSize: '1.25rem', color: 'var(--text-dark)', marginBottom: 6 }}>
                Select a Menu Item
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: 360, lineHeight: 1.5 }}>
                Choose a category and select a specific burger, drink or side from the left panel to configure its customizable ingredients.
              </p>
            </div>
          )}
        </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200
        }}>
          <form
            onSubmit={handleSubmit}
            className="card animate-scale-in"
            style={{ width: '100%', maxWidth: 420, padding: '24px 28px', background: 'var(--white)', display: 'flex', flexDirection: 'column', gap: 18 }}
          >
            <h3 style={{ fontFamily: 'Poppins', fontWeight: 900, fontSize: '1.1rem', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <Sparkles size={18} color="var(--red)" />
              {editingIngredient ? 'Edit Customization' : 'Add Customization'}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                  INGREDIENT NAME
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cheese Slice, Onion, Egg"
                  value={form.ingredientName}
                  onChange={e => setForm({ ...form, ingredientName: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'var(--cream-dark)',
                    border: '2px solid transparent',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    color: 'var(--text-dark)',
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                  DEFAULT LEVEL FOR MEAL
                </label>
                <select
                  value={form.defaultLevel}
                  onChange={e => setForm({ ...form, defaultLevel: e.target.value as any })}
                  style={{
                    width: '100%',
                    background: 'var(--cream-dark)',
                    border: '2px solid transparent',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    color: 'var(--text-dark)',
                    fontSize: '0.88rem',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="NONE">NONE (Opt-in only)</option>
                  <option value="LESS">LESS</option>
                  <option value="MEDIUM">MEDIUM (Standard include)</option>
                  <option value="EXTRA">EXTRA</option>
                </select>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginTop: 5, lineHeight: 1.3 }}>
                  This specifies the default inclusion state of this ingredient when a customer places an order.
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button
                type="button"
                className="btn-outline"
                onClick={() => setShowModal(false)}
                style={{ flex: 1, height: 44 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting}
                style={{ flex: 1, height: 44 }}
              >
                {submitting ? 'Saving...' : 'Save Options'}
              </button>
            </div>
          </form>
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
