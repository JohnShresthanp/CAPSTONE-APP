const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/w780';

export function getPosterUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${TMDB_IMAGE_BASE}${path}`;
}

export function getBackdropUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${TMDB_BACKDROP_BASE}${path}`;
}
