import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api/client';

export interface MovieList {
  id: string;
  name: string;
  description: string | null;
  isPrivate: boolean;
  isSystem: boolean;
  systemType: string | null;
  itemCount?: number;
  createdAt: string;
}

export function useMyLists(enabled?: boolean) {
  return useQuery({
    queryKey: ['lists', 'mine'],
    queryFn: async () => {
      const res = await apiClient.get('/api/lists');
      return res.data.data as MovieList[];
    },
    enabled,
  });
}

export function useListDetail(id: string) {
  return useQuery({
    queryKey: ['lists', id],
    queryFn: async () => {
      const res = await apiClient.get(`/api/lists/${id}`);
      return res.data.data as MovieList & { items: Array<{ movieId: string; title: string; posterUrl: string | null; rating: number | null }> };
    },
    enabled: !!id,
  });
}
