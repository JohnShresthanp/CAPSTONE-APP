import apiClient from './api';

export async function fetchReview(reviewId) {
  const response = await apiClient.get(`/api/reviews/${reviewId}`);
  return response.data.data;
}

export async function createReview(data) {
  const response = await apiClient.post('/api/reviews', data);
  return response.data.data;
}

export async function updateReview(reviewId, data) {
  const response = await apiClient.put(`/api/reviews/${reviewId}`, data);
  return response.data.data;
}

export async function fetchComments(reviewId) {
  const response = await apiClient.get(`/api/reviews/${reviewId}/comments`);
  return response.data.data;
}

export async function fetchMovieReviews(movieId) {
  const response = await apiClient.get(`/api/movies/${movieId}/reviews`);
  const body = response.data.data;
  return Array.isArray(body) ? body : (body.data || []);
}

export async function likeReview(reviewId) {
  const response = await apiClient.post(`/api/reviews/${reviewId}/like`);
  return response.data.data;
}

export async function deleteReview(reviewId) {
  const response = await apiClient.delete(`/api/reviews/${reviewId}`);
  return response.data;
}

export async function addComment(reviewId, body) {
  const response = await apiClient.post(`/api/reviews/${reviewId}/comments`, { body });
  return response.data.data;
}

export async function deleteComment(reviewId, commentId) {
  const response = await apiClient.delete(`/api/reviews/${reviewId}/comments/${commentId}`);
  return response.data;
}
