import axios from 'axios';
import { getCached, setCache } from '../../../utils/cache.js';

const API_KEY = process.env.THEAUDIODB_KEY || '2';
const client = axios.create({
  baseURL: `https://www.theaudiodb.com/api/v1/json/${API_KEY}`,
  timeout: 10000
});

const CACHE_TTL = 600;

function sanitizeImage(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return path || null;
}

export async function searchArtists(query) {
  const cacheKey = `tad:search:${query.toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const res = await client.get('/search.php', { params: { s: query } });
    const artists = res.data?.artists || [];
    const results = artists.slice(0, 5).map((a) => ({
      id: a.idArtist,
      name: a.strArtist,
      genre: a.strGenre || null,
      style: a.strStyle || null,
      formedYear: a.intFormedYear || null,
      biography: a.strBiographyEN || a.strBiography || null,
      thumb: sanitizeImage(a.strArtistThumb),
      image: sanitizeImage(a.strArtistImage),
      banner: sanitizeImage(a.strArtistBanner),
      logo: sanitizeImage(a.strArtistLogo),
      fanart: sanitizeImage(a.strArtistFanart),
      fanart2: sanitizeImage(a.strArtistFanart2),
      fanart3: sanitizeImage(a.strArtistFanart3),
      facebook: a.strFacebook || null,
      twitter: a.strTwitter || null,
      website: a.strWebsite || null,
      country: a.strCountry || null
    }));
    setCache(cacheKey, results, CACHE_TTL);
    return results;
  } catch {
    return [];
  }
}

export async function getArtist(artistId) {
  const cacheKey = `tad:artist:${artistId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const res = await client.get('/artist.php', { params: { i: artistId } });
    const a = res.data?.artists?.[0];
    if (!a) return null;

    const result = {
      id: a.idArtist,
      name: a.strArtist,
      genre: a.strGenre || null,
      style: a.strStyle || null,
      formedYear: a.intFormedYear || null,
      biography: a.strBiographyEN || a.strBiography || null,
      thumb: sanitizeImage(a.strArtistThumb),
      image: sanitizeImage(a.strArtistImage),
      banner: sanitizeImage(a.strArtistBanner),
      logo: sanitizeImage(a.strArtistLogo),
      fanart: sanitizeImage(a.strArtistFanart),
      fanart2: sanitizeImage(a.strArtistFanart2),
      fanart3: sanitizeImage(a.strArtistFanart3),
      facebook: a.strFacebook || null,
      twitter: a.strTwitter || null,
      website: a.strWebsite || null,
      country: a.strCountry || null,
      mood: a.strMood || null,
      members: a.intMembers || null
    };
    setCache(cacheKey, result, CACHE_TTL);
    return result;
  } catch {
    return null;
  }
}

export async function getAlbum(albumId) {
  const cacheKey = `tad:album:${albumId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const res = await client.get('/album.php', { params: { m: albumId } });
    const a = res.data?.album?.[0];
    if (!a) return null;

    const result = {
      id: a.idAlbum,
      name: a.strAlbum,
      artistName: a.strArtist,
      yearReleased: a.intYearReleased || null,
      genre: a.strGenre || null,
      style: a.strStyle || null,
      thumb: sanitizeImage(a.strAlbumThumb),
      image: sanitizeImage(a.strAlbumImage),
      description: a.strDescriptionEN || null,
      mood: a.strMood || null,
      score: a.intScore || null
    };
    setCache(cacheKey, result, CACHE_TTL);
    return result;
  } catch {
    return null;
  }
}

export async function searchAlbums(query) {
  const cacheKey = `tad:searchalbum:${query.toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const res = await client.get('/searchalbum.php', { params: { s: query } });
    const albums = Array.isArray(res.data?.album) ? res.data.album : [];
    const results = albums.map((a) => ({
      id: a.idAlbum,
      name: a.strAlbum,
      artistName: a.strArtist,
      yearReleased: a.intYearReleased || null,
      genre: a.strGenre || null,
      style: a.strStyle || null,
      thumb: sanitizeImage(a.strAlbumThumb)
    }));
    setCache(cacheKey, results, CACHE_TTL);
    return results;
  } catch {
    return [];
  }
}
