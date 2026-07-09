import { apiClient } from '@/services/api/client';
import { useAuthStore } from '@/stores/authStore';
import { router } from 'expo-router';

export function useLogin() {
  const login = useAuthStore((s) => s.login);

  return async (email: string, password: string) => {
    const res = await apiClient.post('/api/auth/login', { email, password });
    await login(res.data.data);
    router.replace('/(tabs)');
  };
}

export function useRegister() {
  const login = useAuthStore((s) => s.login);

  return async (username: string, email: string, password: string) => {
    const res = await apiClient.post('/api/auth/register', { username, email, password });
    await login(res.data.data);
    router.replace('/(tabs)');
  };
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  return logout;
}
