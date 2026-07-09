import { create } from 'zustand';
import { tokenStorage } from '@/services/storage/tokenStorage';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'moderator' | 'super_admin';
  avatar?: string | null;
  createdAt?: string;
}

interface AuthState {
  user: User | null;
  isHydrated: boolean;
  isAuthenticated: boolean;
  login: (data: { token: string; refreshToken: string; user: User }) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isHydrated: false,
  isAuthenticated: false,

  login: async (data) => {
    await tokenStorage.setToken(data.token);
    await tokenStorage.setRefreshToken(data.refreshToken);
    await tokenStorage.setUser(data.user as unknown as Record<string, unknown>);
    set({ user: data.user, isAuthenticated: true });
  },

  logout: async () => {
    try {
      const { apiClient } = await import('@/services/api/client');
      await apiClient.post('/api/auth/logout');
    } catch {
      // best-effort
    }
    await tokenStorage.clear();
    set({ user: null, isAuthenticated: false });
  },

  hydrate: async () => {
    try {
      const token = await tokenStorage.getToken();
      if (!token) {
        set({ isHydrated: true, isAuthenticated: false, user: null });
        return;
      }
      const user = await tokenStorage.getUser<User>();
      if (user) {
        set({ user, isAuthenticated: true, isHydrated: true });
      } else {
        set({ isHydrated: true, isAuthenticated: false, user: null });
      }
    } catch {
      set({ isHydrated: true, isAuthenticated: false, user: null });
    }
  },

  updateUser: (partial) => {
    const current = get().user;
    if (!current) return;
    const updated = { ...current, ...partial };
    set({ user: updated });
    tokenStorage.setUser(updated as unknown as Record<string, unknown>);
  },
}));
