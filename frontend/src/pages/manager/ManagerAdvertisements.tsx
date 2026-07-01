import React, { useState, useEffect } from 'react';
import { ManagerLayout } from '../../components/layout/ManagerLayout';
import { AppPageHeader } from '../../components/ui/AppPageHeader';
import { AppTable } from '../../components/ui/AppTable';
import { AppButton } from '../../components/ui/AppButton';
import { AppBadge } from '../../components/ui/AppBadge';
import { AppModal } from '../../components/ui/AppModal';
import { AppFormField, formControlStyle, formControlClass } from '../../components/ui/AppFormField';
import { advertisementService, Advertisement, AdvertisementRequest } from '../../services/advertisement.service';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Image as ImageIcon, Check, X, ImagePlus } from 'lucide-react';
import { getImageUrl } from '../../utils/imageUtils';

export const ManagerAdvertisements: React.FC = () => {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form states
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [targetPage, setTargetPage] = useState('LANDING');
  const [type, setType] = useState<'BANNER' | 'FEATURED' | 'POPUP' | 'SEASONAL'>('BANNER');
  const [isActive, setIsActive] = useState(true);
  const [displayPriority, setDisplayPriority] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [uploading, setUploading] = useState(false);

  const fetchAds = async () => {
    setLoading(true);
    try {
      const res = await advertisementService.getAll(false);
      setAds(res.data);
    } catch (err) {
      toast.error('Failed to load advertisements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const resetForm = () => {
    setTitle('');
    setSubtitle('');
    setImageUrl('');
    setTargetPage('LANDING');
    setType('BANNER');
    setIsActive(true);
    setDisplayPriority(0);
    setStartDate('');
    setEndDate('');
    setEditingId(null);
  };

  const handleOpenNew = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ad: Advertisement) => {
    setTitle(ad.title);
    setSubtitle(ad.subtitle || '');
    setImageUrl(ad.imageUrl);
    setTargetPage(ad.targetPage || 'LANDING');
    setType(ad.type);
    setIsActive(ad.isActive);
    setDisplayPriority(ad.displayPriority || 0);
    setStartDate(ad.startDate ? ad.startDate.substring(0, 16) : '');
    setEndDate(ad.endDate ? ad.endDate.substring(0, 16) : '');
    setEditingId(ad.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this advertisement?')) return;
    try {
      await advertisementService.delete(id);
      toast.success('Advertisement deleted');
      fetchAds();
    } catch (err) {
      toast.error('Failed to delete advertisement');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await advertisementService.uploadImage(file);
      setImageUrl(res.data.url);
      toast.success('Image uploaded successfully');
    } catch (err) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !imageUrl) {
      toast.error('Title and Image are required');
      return;
    }

    const payload: AdvertisementRequest = {
      title,
      subtitle,
      imageUrl,
      targetPage,
      type,
      isActive,
      displayPriority,
      startDate: startDate ? new Date(startDate).toISOString() : undefined,
      endDate: endDate ? new Date(endDate).toISOString() : undefined
    };

    try {
      if (editingId) {
        await advertisementService.update(editingId, payload);
        toast.success('Advertisement updated');
      } else {
        await advertisementService.create(payload);
        toast.success('Advertisement created');
      }
      setIsModalOpen(false);
      fetchAds();
    } catch (err) {
      toast.error('Failed to save advertisement');
    }
  };

  const columns = [
    { 
      header: 'Image', 
      render: (ad: Advertisement) => (
        <div style={{ width: 80, height: 45, borderRadius: 6, overflow: 'hidden', background: 'var(--background)' }} className="border border-[var(--border)]">
          <img src={getImageUrl(ad.imageUrl)} alt={ad.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ) 
    },
    { 
      header: 'Title', 
      render: (ad: Advertisement) => (
        <span className="font-bold text-[var(--text-primary)]">{ad.title}</span>
      )
    },
    { header: 'Type', render: (ad: Advertisement) => <span className="font-semibold text-[var(--text-secondary)]">{ad.type}</span> },
    { header: 'Page', render: (ad: Advertisement) => <span className="font-semibold text-[var(--text-secondary)]">{ad.targetPage || '-'}</span> },
    { 
      header: 'Priority', 
      render: (ad: Advertisement) => ad.displayPriority 
    },
    { 
      header: 'Status', 
      render: (ad: Advertisement) => (
        <AppBadge 
          variant={ad.isActive ? 'success' : 'neutral'}
          icon={true}
          text={ad.isActive ? 'Active' : 'Inactive'}
        />
      )
    },
    {
      header: 'Actions',
      align: 'right' as const,
      render: (ad: Advertisement) => (
        <div className="flex gap-2 justify-end">
          <AppButton variant="ghost" size="icon" onClick={() => handleOpenEdit(ad)}>
            <Edit2 size={16} />
          </AppButton>
          <AppButton variant="ghost" size="icon" onClick={() => handleDelete(ad.id)} className="text-[var(--danger)] hover:text-red-700 hover:bg-red-50">
            <Trash2 size={16} />
          </AppButton>
        </div>
      )
    }
  ];

  return (
    <ManagerLayout title="Advertisements">
      <div className="flex flex-col gap-6">
        <AppPageHeader 
          title="Advertisement Management" 
          subtitle="Manage banners, featured items, and popups across the application"
          actions={
            <AppButton variant="primary" onClick={handleOpenNew} icon={Plus}>
              Add Advertisement
            </AppButton>
          }
        />

        <div className="flex flex-col">
          <AppTable
            data={ads}
            columns={columns}
            keyExtractor={(ad) => ad.id}
            loading={loading}
            emptyTitle="No advertisements found"
            emptyMessage="Create one to get started."
            emptyIcon={ImagePlus}
          />
        </div>

        <AppModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingId ? 'Edit Advertisement' : 'New Advertisement'}
          size="lg"
          icon={<ImagePlus size={18} className="text-[var(--primary)]" />}
        >
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <AppFormField label="Title" required>
                <input 
                  type="text" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  className={formControlClass} 
                  required 
                />
              </AppFormField>
              <AppFormField label="Type">
                <select 
                  value={type} 
                  onChange={e => setType(e.target.value as any)} 
                  className={formControlClass}
                >
                  <option value="BANNER">Banner (Hero)</option>
                  <option value="FEATURED">Featured Item</option>
                  <option value="POPUP">Popup Modal</option>
                  <option value="SEASONAL">Seasonal Highlight</option>
                </select>
              </AppFormField>
            </div>

            <AppFormField label="Subtitle / Description">
              <input 
                type="text" 
                value={subtitle} 
                onChange={e => setSubtitle(e.target.value)} 
                className={formControlClass} 
              />
            </AppFormField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <AppFormField label="Target Page">
                <select 
                  value={targetPage} 
                  onChange={e => setTargetPage(e.target.value)} 
                  className={formControlClass}
                >
                  <option value="LANDING">Landing Page</option>
                  <option value="MENU">Menu Page</option>
                  <option value="CART">Cart Page</option>
                </select>
              </AppFormField>
              
              <AppFormField label="Display Priority (Lower = First)">
                <input 
                  type="number" 
                  value={displayPriority} 
                  onChange={e => setDisplayPriority(Number(e.target.value))} 
                  className={formControlClass} 
                />
              </AppFormField>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <AppFormField label="Start Date (Optional)">
                <input 
                  type="datetime-local" 
                  value={startDate} 
                  onChange={e => setStartDate(e.target.value)} 
                  className={formControlClass} 
                />
              </AppFormField>
              <AppFormField label="End Date (Optional)">
                <input 
                  type="datetime-local" 
                  value={endDate} 
                  onChange={e => setEndDate(e.target.value)} 
                  className={formControlClass} 
                />
              </AppFormField>
            </div>

            <div className="border border-[var(--border)] rounded-xl p-4 bg-[var(--background)]">
              <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-3 uppercase tracking-wider">
                Image *
              </label>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
                {imageUrl ? (
                  <img src={getImageUrl(imageUrl)} alt="Preview" className="w-32 h-24 object-cover rounded-lg border border-[var(--border)] shadow-sm" />
                ) : (
                  <div className="w-32 h-24 bg-[var(--surface)] border border-dashed border-[var(--border)] rounded-lg flex items-center justify-center text-[var(--text-secondary)] shadow-sm">
                    <ImageIcon size={24} />
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    id="ad-image-upload" 
                    style={{ display: 'none' }} 
                  />
                  <label 
                    htmlFor="ad-image-upload" 
                    className="inline-flex items-center justify-center px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg cursor-pointer text-sm font-semibold hover:bg-[var(--background)] transition-colors shadow-sm"
                  >
                    {uploading ? 'Uploading...' : 'Upload Image'}
                  </label>
                  <div className="text-xs text-[var(--text-secondary)] mt-3 mb-1">
                    Or enter URL directly:
                  </div>
                  <input 
                    type="text" 
                    value={imageUrl} 
                    onChange={e => setImageUrl(e.target.value)} 
                    className={formControlClass} 
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>

            <label className="flex items-center gap-3 text-sm font-semibold cursor-pointer mt-2 bg-[var(--background)] border border-[var(--border)] p-3 rounded-xl hover:bg-[var(--surface)] transition-colors">
              <input 
                type="checkbox" 
                checked={isActive} 
                onChange={e => setIsActive(e.target.checked)} 
                className="w-5 h-5 accent-[var(--primary)] rounded cursor-pointer"
              />
              <span className="text-[var(--text-primary)]">Active (Display to customers)</span>
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
              <AppButton type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </AppButton>
              <AppButton type="submit" variant="primary">
                Save Advertisement
              </AppButton>
            </div>
          </form>
        </AppModal>
      </div>
    </ManagerLayout>
  );
};
