import apiClient from './api';

export async function fetchMyLists() {
  const response = await apiClient.get('/api/lists');
  return response.data.data;
}

export async function fetchListById(listId) {
  const response = await apiClient.get(`/api/lists/${listId}`);
  return response.data.data;
}

export async function createList(data) {
  const response = await apiClient.post('/api/lists', data);
  return response.data.data;
}

export async function fetchUserLists(username) {
  const response = await apiClient.get(`/api/lists/user/${username}`);
  return response.data.data;
}

export async function updateList(listId, data) {
  const response = await apiClient.put(`/api/lists/${listId}`, data);
  return response.data.data;
}

export async function addMovieToList(listId, movieId) {
  const response = await apiClient.post(`/api/lists/${listId}/movies`, { movieId });
  return response.data.data;
}

export async function removeMovieFromList(listId, movieId) {
  const response = await apiClient.delete(`/api/lists/${listId}/movies/${movieId}`);
  return response.data;
}
