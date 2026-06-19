import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, MenuItem, Customisation } from '../types';
import { APP_CONFIG } from '../constants/config';

const areCustomisationsEqual = (a: Customisation[] = [], b: Customisation[] = []) => {
  const normalize = (list: Customisation[] = []) => {
    return list
      .filter(c => {
        const name = c.ingredient.toLowerCase();
        if (name === 'remarks') return true;
        if (name === 'cheese') return c.level.toUpperCase() === 'EXTRA';
        return c.level.toUpperCase() !== 'MEDIUM';
      })
      .map(c => ({
        ingredient: c.ingredient.toLowerCase(),
        level: c.level.toUpperCase()
      }))
      .sort((x, y) => x.ingredient.localeCompare(y.ingredient));
  };

  const normA = normalize(a);
  const normB = normalize(b);

  if (normA.length !== normB.length) return false;
  for (let i = 0; i < normA.length; i++) {
    if (normA[i].ingredient !== normB[i].ingredient || normA[i].level !== normB[i].level) {
      return false;
    }
  }
  return true;
};

interface CartState {
  items: CartItem[];
  addItem: (menuItem: MenuItem, quantity?: number, customisations?: Customisation[], isFree?: boolean) => void;
  removeItem: (menuItemId: number, customisations?: Customisation[], isFree?: boolean) => void;
  updateQuantity: (menuItemId: number, quantity: number, customisations?: Customisation[], isFree?: boolean) => void;
  updateCustomisations: (menuItemId: number, oldCustomisations: Customisation[], newCustomisations: Customisation[], isFree?: boolean) => void;
  clearCart: () => void;
  total: () => number;
  subtotal: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (menuItem, quantity = 1, customisations = [], isFree = false) => {
        set((state) => {
          const existing = state.items.find(i =>
            i.menuItem.id === menuItem.id &&
            areCustomisationsEqual(i.customisations, customisations) &&
            !!i.isFree === !!isFree
          );
          if (existing) {
            return {
              items: state.items.map(i =>
                i.menuItem.id === menuItem.id &&
                areCustomisationsEqual(i.customisations, customisations) &&
                !!i.isFree === !!isFree
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, { menuItem, quantity, customisations, isFree }] };
        });
      },

      removeItem: (menuItemId, customisations, isFree) =>
        set((state) => ({
          items: state.items.filter(i =>
            !(i.menuItem.id === menuItemId &&
              (customisations === undefined || areCustomisationsEqual(i.customisations, customisations)) &&
              (isFree === undefined || !!i.isFree === !!isFree))
          )
        })),

      updateQuantity: (menuItemId, quantity, customisations, isFree) => {
        if (quantity <= 0) {
          get().removeItem(menuItemId, customisations, isFree);
          return;
        }
        set((state) => ({
          items: state.items.map(i =>
            i.menuItem.id === menuItemId &&
            (customisations === undefined || areCustomisationsEqual(i.customisations, customisations)) &&
            (isFree === undefined || !!i.isFree === !!isFree)
              ? { ...i, quantity }
              : i
          ),
        }));
      },

      updateCustomisations: (menuItemId, oldCustomisations = [], newCustomisations = [], isFree = false) => {
        set((state) => {
          const oldItem = state.items.find(i =>
            i.menuItem.id === menuItemId &&
            areCustomisationsEqual(i.customisations, oldCustomisations) &&
            !!i.isFree === !!isFree
          );
          if (!oldItem) return {};

          const targetItem = state.items.find(i =>
            i.menuItem.id === menuItemId &&
            areCustomisationsEqual(i.customisations, newCustomisations) &&
            !!i.isFree === !!isFree &&
            i !== oldItem
          );

          if (targetItem) {
            return {
              items: state.items
                .map(i => {
                  if (i === targetItem) {
                    return { ...i, quantity: i.quantity + oldItem.quantity };
                  }
                  return i;
                })
                .filter(i => i !== oldItem)
            };
          }

          return {
            items: state.items.map(i =>
              i === oldItem ? { ...i, customisations: newCustomisations } : i
            )
          };
        });
      },

      clearCart: () => set({ items: [] }),

      subtotal: () => {
        const items = get().items;
        return items.reduce((sum, item) => {
          const price = item.isFree ? 0 : (item.menuItem.promoPrice ?? item.menuItem.price);
          return sum + price * item.quantity;
        }, 0);
      },

      total: () => {
        const sub = get().subtotal();
        return sub * (1 + APP_CONFIG.SST_RATE); // 6% SST
      },

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'bkb-cart' }
  )
);
