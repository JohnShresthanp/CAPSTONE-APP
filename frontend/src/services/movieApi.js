import apiClient from './api';
import { getPosterUrl as getPoster, getBackdropUrl } from './imageHelper';

export { getBackdropUrl };

export function getPosterUrl(path) {
  return getPoster(path);
}

export async function fetchPopularMovies(page = 1) {
  const response = await apiClient.get('/api/movies/popular', { params: { page } });
  const movies = response.data.data || [];
  return movies.map((m) => ({
    ...m,
    poster_path: m.poster_path || m.posterUrl || null,
    vote_average: m.vote_average ?? m.tmdbRating ?? 0,
    vote_count: m.vote_count ?? m.tmdbVoteCount ?? 0,
    release_date: m.release_date || (m.releaseDate ? m.releaseDate.slice(0, 10) : null)
  }));
}

export async function fetchNowPlayingMovies(page = 1) {
  const response = await apiClient.get('/api/movies/new-releases', { params: { page } });
  const movies = response.data.data || [];
  return movies.map((m) => ({
    ...m,
    poster_path: m.poster_path || m.posterUrl || null,
    vote_average: m.vote_average ?? m.tmdbRating ?? 0,
    vote_count: m.vote_count ?? m.tmdbVoteCount ?? 0,
    release_date: m.release_date || (m.releaseDate ? m.releaseDate.slice(0, 10) : null)
  }));
}

export async function fetchMovieDetails(id) {
  const response = await apiClient.get(`/api/movies/${id}`);
  return response.data.data;
}

export async function searchMovies(query, page = 1) {
  const response = await apiClient.get('/api/movies/search', { params: { q: query, page } });
  const body = response.data.data;
  return Array.isArray(body) ? { movies: body, total: body.length } : body;
}

export async function fetchSimilarMovies(id) {
  const response = await apiClient.get(`/api/movies/${id}/similar`);
  return response.data.data || [];
}

export async function fetchTopRatedMovies() {
  const response = await apiClient.get('/api/movies/top-rated');
  return response.data.data || [];
}

export async function fetchTrendingNepaliMovies() {
  const response = await apiClient.get('/api/movies/nepali/trending');
  return response.data.data || [];
}

export async function fetchRecommendedMovies() {
  const response = await apiClient.get('/api/movies/recommended');
  return response.data.data;
}
