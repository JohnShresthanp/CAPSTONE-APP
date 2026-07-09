import apiClient from './api';

export async function registerUser(data) {
  const response = await apiClient.post('/api/auth/register', data);
  return response.data;
}

export async function loginUser(data) {
  const response = await apiClient.post('/api/auth/login', data);
  return response.data;
}

export async function logoutUser() {
  const response = await apiClient.post('/api/auth/logout');
  return response.data;
}

export async function fetchCurrentUser() {
  const response = await apiClient.get('/api/auth/profile/me');
  return response.data;
}

export async function fetchOAuthUrls() {
  const response = await apiClient.get('/api/auth/oauth-urls');
  return response.data;
}
