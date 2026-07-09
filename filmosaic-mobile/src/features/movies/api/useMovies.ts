import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api/client';

export interface Movie {
  id: string;
  title: string;
  slug: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  releaseDate: string | null;
  tmdbRating: number | null;
  tmdbVoteCount: number | null;
  genres: string[];
  description: string | null;
  runtime: number | null;
  language: string | null;
  source: string;
}

export const movieKeys = {
  all: ['movies'] as const,
  popular: () => [...movieKeys.all, 'popular'] as const,
  topRated: () => [...movieKeys.all, 'topRated'] as const,
  newReleases: () => [...movieKeys.all, 'newReleases'] as const,
  recommended: () => [...movieKeys.all, 'recommended'] as const,
  trendingNepali: () => [...movieKeys.all, 'trendingNepali'] as const,
  detail: (id: string) => [...movieKeys.all, 'detail', id] as const,
  similar: (id: string) => [...movieKeys.all, 'similar', id] as const,
  reviews: (id: string) => [...movieKeys.all, 'reviews', id] as const,
  search: (q: string) => [...movieKeys.all, 'search', q] as const,
};

export function usePopularMovies() {
  return useQuery({
    queryKey: movieKeys.popular(),
    queryFn: async () => {
      const res = await apiClient.get('/api/movies/popular');
      return res.data.data as Movie[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useTopRatedMovies() {
  return useQuery({
    queryKey: movieKeys.topRated(),
    queryFn: async () => {
      const res = await apiClient.get('/api/movies/top-rated');
      return res.data.data as Movie[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useNewReleases() {
  return useQuery({
    queryKey: movieKeys.newReleases(),
    queryFn: async () => {
      const res = await apiClient.get('/api/movies/new-releases');
      return res.data.data as Movie[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useRecommendedMovies(enabled?: boolean) {
  return useQuery({
    queryKey: movieKeys.recommended(),
    queryFn: async () => {
      const res = await apiClient.get('/api/movies/recommended');
      return res.data.data as Movie[];
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMovieDetail(id: string) {
  return useQuery({
    queryKey: movieKeys.detail(id),
    queryFn: async () => {
      const res = await apiClient.get(`/api/movies/${id}`);
      return res.data.data as Movie;
    },
    enabled: !!id,
  });
}

export function useSimilarMovies(id: string) {
  return useQuery({
    queryKey: movieKeys.similar(id),
    queryFn: async () => {
      const res = await apiClient.get(`/api/movies/${id}/similar`);
      return res.data.data as Movie[];
    },
    enabled: !!id,
  });
}
