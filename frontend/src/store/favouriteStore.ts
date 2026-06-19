import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MenuItem } from '../types';

interface FavouriteStore {
  items: MenuItem[];
  toggle: (item: MenuItem) => void;
  isFavourite: (id: number) => boolean;
  clear: () => void;
}

export const useFavouriteStore = create<FavouriteStore>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (item) => {
        const exists = get().items.some(i => i.id === item.id);
        set({
          items: exists
            ? get().items.filter(i => i.id !== item.id)
            : [...get().items, item],
        });
      },
      isFavourite: (id) => get().items.some(i => i.id === id),
      clear: () => set({ items: [] }),
    }),
    { name: 'bkb-favourites' }
  )
);
