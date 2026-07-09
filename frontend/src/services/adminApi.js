import apiClient from './api';

export async function fetchAdminStats() {
  const response = await apiClient.get('/api/admin/stats');
  return response.data.data;
}

export async function fetchAdminUsers(params = {}) {
  const response = await apiClient.get('/api/admin/users', { params });
  return response.data.data;
}

export async function updateUserRole(userId, role) {
  const response = await apiClient.put(`/api/admin/users/${userId}/role`, { role });
  return response.data.data;
}

export async function banUser(userId) {
  const response = await apiClient.delete(`/api/admin/users/${userId}`);
  return response.data;
}

export async function unbanUser(userId) {
  const response = await apiClient.put(`/api/admin/users/${userId}/unban`);
  return response.data;
}

export async function fetchAdminReviews(params = {}) {
  const response = await apiClient.get('/api/admin/reviews', { params });
  return response.data.data;
}

export async function fetchFlaggedReviews() {
  const response = await apiClient.get('/api/admin/reviews/flagged');
  return response.data.data;
}

export async function flagReview(reviewId) {
  const response = await apiClient.post(`/api/admin/reviews/${reviewId}/flag`);
  return response.data;
}

export async function moderateDeleteReview(reviewId) {
  const response = await apiClient.delete(`/api/admin/reviews/${reviewId}`);
  return response.data;
}

export async function createAdminMovie(data) {
  const response = await apiClient.post('/api/admin/movies', data);
  return response.data.data;
}

export async function searchAdminPersons(query) {
  const response = await apiClient.get('/api/admin/persons/search', { params: { q: query } });
  return response.data.data;
}

export async function createAdminPerson(data) {
  const response = await apiClient.post('/api/admin/persons', data);
  return response.data.data;
}

export async function addAdminCast(data) {
  const response = await apiClient.post('/api/admin/cast', data);
  return response.data.data;
}

export async function removeAdminCast(castId) {
  const response = await apiClient.delete(`/api/admin/cast/${castId}`);
  return response.data;
}

export async function importMoviesCsv(file) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post('/api/admin/movies/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data.data;
}
