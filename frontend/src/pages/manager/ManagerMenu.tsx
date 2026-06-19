import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, X, Tag } from 'lucide-react';
import { MenuItem } from '../../types';
import { menuService } from '../../services/menu.service';
import { categoryService } from '../../services/category.service';
import { ManagerLayout } from './ManagerDashboard';
import { IngredientsContent } from './ManagerIngredients';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { formatRM } from '../../utils/formatCurrency';
import { ErrorState } from '../../components/ui/ErrorState';
import toast from 'react-hot-toast';
import { useConfirmation } from '../../components/ConfirmationProvider';
import { useUnsavedChangesBlocker } from '../../hooks/useUnsavedChangesBlocker';

export const MenuContent: React.FC = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editItem, setEditItem] = useState<Partial<MenuItem> | null>(null);
  const [originalItem, setOriginalItem] = useState<Partial<MenuItem> | null>(null);
  const [filterCat, setFilterCat] = useState('ALL');
  const { confirm } = useConfirmation();

  // Category management state
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [savingCat, setSavingCat] = useState(false);

  // Simulated file upload states
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState('');
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setUploadProgress(0);
    setUploadingFileName(file.name);
    setFilePreviewUrl(null);

    // Simulate upload progress
    const totalTime = 1500; // 1.5 seconds simulation
    const intervalTime = 100;
    const step = 100 / (totalTime / intervalTime);

    const timer = setInterval(() => {
      setUploadProgress(prev => {
        const next = prev + step;
        if (next >= 100) {
          clearInterval(timer);
          setUploadingFile(false);
          const preview = URL.createObjectURL(file);
          setFilePreviewUrl(preview);
          setEditItem(p => p ? { ...p, imageUrl: preview } : null);
          toast.success('Image uploaded successfully (simulated)');
          return 100;
        }
        return next;
      });
    }, intervalTime);
  };

  const loadInitialData = () => {
    setLoading(true);
    setError(false);
    Promise.all([menuService.getAllItems(), categoryService.getAll()])
      .then(([menuRes, catRes]) => {
        setItems(menuRes.data);
        setCategories(catRes.data);
        setError(false);
      })
      .catch((err) => {
        setError(true);
        toast.error('Failed to load menu data');
        console.error(err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadMenu = () => {
    menuService.getAllItems().then(res => setItems(res.data)).catch(console.error);
  };

  const loadCategories = () => {
    categoryService.getAll()
      .then(res => setCategories(res.data))
      .catch(() => toast.error('Failed to reload categories'));
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const confirmed = await confirm({
      title: 'Add Category',
      message: `Are you sure you want to add the category "${newCatName.trim()}"?`,
      confirmLabel: 'Add Category',
      cancelLabel: 'Cancel',
      type: 'info'
    });
    if (!confirmed) return;
    setSavingCat(true);
    try {
      await categoryService.create(newCatName.trim());
      toast.success('Category created');
      setNewCatName('');
      loadCategories();
    } catch {
      toast.error('Failed to create category');
    } finally {
      setSavingCat(false);
    }
  };

  const handleDeleteCategory = async (id: number, name: string) => {
    const confirmed = await confirm({
      title: 'Delete Category',
      message: `Are you sure you want to delete the category "${name}"?`,
      details: 'This will delete the category definition. Existing items in this category will remain, but their category association might be affected.',
      confirmLabel: 'Delete Category',
      cancelLabel: 'Cancel',
      type: 'danger'
    });
    if (!confirmed) return;
    try {
      await categoryService.delete(id);
      toast.success('Category deleted');
      loadCategories();
    } catch {
      toast.error('Failed to delete category');
    }
  };

  const handleToggle = async (id: number) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const actionStr = item.isAvailable ? 'mark as SOLD OUT' : 'mark as AVAILABLE';
    const confirmed = await confirm({
      title: item.isAvailable ? 'Mark Sold Out' : 'Mark Available',
      message: `Are you sure you want to ${actionStr} for "${item.name}"?`,
      confirmLabel: item.isAvailable ? 'Mark Sold Out' : 'Mark Available',
      cancelLabel: 'Cancel',
      type: 'warning'
    });
    if (!confirmed) return;
    menuService.toggle(id)
      .then(() => {
        setItems(prev => prev.map(item => item.id === id ? { ...item, isAvailable: !item.isAvailable } : item));
        toast.success('Availability updated');
      })
      .catch(() => toast.error('Failed to toggle status'));
  };

  const handleDelete = async (id: number) => {
    const item = items.find(i => i.id === id);
    const confirmed = await confirm({
      title: 'Delete Menu Item',
      message: `Are you sure you want to permanently delete the menu item "${item?.name || 'this item'}"?`,
      details: 'This action is irreversible and will delete the menu item from the store.',
      confirmLabel: 'Delete Item',
      cancelLabel: 'Cancel',
      type: 'danger'
    });
    if (!confirmed) return;
    menuService.delete(id)
      .then(() => {
        setItems(prev => prev.filter(item => item.id !== id));
        toast.success('Item deleted');
      })
      .catch(() => toast.error('Failed to delete item'));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem?.name || !editItem?.price) {
      toast.error('Name and price are required');
      return;
    }
    const confirmed = await confirm({
      title: editItem.id ? 'Save Changes' : 'Create Menu Item',
      message: `Are you sure you want to save changes for "${editItem.name}"?`,
      confirmLabel: 'Save Item',
      cancelLabel: 'Cancel',
      type: 'warning'
    });
    if (!confirmed) return;
    const payload = { ...editItem, price: Number(editItem.price), promoPrice: editItem.promoPrice ? Number(editItem.promoPrice) : undefined };
    const action = editItem.id ? menuService.update(editItem.id, payload) : menuService.create(payload);
    action.then(() => {
      toast.success(editItem.id ? 'Item updated' : 'Item created');
      setIsEditing(false);
      loadMenu();
      setFilePreviewUrl(null);
    }).catch(() => toast.error('Failed to save item'));
  };

  const openEdit = (item: MenuItem | null) => {
    const defaultItem = item ? { ...item } : { name: '', price: 0, category: categories[0]?.name || 'Burger', isAvailable: true, ingredients: [] };
    setEditItem(defaultItem);
    setOriginalItem(defaultItem);
    setIsEditing(true);
  };

  const hasMenuChanges = () => {
    if (!editItem || !originalItem) return false;
    return editItem.name !== originalItem.name ||
           editItem.price !== originalItem.price ||
           editItem.promoPrice !== originalItem.promoPrice ||
           editItem.category !== originalItem.category ||
           editItem.imageUrl !== originalItem.imageUrl ||
           editItem.description !== originalItem.description ||
           editItem.isAvailable !== originalItem.isAvailable;
  };

  const isDirty = isEditing && hasMenuChanges();
  useUnsavedChangesBlocker(isDirty);

  const closeEditWithCheck = async () => {
    if (hasMenuChanges()) {
      const discard = await confirm({
        title: 'Unsaved Changes Detected',
        message: 'You have unsaved changes. Are you sure you want to discard them?',
        confirmLabel: 'Discard Changes',
        cancelLabel: 'Stay on Page',
        type: 'warning'
      });
      if (!discard) return;
    }
    setIsEditing(false);
    setEditItem(null);
    setOriginalItem(null);
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
      setFilePreviewUrl(null);
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isEditing && hasMenuChanges()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isEditing, editItem, originalItem]);

  const catNames = ['ALL', ...categories.map(c => c.name)];
  const filtered = filterCat === 'ALL' ? items : items.filter(i => i.category === filterCat);

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 280px)', width: '100%' }}>
        <ErrorState onRetry={loadInitialData} retrying={loading} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Modal Editor */}
      {isEditing && editItem && (
        <div className="modal-overlay" onClick={closeEditWithCheck}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxWidth: 520, background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 24, padding: '24px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', fontFamily: 'Poppins' }}>{editItem.id ? 'Edit' : 'Add'} Menu Item</h3>
              <button type="button" onClick={closeEditWithCheck} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Item Name</label>
                <input type="text" value={editItem.name || ''} onChange={e => setEditItem(p => ({ ...p, name: e.target.value }))}
                  style={{ width: '100%', padding: '12px 16px', background: 'var(--background)', border: '1.5px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)', outline: 'none', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  placeholder="e.g. Burger Ayam Special" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Price (RM)</label>
                  <input type="number" step="0.01" min="0" value={editItem.price || ''} onChange={e => setEditItem(p => ({ ...p, price: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '12px 16px', background: 'var(--background)', border: '1.5px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)', outline: 'none', fontSize: '0.88rem', boxSizing: 'border-box' }} required />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Promo Price (RM)</label>
                  <input type="number" step="0.01" min="0" value={editItem.promoPrice || ''} onChange={e => setEditItem(p => ({ ...p, promoPrice: e.target.value ? Number(e.target.value) : undefined }))}
                    style={{ width: '100%', padding: '12px 16px', background: 'var(--background)', border: '1.5px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)', outline: 'none', fontSize: '0.88rem', boxSizing: 'border-box' }} placeholder="Optional" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Category</label>
                  <select value={editItem.category || ''} onChange={e => setEditItem(p => ({ ...p, category: e.target.value }))}
                    style={{ width: '100%', padding: '12px 16px', background: 'var(--background)', border: '1.5px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)', outline: 'none', fontSize: '0.88rem', boxSizing: 'border-box' }}>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Image Source</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <input type="text" value={editItem.imageUrl || ''} onChange={e => setEditItem(p => ({ ...p, imageUrl: e.target.value }))}
                      style={{ width: '100%', padding: '12px 16px', background: 'var(--background)', border: '1.5px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)', outline: 'none', fontSize: '0.88rem', boxSizing: 'border-box' }} placeholder="https://... or upload below" />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input
                        type="file"
                        accept="image/*"
                        id="menu-file-upload"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                      />
                      <label
                        htmlFor="menu-file-upload"
                        className="bkb-btn-ghost"
                        style={{
                          padding: '6px 12px',
                          fontSize: '0.74rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          borderRadius: 8,
                          border: '1px solid var(--border)',
                          fontWeight: 700,
                          margin: 0
                        }}
                      >
                        📁 Upload File
                      </label>
                      {uploadingFileName && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 120 }}>
                          {uploadingFileName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Simulated upload progress */}
              {uploadingFile && (
                <div style={{
                  padding: '12px 16px',
                  background: 'var(--cream-dark)',
                  border: '1.5px solid var(--border)',
                  borderRadius: 12,
                  marginTop: 4
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                    <span>Uploading image...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <div style={{ height: 8, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${uploadProgress}%`, background: 'var(--red)', borderRadius: 99, transition: 'width 0.1s linear' }} />
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: 6, letterSpacing: 0.5 }}>
                    {`Uploading... ${Math.round(uploadProgress)}% [`}
                    {Array.from({ length: 10 }).map((_, i) => (i < Math.round(uploadProgress / 10) ? '█' : '░')).join('')}
                    {`]`}
                  </div>
                </div>
              )}

              {/* Image Preview */}
              {editItem.imageUrl && !uploadingFile && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Image Preview</label>
                  <div style={{
                    width: '100%',
                    height: 120,
                    borderRadius: 12,
                    border: '1.5px solid var(--border)',
                    background: `url(${editItem.imageUrl}) center/cover no-repeat`,
                    overflow: 'hidden'
                  }} />
                </div>
              )}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Description</label>
                <textarea value={editItem.description || ''} onChange={e => setEditItem(p => ({ ...p, description: e.target.value }))}
                  style={{ width: '100%', padding: '12px 16px', background: 'var(--background)', border: '1.5px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)', outline: 'none', fontSize: '0.88rem', boxSizing: 'border-box', minHeight: 70, resize: 'vertical' }}
                  placeholder="Describe this item..." />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0' }}>
                <input type="checkbox" id="isAvailable" checked={!!editItem.isAvailable} onChange={e => setEditItem(p => ({ ...p, isAvailable: e.target.checked }))}
                  style={{ width: 18, height: 18, accentColor: 'var(--red)', cursor: 'pointer' }} />
                <label htmlFor="isAvailable" style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}>Available for Ordering</label>
              </div>
              <button type="submit" style={{ marginTop: 12, padding: '14px', background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 20, fontWeight: 700, cursor: 'pointer', fontSize: '0.92rem', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 12px rgba(230, 51, 41, 0.2)' }}>Save Item</button>
            </form>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {showCategoriesModal && (
        <div className="modal-overlay" onClick={() => setShowCategoriesModal(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxWidth: 440, background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 24, padding: '24px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', fontFamily: 'Poppins' }}>
                <Tag size={18} style={{ color: 'var(--red)' }} /> Manage Categories
              </h3>
              <button onClick={() => setShowCategoriesModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            {/* Add Category Form */}
            <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <input
                type="text"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                placeholder="New category name..."
                style={{ flex: 1, padding: '12px 16px', background: 'var(--background)', border: '1.5px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                required
              />
              <button type="submit" disabled={savingCat} style={{ padding: '12px 20px', background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 4px 12px rgba(230, 51, 41, 0.15)' }}>
                Add
              </button>
            </form>

            {/* Categories List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto', paddingRight: 4 }}>
              {categories.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 20, color: 'var(--bkb-gray-400)', fontSize: '0.85rem' }}>No categories created.</div>
              ) : (
                categories.map(cat => (
                  <div key={cat.id} style={{
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 10, padding: '10px 14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{cat.name}</span>
                    <button
                      onClick={() => handleDeleteCategory(cat.id, cat.name)}
                      style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 4 }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        {/* Category filter pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {catNames.map(c => (
            <button key={c} onClick={() => setFilterCat(c)}
              style={{ padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                background: filterCat === c ? 'var(--bkb-orange)' : 'rgba(255,255,255,0.06)',
                color: filterCat === c ? 'white' : 'var(--bkb-gray-400)' }}>
              {c}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="bkb-btn-ghost" onClick={() => setShowCategoriesModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: '0.88rem' }}>
            <Tag size={15} /> Categories
          </button>
          <button className="bkb-btn-primary" onClick={() => openEdit(null)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} /> Add Item
          </button>
        </div>
      </div>

      {/* Menu Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 80 }}><LoadingSpinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80, color: 'var(--bkb-gray-400)' }}>No menu items found.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filtered.map(item => (
            <div key={item.id} style={{
              background: 'var(--bkb-card-bg)', border: '1px solid var(--bkb-border)',
              borderRadius: 16, overflow: 'hidden', opacity: item.isAvailable ? 1 : 0.6,
              transition: 'all 0.2s',
            }}>
              {/* Image / placeholder */}
              <div style={{
                height: 120, background: item.imageUrl ? `url(${item.imageUrl}) center/cover` : 'linear-gradient(135deg, rgba(232,69,10,0.1), rgba(0,0,0,0.3))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem',
                position: 'relative',
              }}>
                {!item.imageUrl && '🍔'}
                {!item.isAvailable && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#EF4444', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', padding: '4px 10px', borderRadius: 6 }}>SOLD OUT</span>
                  </div>
                )}
              </div>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.3 }}>{item.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--bkb-gray-400)', marginTop: 2 }}>{item.category}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: item.promoPrice ? 'var(--bkb-gray-400)' : 'var(--bkb-orange)', fontSize: item.promoPrice ? '0.8rem' : '1rem', textDecoration: item.promoPrice ? 'line-through' : 'none' }}>{formatRM(item.price)}</div>
                    {item.promoPrice && <div style={{ fontWeight: 800, color: 'var(--bkb-orange)', fontSize: '1rem' }}>{formatRM(item.promoPrice)}</div>}
                  </div>
                </div>
                {item.description && <div style={{ fontSize: '0.78rem', color: 'var(--bkb-gray-400)', marginTop: 8, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.description}</div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <button onClick={() => handleToggle(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: item.isAvailable ? 'var(--bkb-orange)' : 'var(--bkb-gray-400)', fontSize: '0.8rem' }}>
                    {item.isAvailable ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                    {item.isAvailable ? 'Available' : 'Unavailable'}
                  </button>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="bkb-btn-ghost" onClick={() => openEdit(item)} style={{ padding: 7 }}><Edit2 size={15} /></button>
                    <button className="bkb-btn-ghost" onClick={() => handleDelete(item.id)} style={{ padding: 7, color: '#EF4444' }}><Trash2 size={15} /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const ManagerMenu: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('items');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'customize' || tabParam === 'ingredients') {
      setActiveTab('customize');
    } else {
      setActiveTab('items');
    }
  }, [location]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    navigate(`/manager/menu?tab=${tab}`);
  };

  const tabs = [
    { id: 'items', label: 'Menu Items', active: activeTab === 'items', onClick: () => handleTabChange('items') },
    { id: 'customize', label: 'Customization', active: activeTab === 'customize', onClick: () => handleTabChange('customize') }
  ];

  return (
    <ManagerLayout title="Menu & Customization" tabs={tabs}>
      {activeTab === 'items' ? <MenuContent /> : <IngredientsContent />}
    </ManagerLayout>
  );
};
