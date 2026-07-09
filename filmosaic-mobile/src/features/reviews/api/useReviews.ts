import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api/client';

export interface Review {
  id: string;
  userId: number;
  movieId: string;
  rating: number;
  body: string | null;
  containsSpoiler: boolean;
  createdAt: string;
  updatedAt: string;
  user?: { id: number; username: string; avatar_url?: string | null };
  movie?: { id: string; title: string; posterUrl?: string | null };
  _count?: { likes: number; comments: number };
}

function unwrapPaginated(res: any) {
  const payload = res.data.data;
  return payload?.data ?? payload ?? [];
}

export function useMovieReviews(movieId: string) {
  return useQuery({
    queryKey: ['movies', 'reviews', movieId],
    queryFn: async () => {
      const res = await apiClient.get(`/api/movies/${movieId}/reviews`);
      return unwrapPaginated(res) as Review[];
    },
    enabled: !!movieId,
  });
}

export function useReviewDetail(id: string) {
  return useQuery({
    queryKey: ['reviews', id],
    queryFn: async () => {
      const res = await apiClient.get(`/api/reviews/${id}`);
      return res.data.data as Review;
    },
    enabled: !!id,
  });
}

export function useReviewComments(reviewId: string) {
  return useQuery({
    queryKey: ['reviews', reviewId, 'comments'],
    queryFn: async () => {
      const res = await apiClient.get(`/api/reviews/${reviewId}/comments`);
      return unwrapPaginated(res);
    },
    enabled: !!reviewId,
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ movieId, rating, body }: { movieId: string; rating: number; body: string }) => {
      const res = await apiClient.post(`/api/reviews`, { movieId, rating, body });
      return res.data.data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['movies', 'reviews', variables.movieId] });
    },
  });
}

export function useToggleLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (reviewId: string) => {
      const res = await apiClient.post(`/api/reviews/${reviewId}/like`);
      return res.data.data as { liked: boolean; likeCount: number };
    },
    onSuccess: (_data, reviewId) => {
      qc.invalidateQueries({ queryKey: ['reviews', reviewId] });
    },
  });
}

export function useAddComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ reviewId, body }: { reviewId: string; body: string }) => {
      const res = await apiClient.post(`/api/reviews/${reviewId}/comments`, { body });
      return res.data.data;
    },
    onSuccess: (_data, { reviewId }) => {
      qc.invalidateQueries({ queryKey: ['reviews', reviewId, 'comments'] });
    },
  });
}
