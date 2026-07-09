const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export const TMDB_POSTER_SIZE = 'w500';
export const TMDB_BACKDROP_SIZE = 'w780';
export const TMDB_PROFILE_SIZE = 'w185';

export const getPosterUrl = (movie, size = TMDB_POSTER_SIZE) => {
  if (!movie?.posterUrl) return null;
  if (movie.source === 'NEPALI' || movie.posterUrl.startsWith('http')) return movie.posterUrl;
  return `${TMDB_IMAGE_BASE_URL}/${size}${movie.posterUrl}`;
};

export const getBackdropUrl = (movie, size = TMDB_BACKDROP_SIZE) => {
  if (!movie?.backdropUrl) return null;
  if (movie.source === 'NEPALI' || movie.backdropUrl.startsWith('http')) return movie.backdropUrl;
  return `${TMDB_IMAGE_BASE_URL}/${size}${movie.backdropUrl}`;
};
