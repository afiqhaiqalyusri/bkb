/**
 * BKB Storage Abstraction
 * 
 * Development Mode: Uses `sessionStorage` to allow testing multiple roles simultaneously in different tabs.
 * Production Mode: Uses `localStorage` to persist sessions normally across tabs.
 */

// Determine if we should use sessionStorage (dev) or localStorage (prod)
const isDevMode = import.meta.env.DEV;
const storageImpl = isDevMode ? window.sessionStorage : window.localStorage;

export const bkbStorage = {
  getItem: (key: string): string | null => {
    return storageImpl.getItem(key);
  },
  setItem: (key: string, value: string): void => {
    storageImpl.setItem(key, value);
  },
  removeItem: (key: string): void => {
    storageImpl.removeItem(key);
  },
  clear: (): void => {
    storageImpl.clear();
  }
};

// Zustand StateStorage implementation
export const zustandStorage = {
  getItem: (name: string): string | null => {
    return bkbStorage.getItem(name);
  },
  setItem: (name: string, value: string): void => {
    bkbStorage.setItem(name, value);
  },
  removeItem: (name: string): void => {
    bkbStorage.removeItem(name);
  },
};
