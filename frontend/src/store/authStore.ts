import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '../types';
import { STORAGE_KEYS } from '../constants/storage';
import { bkbStorage, zustandStorage } from '../utils/storage';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) => {
        bkbStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        bkbStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },

      clearAuth: () => {
        bkbStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        bkbStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },

      updateUser: (user) => {
        set({ user });
      },
    }),
    {
      name: 'bkb-auth',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      } as unknown as AuthState),
    }
  )
);
