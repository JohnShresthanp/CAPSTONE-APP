import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClientProvider } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { queryClient } from '@/services/api/queryClient';
import { queryPersister } from '@/services/api/persister';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';

SplashScreen.preventAutoHideAsync();

export function RootProvider({ children }: { children: React.ReactNode }) {
  const hydrate = useAuthStore((s) => s.hydrate);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const activeTheme = useUIStore((s) => s.activeTheme);

  useNetworkStatus();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (isHydrated) {
      SplashScreen.hideAsync();
    }
  }, [isHydrated]);

  useEffect(() => {
    persistQueryClient({
      queryClient,
      persister: queryPersister,
      maxAge: 24 * 60 * 60 * 1000,
    });
  }, []);

  if (!isHydrated) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style={activeTheme === 'dark' ? 'light' : 'dark'} />
        {children}
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
