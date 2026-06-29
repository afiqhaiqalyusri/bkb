import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, X, Tag, Image as ImageIcon, Search } from 'lucide-react';
import { MenuItem } from '../../types';
import { menuService } from '../../services/menu.service';
import { categoryService } from '../../services/category.service';
import { ManagerLayout } from '../../components/layout/ManagerLayout';
import { IngredientsContent } from './ManagerIngredients';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { formatRM } from '../../utils/formatCurrency';
import { ErrorState } from '../../components/ui/ErrorState';
import toast from 'react-hot-toast';
import { useConfirmation } from '../../components/ConfirmationProvider';
import { useUnsavedChangesBlocker } from '../../hooks/useUnsavedChangesBlocker';

// UI Components
import { AppCard } from '../../components/ui/AppCard';
import { AppButton } from '../../components/ui/AppButton';
import { AppEmptyState } from '../../components/ui/AppEmptyState';
import { formControlClass } from '../../components/ui/AppFormField';

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
      
      {/* Search & Actions Toolbar */}
      <AppCard noPadding>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 px-6 py-5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Active Catalog</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold mt-0.5">Filter items by categorization</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Search items by name..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10 transition-all placeholder-slate-400"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <AppButton variant="secondary" size="sm" onClick={() => setShowCategoriesModal(true)} icon={Tag} className="flex-1 sm:flex-initial">Categories</AppButton>
              <AppButton variant="primary" size="sm" onClick={() => openEdit(null)} icon={Plus} className="flex-1 sm:flex-initial">Add Item</AppButton>
            </div>
          </div>
        </div>
        
        <div className="px-6 py-4 flex flex-wrap gap-1.5 bg-slate-50/50 dark:bg-slate-900/10">
          {catNames.map(c => (
            <button key={c} onClick={() => setFilterCat(c)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                filterCat === c 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'bg-white hover:bg-slate-100 border border-slate-150 text-slate-500 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}>
              {c}
            </button>
          ))}
        </div>
      </AppCard>

      {/* Menu Grid */}
      {loading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <AppCard><AppEmptyState title="No items found" description="Try adjusting your search query or category filters." /></AppCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(item => (
            <div key={item.id} className={`bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col group ${!item.isAvailable ? 'opacity-70' : ''}`}>
              <div className="h-40 relative bg-slate-50 dark:bg-slate-950 flex items-center justify-center overflow-hidden shrink-0 border-b border-slate-50 dark:border-slate-850">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300" />
                ) : (
                  <ImageIcon size={40} className="text-slate-300" />
                )}
                {!item.isAvailable && (
                  <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] flex items-center justify-center">
                    <span className="bg-red-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider">Sold Out</span>
                  </div>
                )}
              </div>
              <div className="p-5 flex flex-col justify-between flex-1">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-800 dark:text-white leading-tight m-0">{item.name}</h4>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1.5 block">{item.category}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`font-extrabold text-sm ${item.promoPrice ? 'text-slate-400 line-through text-[11px]' : 'text-primary'}`}>{formatRM(item.price)}</div>
                      {item.promoPrice && <div className="font-black text-primary text-sm mt-0.5">{formatRM(item.promoPrice)}</div>}
                    </div>
                  </div>
                  {item.description && <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed line-clamp-2 mt-2 mb-0">{item.description}</p>}
                </div>
                
                <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 shrink-0">
                  <button onClick={() => handleToggle(item.id)} className={`flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider transition-colors ${item.isAvailable ? 'text-primary' : 'text-slate-400'}`}>
                    {item.isAvailable ? <ToggleRight size={20} className="text-primary" /> : <ToggleLeft size={20} className="text-slate-300" />}
                    <span>{item.isAvailable ? 'Available' : 'Sold Out'}</span>
                  </button>
                  <div className="flex gap-1">
                    <AppButton variant="ghost" size="icon" onClick={() => openEdit(item)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50"><Edit2 size={13} /></AppButton>
                    <AppButton variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50"><Trash2 size={13} /></AppButton>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal (Sleek side-modal mockup or floating modal card) */}
      {isEditing && editItem && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={closeEditWithCheck}>
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/40">
              <h3 className="font-bold text-sm uppercase tracking-wider text-slate-700 dark:text-slate-300">{editItem.id ? 'Edit' : 'Create'} Menu Item</h3>
              <button onClick={closeEditWithCheck} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Item Name</label>
                <input type="text" value={editItem.name || ''} onChange={e => setEditItem(p => ({ ...p, name: e.target.value }))}
                  className={formControlClass} placeholder="e.g. Double Beef Cheeseburger" required />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Price (RM)</label>
                  <input type="number" step="0.01" min="0" value={editItem.price || ''} onChange={e => setEditItem(p => ({ ...p, price: Number(e.target.value) }))}
                    className={formControlClass} placeholder="12.90" required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Promo Price (RM)</label>
                  <input type="number" step="0.01" min="0" value={editItem.promoPrice || ''} onChange={e => setEditItem(p => ({ ...p, promoPrice: e.target.value ? Number(e.target.value) : undefined }))}
                    className={formControlClass} placeholder="Optional" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Category</label>
                  <select value={editItem.category || ''} onChange={e => setEditItem(p => ({ ...p, category: e.target.value }))}
                    className={formControlClass}>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Image URL</label>
                  <div className="flex flex-col gap-1.5">
                    <input type="text" value={editItem.imageUrl || ''} onChange={e => setEditItem(p => ({ ...p, imageUrl: e.target.value }))}
                      className={formControlClass} placeholder="https://..." />
                    <label className="text-[10px] font-bold text-primary cursor-pointer hover:underline inline-flex items-center gap-1 self-start">
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                      Upload from computer
                    </label>
                  </div>
                </div>
              </div>
              
              {editItem.imageUrl && !uploadingFile && (
                <div className="w-full h-36 rounded-xl border border-slate-100 overflow-hidden relative shrink-0">
                  <img src={editItem.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Description</label>
                <textarea value={editItem.description || ''} onChange={e => setEditItem(p => ({ ...p, description: e.target.value }))}
                  className={`${formControlClass} min-h-[70px] resize-none`} placeholder="Describe item ingredients and sizing..." />
              </div>
              
              <label className="flex items-center gap-2 cursor-pointer mt-1">
                <input type="checkbox" checked={!!editItem.isAvailable} onChange={e => setEditItem(p => ({ ...p, isAvailable: e.target.checked }))} className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Available on counter kiosk</span>
              </label>

              <AppButton type="submit" variant="primary" className="w-full mt-4 py-3 text-xs uppercase tracking-wider font-bold">Save Menu Item</AppButton>
            </form>
          </div>
        </div>
      )}

      {/* Categories Modal */}
      {showCategoriesModal && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowCategoriesModal(false)}>
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/40">
              <h3 className="font-bold text-sm uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5"><Tag size={15} /> Categories</h3>
              <button onClick={() => setShowCategoriesModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="p-6">
              <form onSubmit={handleAddCategory} className="flex gap-2 mb-5">
                <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="New category label..."
                  className={formControlClass} required />
                <AppButton type="submit" size="sm" disabled={savingCat} className="font-bold text-xs uppercase tracking-wider px-4">Add</AppButton>
              </form>
              <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                {categories.length === 0 ? (
                  <div className="text-center text-xs text-slate-400 py-4">No categories created.</div>
                ) : (
                  categories.map(cat => (
                    <div key={cat.id} className="flex justify-between items-center px-4 py-2.5 bg-slate-50 border border-slate-100 dark:bg-slate-950 dark:border-slate-800 rounded-xl">
                      <span className="font-bold text-xs text-slate-700 dark:text-slate-300">{cat.name}</span>
                      <AppButton variant="ghost" size="icon" onClick={() => handleDeleteCategory(cat.id, cat.name)} className="text-rose-500 hover:text-rose-700 w-7 h-7 p-0 rounded-lg">
                        <Trash2 size={12} />
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
    const tabParam = params.get('tab');
    if (tabParam === 'customize' || tabParam === 'ingredients') setActiveTab('customize');
    else setActiveTab('items');
  }, [location]);

  const tabs = [
    { id: 'items', label: 'Menu Items', active: activeTab === 'items', onClick: () => navigate('/manager/menu?tab=items') },
    { id: 'customize', label: 'Customization', active: activeTab === 'customize', onClick: () => navigate('/manager/menu?tab=customize') }
  ];

  return (
    <ManagerLayout title="Menu & Customization" tabs={tabs}>
      {activeTab === 'items' ? <MenuContent /> : <IngredientsContent />}
    </ManagerLayout>
  );
};
