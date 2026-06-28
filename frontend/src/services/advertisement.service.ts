import api from './api';

export interface Advertisement {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  targetPage?: string;
  type: 'BANNER' | 'FEATURED' | 'POPUP' | 'SEASONAL';
  isActive: boolean;
  displayPriority: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AdvertisementRequest {
  title: string;
  subtitle?: string;
  imageUrl: string;
  targetPage?: string;
  type: 'BANNER' | 'FEATURED' | 'POPUP' | 'SEASONAL';
  isActive: boolean;
  displayPriority?: number;
  startDate?: string;
  endDate?: string;
}

export const advertisementService = {
  getAll: (activeOnly = true, targetPage?: string) => {
    let url = `/api/advertisements?activeOnly=${activeOnly}`;
    if (targetPage) url += `&targetPage=${targetPage}`;
    return api.get<Advertisement[]>(url);
  },

  create: (data: AdvertisementRequest) => {
    return api.post<Advertisement>('/api/advertisements', data);
  },

  update: (id: string, data: AdvertisementRequest) => {
    return api.put<Advertisement>(`/api/advertisements/${id}`, data);
  },

  delete: (id: string) => {
    return api.delete(`/api/advertisements/${id}`);
  },

  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{ url: string }>('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};
