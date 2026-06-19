import { create } from 'zustand';
import { categoryService } from '../services/category.service';

interface MenuStore {
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  categories: string[];
  fetchCategories: () => Promise<void>;
}

export const useMenuStore = create<MenuStore>((set) => ({
  activeCategory: 'All',
  setActiveCategory: (cat) => set({ activeCategory: cat }),
  categories: ['All', 'Burger', 'Oblong', 'Special', 'Drinks', 'Sides'],
  fetchCategories: async () => {
    try {
      const res = await categoryService.getAll();
      if (res && res.data) {
        const names = ['All', ...res.data.map(c => c.name)];
        set({ categories: names });
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  },
}));

