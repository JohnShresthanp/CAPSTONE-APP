import apiClient from './api';

export async function fetchUserProfile(username) {
  const response = await apiClient.get(`/api/users/${username}`);
  return response.data.data;
}

export async function fetchUserReviews(username) {
  const response = await apiClient.get(`/api/users/${username}/reviews`);
  const body = response.data.data;
  return Array.isArray(body) ? body : (body.data || []);
}

export async function fetchUserLists(username) {
  const response = await apiClient.get(`/api/users/${username}/lists`);
  return response.data.data;
}

export async function fetchUserStats(username) {
  const response = await apiClient.get(`/api/users/${username}/stats`);
  return response.data.data;
}

export async function updateProfile(formData) {
  const response = await apiClient.put('/api/users/me/profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data.data;
}

export async function fetchUserDiary(username) {
  const response = await apiClient.get(`/api/users/${username}/diary`);
  return response.data.data || [];
}

export async function fetchUserPerson(username) {
  const response = await apiClient.get(`/api/users/${username}`);
  return response.data.data;
}

export async function followUser(username) {
  const response = await apiClient.post(`/api/users/${username}/follow`);
  return response.data.data;
}

export async function fetchFollowers(username, page = 1) {
  const response = await apiClient.get(`/api/users/${username}/followers`, { params: { page } });
  return response.data.data;
}

export async function fetchFollowing(username, page = 1) {
  const response = await apiClient.get(`/api/users/${username}/following`, { params: { page } });
  return response.data.data;
}

export async function fetchActivityFeed(page = 1) {
  const response = await apiClient.get('/api/users/feed/activity', { params: { page } });
  return response.data.data;
}

export async function updateGenrePreferences(genres) {
  const response = await apiClient.put('/api/users/me/genres', { genres });
  return response.data.data;
}
