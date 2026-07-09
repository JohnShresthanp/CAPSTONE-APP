import { tmdb } from '../../../config/tmdb.js';
import { getCached, setCache } from '../../../utils/cache.js';

const CACHE_TTL = 600;

const transformMovie = (movie) => ({
  id: `tmdb:${movie.id}`,
  provider: 'tmdb',
  externalId: String(movie.id),
  type: 'movie',
  title: movie.title || movie.original_title || 'Untitled',
  subtitle: movie.release_date?.slice(0, 4) || null,
  description: movie.overview || null,
  poster: movie.poster_path
    ? (movie.poster_path.startsWith('http') ? movie.poster_path : `https://image.tmdb.org/t/p/w500${movie.poster_path}`)
    : null,
  backdrop: movie.backdrop_path
    ? (movie.backdrop_path.startsWith('http') ? movie.backdrop_path : `https://image.tmdb.org/t/p/w780${movie.backdrop_path}`)
    : null,
  releaseDate: movie.release_date || null,
  genres: movie.genre_ids
    ? (movie.genre_ids.map(String))
    : (movie.genres?.map((g) => g.name || String(g)) || []),
  people: []
});

export async function search(query) {
  const cacheKey = `tmdb:search:${query.toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const results = [];

  try {
    const movieRes = await tmdb.get('/search/movie', {
      params: { query, page: 1 }
    });
    results.push(...(movieRes.data?.results || []).slice(0, 10).map(transformMovie));
  } catch (err) {
    console.error('TMDB movie search error:', err.message);
  }

  try {
    const personRes = await tmdb.get('/search/person', {
      params: { query, page: 1 }
    });
    for (const person of (personRes.data?.results || []).slice(0, 5)) {
      results.push({
        id: `tmdb:person:${person.id}`,
        provider: 'tmdb',
        externalId: String(person.id),
        type: 'person',
        title: person.name || 'Unknown',
        subtitle: person.known_for_department || 'Person',
        description: person.biography || null,
        poster: person.profile_path
          ? `https://image.tmdb.org/t/p/w185${person.profile_path}`
          : null,
        backdrop: null,
        releaseDate: null,
        genres: [],
        people: [{ name: person.name, role: person.known_for_department || 'Person' }]
      });
    }
  } catch (err) {
    console.error('TMDB person search error:', err.message);
  }

  setCache(cacheKey, results, CACHE_TTL);
  return results;
}

export async function getDetails(externalId) {
  const cacheKey = `tmdb:detail:${externalId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const movie = await tmdb.get(`/movie/${externalId}`);
    const credits = await tmdb.get(`/movie/${externalId}/credits`);
    const result = {
      ...transformMovie(movie.data),
      people: (credits.data?.cast || []).slice(0, 10).map((p) => ({
        name: p.name,
        role: p.character || 'Actor',
        profileImage: p.profile_path
          ? `https://image.tmdb.org/t/p/w185${p.profile_path}`
          : null
      }))
    };
    setCache(cacheKey, result, CACHE_TTL);
    return result;
  } catch (err) {
    console.error('TMDB detail error:', err.message);
    return null;
  }
}
