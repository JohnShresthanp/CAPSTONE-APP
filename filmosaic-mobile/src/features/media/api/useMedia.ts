import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api/client';

export function useMediaDetail(provider: string, id: string) {
  return useQuery({
    queryKey: ['media', provider, id],
    queryFn: async () => {
      const res = await apiClient.get(`/api/media/${provider}/${id}`);
      return res.data.data as any;
    },
    enabled: !!provider && !!id,
  });
}

export function useFavorites() {
  return useQuery({
    queryKey: ['media', 'favorites'],
    queryFn: async () => {
      const res = await apiClient.get('/api/media/favorites');
      return res.data.data as any[];
    },
  });
}
