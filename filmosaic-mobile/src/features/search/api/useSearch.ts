import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api/client';

export interface MediaResult {
  id: string;
  provider: string;
  externalId: string;
  type: 'movie' | 'book' | 'album' | 'artist' | 'person';
  title: string;
  subtitle: string | null;
  poster: string | null;
  releaseDate: string | null;
}

export function useSearch(query: string, enabled?: boolean) {
  return useQuery({
    queryKey: ['search', query],
    queryFn: async () => {
      const res = await apiClient.get('/api/media/search', { params: { q: query } });
      const payload = res.data.data;
      return (payload?.results || []) as MediaResult[];
    },
    enabled: (enabled ?? !!query.trim()) && query.trim().length > 0,
    staleTime: 60 * 1000,
  });
}
