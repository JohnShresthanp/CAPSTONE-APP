import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api/client';

export interface PublicProfile {
  id: number;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  counts: {
    followers: number;
    following: number;
    reviews: number;
    watchedMovies: number;
  };
  recentlyWatched: any[];
  likedMovies: any[];
  favorites: Record<string, any[]>;
}

function unwrapPaginated(res: any) {
  const payload = res.data.data;
  return payload?.data ?? payload ?? [];
}

export function useUserProfile(username: string) {
  return useQuery({
    queryKey: ['users', username],
    queryFn: async () => {
      const res = await apiClient.get(`/api/users/${username}`);
      return res.data.data as PublicProfile;
    },
    enabled: !!username,
  });
}

export function useUserReviews(username: string) {
  return useQuery({
    queryKey: ['users', username, 'reviews'],
    queryFn: async () => {
      const res = await apiClient.get(`/api/users/${username}/reviews`);
      return unwrapPaginated(res);
    },
    enabled: !!username,
  });
}

export function useUserLists(username: string) {
  return useQuery({
    queryKey: ['users', username, 'lists'],
    queryFn: async () => {
      const res = await apiClient.get(`/api/users/${username}/lists`);
      return res.data.data as any[];
    },
    enabled: !!username,
  });
}

export function useActivityFeed() {
  return useQuery({
    queryKey: ['feed', 'activity'],
    queryFn: async () => {
      const res = await apiClient.get('/api/users/feed/activity');
      return unwrapPaginated(res);
    },
    staleTime: 60 * 1000,
  });
}
