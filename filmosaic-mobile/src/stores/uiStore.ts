import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'dark' | 'light' | 'system';

interface UIState {
  theme: ThemeMode;
  activeTheme: 'dark' | 'light';
  isOnline: boolean;
  language: string;
  onboardingDone: boolean;
  setTheme: (theme: ThemeMode) => void;
  setActiveTheme: (theme: 'dark' | 'light') => void;
  setOnline: (online: boolean) => void;
  setLanguage: (lang: string) => void;
  setOnboardingDone: (done: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'dark',
      activeTheme: 'dark',
      isOnline: true,
      language: 'en',
      onboardingDone: false,
      setTheme: (theme) => set({ theme }),
      setActiveTheme: (activeTheme) => set({ activeTheme }),
      setOnline: (isOnline) => set({ isOnline }),
      setLanguage: (language) => set({ language }),
      setOnboardingDone: (onboardingDone) => set({ onboardingDone }),
    }),
    {
      name: 'ui-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        onboardingDone: state.onboardingDone,
      }),
    }
  )
);
