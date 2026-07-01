import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, X, Tag, Image as ImageIcon, Search } from 'lucide-react';
import { MenuItem } from '../../types';
import { menuService } from '../../services/menu.service';
import { categoryService } from '../../services/category.service';
import { ManagerLayout } from '../../components/layout/ManagerLayout';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { formatRM } from '../../utils/formatCurrency';
import { ErrorState } from '../../components/ui/ErrorState';
import toast from 'react-hot-toast';
import { useConfirmation } from '../../components/ConfirmationProvider';
import { useUnsavedChangesBlocker } from '../../hooks/useUnsavedChangesBlocker';

// UI Components
import { AppCard } from '../../components/ui/AppCard';
import { AppButton } from '../../components/ui/AppButton';
import { AppPageHeader } from '../../components/ui/AppPageHeader';
import { AppEmptyState } from '../../components/ui/AppEmptyState';

export const MenuContent: React.FC = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editItem, setEditItem] = useState<Partial<MenuItem> | null>(null);
  const [originalItem, setOriginalItem] = useState<Partial<MenuItem> | null>(null);
  const [filterCat, setFilterCat] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const { confirm } = useConfirmation();

  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [savingCat, setSavingCat] = useState(false);

  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState('');
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true); setUploadProgress(0); setUploadingFileName(file.name); setFilePreviewUrl(null);

    const timer = setInterval(() => {
      setUploadProgress(prev => {
        const next = prev + 25;
        if (next >= 100) {
          clearInterval(timer); setUploadingFile(false);
          const preview = URL.createObjectURL(file);
          setFilePreviewUrl(preview); setEditItem(p => p ? { ...p, imageUrl: preview } : null);
          toast.success('Image uploaded successfully'); return 100;
        }
        return next;
      });
    }, 200);
  };

  const loadInitialData = () => {
    setLoading(true); setError(false);
    Promise.all([menuService.getAllItems(), categoryService.getAll()])
      .then(([menuRes, catRes]) => { setItems(menuRes.data); setCategories(catRes.data); })
      .catch((err) => { setError(true); toast.error('Failed to load menu data'); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadInitialData(); }, []);
  const loadMenu = () => menuService.getAllItems().then(res => setItems(res.data)).catch(console.error);
  const loadCategories = () => categoryService.getAll().then(res => setCategories(res.data)).catch(() => toast.error('Failed to reload categories'));

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault(); if (!newCatName.trim()) return;
    setSavingCat(true);
    try {
      await categoryService.create(newCatName.trim());
      toast.success('Category created'); setNewCatName(''); loadCategories();
    } catch { toast.error('Failed to create category'); } finally { setSavingCat(false); }
  };

  const handleDeleteCategory = async (id: number, name: string) => {
    const confirmed = await confirm({ title: 'Delete Category', message: `Delete the category "${name}"?`, confirmLabel: 'Delete', cancelLabel: 'Cancel', type: 'danger' });
    if (!confirmed) return;
    try { await categoryService.delete(id); toast.success('Category deleted'); loadCategories(); } 
    catch { toast.error('Failed to delete category'); }
  };

  const handleToggle = async (id: number) => {
    const item = items.find(i => i.id === id); if (!item) return;
    menuService.toggle(id).then(() => {
      setItems(prev => prev.map(item => item.id === id ? { ...item, isAvailable: !item.isAvailable } : item));
      toast.success('Availability updated');
    }).catch(() => toast.error('Failed to toggle status'));
  };

  const handleDelete = async (id: number) => {
    const item = items.find(i => i.id === id);
    const confirmed = await confirm({ title: 'Delete Menu Item', message: `Permanently delete "${item?.name || 'this item'}"?`, confirmLabel: 'Delete Item', cancelLabel: 'Cancel', type: 'danger' });
    if (!confirmed) return;
    menuService.delete(id).then(() => { setItems(prev => prev.filter(item => item.id !== id)); toast.success('Item deleted'); })
      .catch(() => toast.error('Failed to delete item'));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem?.name || !editItem?.price) { toast.error('Name and price are required'); return; }
    const payload = { ...editItem, price: Number(editItem.price), promoPrice: editItem.promoPrice ? Number(editItem.promoPrice) : undefined };
    const action = editItem.id ? menuService.update(editItem.id, payload) : menuService.create(payload);
    action.then(() => {
      toast.success(editItem.id ? 'Item updated' : 'Item created');
      setIsEditing(false); loadMenu(); setFilePreviewUrl(null);
    }).catch(() => toast.error('Failed to save item'));
  };

  const openEdit = (item: MenuItem | null) => {
    const defaultItem = item ? { ...item } : { name: '', price: 0, category: categories[0]?.name || 'Burger', isAvailable: true, ingredients: [] };
    setEditItem(defaultItem); setOriginalItem(defaultItem); setIsEditing(true);
  };

  const hasMenuChanges = () => {
    if (!editItem || !originalItem) return false;
    return editItem.name !== originalItem.name || editItem.price !== originalItem.price || editItem.promoPrice !== originalItem.promoPrice ||
           editItem.category !== originalItem.category || editItem.imageUrl !== originalItem.imageUrl || editItem.description !== originalItem.description ||
           editItem.isAvailable !== originalItem.isAvailable;
  };

  useUnsavedChangesBlocker(isEditing && hasMenuChanges());

  const closeEditWithCheck = async () => {
    if (hasMenuChanges()) {
      const discard = await confirm({ title: 'Unsaved Changes', message: 'Discard unsaved changes?', confirmLabel: 'Discard', cancelLabel: 'Cancel', type: 'warning' });
      if (!discard) return;
    }
    setIsEditing(false); setEditItem(null); setOriginalItem(null);
    if (filePreviewUrl) { URL.revokeObjectURL(filePreviewUrl); setFilePreviewUrl(null); }
  };

  const catNames = ['ALL', ...categories.map(c => c.name)];
  const filtered = items
    .filter(i => filterCat === 'ALL' || i.category === filterCat)
    .filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));

  if (error) return <div className="flex items-center justify-center min-h-[50vh]"><ErrorState onRetry={loadInitialData} retrying={loading} /></div>;

  return (
    <div className="flex flex-col gap-6">
      <AppPageHeader 
        title="Menu Management" 
        subtitle="Add, edit, and organize menu items and categories."
        actions={
          <>
            <AppButton variant="outline" onClick={() => setShowCategoriesModal(true)} icon={Tag}>Categories</AppButton>
            <AppButton variant="primary" onClick={() => openEdit(null)} icon={Plus}>Add Item</AppButton>
          </>
        }
      />

      {/* Toolbar */}
      <AppCard className="!p-4" noPadding>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-6 py-4">
          <div className="flex flex-wrap gap-2">
            {catNames.map(c => (
              <button key={c} onClick={() => setFilterCat(c)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  filterCat === c ? 'bg-[var(--primary)] text-white' : 'bg-[var(--background)] text-[var(--text-secondary)] hover:bg-[rgba(0,0,0,0.05)]'
                }`}>
                {c}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={16} />
            <input 
              type="text" 
              placeholder="Search items..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)]"
            />
          </div>
        </div>
      </AppCard>

      {/* Menu Grid */}
      {loading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <AppCard><AppEmptyState title="No items found" description="Try adjusting your search or category filter." /></AppCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(item => (
            <div key={item.id} className={`bg-[var(--bkb-card-bg)] border border-[var(--bkb-border)] rounded-xl overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md ${!item.isAvailable ? 'opacity-70 grayscale-[0.2]' : ''}`}>
              <div className="h-36 relative bg-[var(--background)] flex items-center justify-center overflow-hidden">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon size={48} className="text-[var(--border)]" />
                )}
                {!item.isAvailable && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="bg-red-500/90 text-white text-xs font-bold px-3 py-1 rounded-md uppercase tracking-wide">Sold Out</span>
                  </div>
                )}
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <div>
                    <h4 className="font-bold text-[var(--text-primary)] leading-tight m-0">{item.name}</h4>
                    <span className="text-xs text-[var(--text-secondary)] mt-1 block">{item.category}</span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`font-bold ${item.promoPrice ? 'text-[var(--text-secondary)] text-xs line-through' : 'text-[var(--primary)] text-sm'}`}>{formatRM(item.price)}</div>
                    {item.promoPrice && <div className="font-bold text-[var(--primary)] text-sm">{formatRM(item.promoPrice)}</div>}
                  </div>
                </div>
                {item.description && <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mt-2 mb-0">{item.description}</p>}
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border)]">
                  <button onClick={() => handleToggle(item.id)} className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${item.isAvailable ? 'text-[var(--primary)]' : 'text-[var(--text-secondary)]'}`}>
                    {item.isAvailable ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    {item.isAvailable ? 'Available' : 'Unavailable'}
                  </button>
                  <div className="flex gap-1">
                    <AppButton variant="ghost" size="icon" onClick={() => openEdit(item)}><Edit2 size={16} /></AppButton>
                    <AppButton variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="text-[var(--danger)] hover:text-red-700 hover:bg-red-50"><Trash2 size={16} /></AppButton>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && editItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={closeEditWithCheck}>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-lg overflow-hidden shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--background)]">
              <h3 className="font-bold text-lg m-0">{editItem.id ? 'Edit' : 'Add'} Menu Item</h3>
              <button onClick={closeEditWithCheck} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Item Name</label>
                <input type="text" value={editItem.name || ''} onChange={e => setEditItem(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)]" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Price (RM)</label>
                  <input type="number" step="0.01" min="0" value={editItem.price || ''} onChange={e => setEditItem(p => ({ ...p, price: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)]" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Promo Price (RM)</label>
                  <input type="number" step="0.01" min="0" value={editItem.promoPrice || ''} onChange={e => setEditItem(p => ({ ...p, promoPrice: e.target.value ? Number(e.target.value) : undefined }))}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)]" placeholder="Optional" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Category</label>
                  <select value={editItem.category || ''} onChange={e => setEditItem(p => ({ ...p, category: e.target.value }))}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)]">
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Image Source</label>
                  <div className="flex flex-col gap-2">
                    <input type="text" value={editItem.imageUrl || ''} onChange={e => setEditItem(p => ({ ...p, imageUrl: e.target.value }))}
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)]" placeholder="https://..." />
                    <label className="text-xs font-semibold text-[var(--primary)] cursor-pointer hover:underline inline-flex items-center gap-1">
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                      Upload File Instead
                    </label>
                  </div>
                </div>
              </div>
              
              {editItem.imageUrl && !uploadingFile && (
                <div className="w-full h-32 rounded-lg border border-[var(--border)] overflow-hidden">
                  <img src={editItem.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Description</label>
                <textarea value={editItem.description || ''} onChange={e => setEditItem(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)] min-h-[80px]" />
              </div>
              
              <label className="flex items-center gap-2 cursor-pointer mt-2">
                <input type="checkbox" checked={!!editItem.isAvailable} onChange={e => setEditItem(p => ({ ...p, isAvailable: e.target.checked }))} className="w-4 h-4 accent-[var(--primary)]" />
                <span className="text-sm font-semibold">Available for Ordering</span>
              </label>

              <AppButton type="submit" variant="primary" className="w-full mt-4" size="lg">Save Item</AppButton>
            </form>
          </div>
        </div>
      )}

      {/* Categories Modal */}
      {showCategoriesModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowCategoriesModal(false)}>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-sm overflow-hidden shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--background)]">
              <h3 className="font-bold text-lg m-0 flex items-center gap-2"><Tag size={18} className="text-[var(--primary)]" /> Categories</h3>
              <button onClick={() => setShowCategoriesModal(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><X size={20} /></button>
            </div>
            <div className="p-6">
              <form onSubmit={handleAddCategory} className="flex gap-2 mb-6">
                <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="New category..."
                  className="flex-1 px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)]" required />
                <AppButton type="submit" disabled={savingCat}>Add</AppButton>
              </form>
              <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto pr-2">
                {categories.length === 0 ? (
                  <div className="text-center text-sm text-[var(--text-secondary)] py-4">No categories created.</div>
                ) : (
                  categories.map(cat => (
                    <div key={cat.id} className="flex justify-between items-center px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-lg">
                      <span className="font-semibold text-sm">{cat.name}</span>
                      <AppButton variant="ghost" size="icon" onClick={() => handleDeleteCategory(cat.id, cat.name)} className="text-[var(--danger)] hover:text-red-700 w-8 h-8 p-0">
                        <Trash2 size={14} />
                      </AppButton>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
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
    setActiveTab('items');
  }, [location]);

  const tabs = [
    { id: 'items', label: 'Menu Items', active: true, onClick: () => navigate('/manager/menu') },
  ];

  return (
    <ManagerLayout title="Menu" tabs={tabs}>
      <MenuContent />
    </ManagerLayout>
  );
};
