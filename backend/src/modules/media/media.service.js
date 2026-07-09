import { prisma } from '../../lib/prisma.js';
import { ApiError } from '../../utils/apiError.js';
import { getCached, setCache } from '../../utils/cache.js';
import * as tmdbProvider from './providers/tmdb.provider.js';
import * as openlibraryProvider from './providers/openlibrary.provider.js';
import * as musicbrainzProvider from './providers/musicbrainz.provider.js';

const providers = {
  tmdb: tmdbProvider,
  openlibrary: openlibraryProvider,
  musicbrainz: musicbrainzProvider
};

const CACHE_TTL = 300;

export async function unifiedSearch({ q, page = 1, limit = 20 }) {
  if (!q || !q.trim()) {
    return { results: [], total: 0 };
  }

  const cacheKey = `media:search:${q.toLowerCase().trim()}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const results = [];
  const errors = [];

  const searches = [
    { name: 'tmdb', fn: () => tmdbProvider.search(q) },
    { name: 'openlibrary', fn: () => openlibraryProvider.search(q) },
    { name: 'musicbrainz', fn: () => musicbrainzProvider.search(q) }
  ];

  const outcomes = await Promise.allSettled(
    searches.map((s) => s.fn())
  );

  outcomes.forEach((outcome, i) => {
    if (outcome.status === 'fulfilled') {
      results.push(...outcome.value);
    } else {
      errors.push({ provider: searches[i].name, error: outcome.reason?.message });
    }
  });

  const total = results.length;
  const paged = results.slice(0, limit);

  const response = { results: paged, total };

  setCache(cacheKey, response, CACHE_TTL);
  return response;
}

export async function getMediaDetail(provider, externalId) {
  if (!providers[provider]) {
    throw new ApiError(400, `Unknown provider: ${provider}`);
  }

  const prov = providers[provider];

  if (provider === 'tmdb') {
    return prov.getDetails(externalId);
  }

  if (provider === 'openlibrary') {
    return prov.getDetails(externalId);
  }

  if (provider === 'musicbrainz') {
    const musicbrainz = prov;
    if (!externalId) throw new ApiError(400, 'Missing externalId');
    const [albumResult, artistResult] = await Promise.allSettled([
      musicbrainz.getAlbumDetails(externalId).catch(() => null),
      musicbrainz.getArtistDetails(externalId).catch(() => null)
    ]);

    const album = albumResult.status === 'fulfilled' ? albumResult.value : null;
    const artist = artistResult.status === 'fulfilled' ? artistResult.value : null;

    if (album) {
      const albumData = album;
      if (albumData.tracks || albumData.genres) return albumData;
    }
    if (artist) {
      const artistData = artist;
      if (artistData.albums || artistData.biography) return artistData;
    }
    throw new ApiError(404, 'Not found on MusicBrainz');
  }

  throw new ApiError(400, `Provider ${provider} detail not implemented`);
}

export async function addFavorite({ userId, provider, externalId, mediaType, title, poster, subtitle }) {
  externalId = externalId.replace(/^\//, '');
  const existing = await prisma.favorite.findUnique({
    where: {
      userId_provider_externalId: { userId, provider, externalId }
    }
  });

  if (existing) {
    return existing;
  }

  const favorite = await prisma.favorite.create({
    data: { userId, provider, externalId, mediaType, title, poster, subtitle }
  });

  return favorite;
}

export async function removeFavorite({ userId, favoriteId }) {
  const fav = await prisma.favorite.findFirst({
    where: { id: favoriteId, userId }
  });

  if (!fav) {
    throw new ApiError(404, 'Favorite not found');
  }

  await prisma.favorite.delete({ where: { id: favoriteId } });
  return { message: 'Removed from favorites' };
}

export async function getUserFavorites({ userId, mediaType, page = 1, limit = 20 }) {
  const where = { userId };
  if (mediaType) where.mediaType = mediaType;

  const [favorites, total] = await Promise.all([
    prisma.favorite.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.favorite.count({ where })
  ]);

  return { favorites, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getUserFavoritesByType(userId) {
  const all = await prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });

  // Strip leading slashes from externalId for backward compatibility
  const clean = all.map((f) => ({ ...f, externalId: f.externalId.replace(/^\//, '') }));

  const grouped = {
    movie: clean.filter((f) => f.mediaType === 'movie'),
    book: clean.filter((f) => f.mediaType === 'book'),
    album: clean.filter((f) => f.mediaType === 'album'),
    artist: clean.filter((f) => f.mediaType === 'artist'),
    music: clean.filter((f) => f.mediaType === 'album' || f.mediaType === 'artist'),
    person: clean.filter((f) => f.mediaType === 'person')
  };

  return {
    ...grouped,
    recent: clean.slice(0, 6)
  };
}
