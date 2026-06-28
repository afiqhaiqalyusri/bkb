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
import { Plus, Edit2, Trash2, Image as ImageIcon, Check, X } from 'lucide-react';
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
        <div style={{ width: 60, height: 40, borderRadius: 4, overflow: 'hidden', background: 'var(--secondary-bg)' }}>
          <img src={getImageUrl(ad.imageUrl)} alt={ad.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ) 
    },
    { header: 'Title', render: (ad: Advertisement) => ad.title },
    { header: 'Type', render: (ad: Advertisement) => ad.type },
    { header: 'Page', render: (ad: Advertisement) => ad.targetPage || '-' },
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
      render: (ad: Advertisement) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <AppButton variant="outline" size="sm" onClick={() => handleOpenEdit(ad)}>
            <Edit2 size={14} />
          </AppButton>
          <AppButton variant="danger" size="sm" onClick={() => handleDelete(ad.id)}>
            <Trash2 size={14} />
          </AppButton>
        </div>
      )
    }
  ];

  return (
    <ManagerLayout title="Advertisements">
      <AppPageHeader 
        title="Advertisement Management" 
        subtitle="Manage banners, featured items, and popups across the application"
        actions={
          <AppButton variant="primary" onClick={handleOpenNew}>
            <Plus size={16} style={{ marginRight: 6 }} /> Add Advertisement
          </AppButton>
        }
      />

      <div className="card">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading advertisements...</div>
        ) : (
          <AppTable
            data={ads}
            columns={columns}
            keyExtractor={(ad) => ad.id}
            emptyMessage="No advertisements found. Create one to get started."
          />
        )}
      </div>

      <AppModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Advertisement' : 'New Advertisement'}
        size="lg"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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

          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 16 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8, display: 'block' }}>
              Image *
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {imageUrl ? (
                <img src={getImageUrl(imageUrl)} alt="Preview" style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 6 }} />
              ) : (
                <div style={{ width: 120, height: 80, background: 'var(--secondary-bg)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
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
                  style={{ display: 'inline-block', padding: '8px 16px', background: 'var(--secondary-bg)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }}
                >
                  {uploading ? 'Uploading...' : 'Upload Image'}
                </label>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 6 }}>
                  Or enter URL directly:
                </div>
                <input 
                  type="text" 
                  value={imageUrl} 
                  onChange={e => setImageUrl(e.target.value)} 
                  className="input-field" 
                  style={{ marginTop: 4, padding: '6px 10px', fontSize: '0.8rem' }}
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', cursor: 'pointer', marginTop: 8 }}>
            <input 
              type="checkbox" 
              checked={isActive} 
              onChange={e => setIsActive(e.target.checked)} 
              style={{ width: 16, height: 16, accentColor: 'var(--primary)' }}
            />
            Active (Display to customers)
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            <AppButton type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </AppButton>
            <AppButton type="submit" variant="primary">
              Save Advertisement
            </AppButton>
          </div>
        </form>
      </AppModal>
    </ManagerLayout>
  );
};
