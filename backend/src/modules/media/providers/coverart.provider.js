import axios from 'axios';
import { getCached, setCache } from '../../../utils/cache.js';

const client = axios.create({
  baseURL: 'https://coverartarchive.org',
  timeout: 8000,
  headers: { 'User-Agent': 'FilmMosaic/1.0 ( music@filmmosaic.app )' }
});

const CACHE_TTL = 600;

export async function getReleaseGroupArt(mbid) {
  const cacheKey = `caa:rg:${mbid}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const res = await client.get(`/release-group/${mbid}`);
    const images = res.data?.images || [];
    const result = {
      images: images.map((img) => ({
        url: img.image?.replace('http:', 'https:'),
        thumbnails: img.thumbnails || {},
        front: img.front || false,
        back: img.back || false,
        approved: img.approved || false
      })),
      front: images.find((img) => img.front)?.image?.replace('http:', 'https:') || null
    };
    setCache(cacheKey, result, CACHE_TTL);
    return result;
  } catch {
    return { images: [], front: null };
  }
}

export async function getReleaseArt(mbid) {
  const cacheKey = `caa:release:${mbid}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const res = await client.get(`/release/${mbid}`);
    const images = res.data?.images || [];
    const result = {
      images: images.map((img) => ({
        url: img.image?.replace('http:', 'https:'),
        thumbnails: img.thumbnails || {},
        front: img.front || false,
        approved: img.approved || false
      })),
      front: images.find((img) => img.front)?.image?.replace('http:', 'https:') || null
    };
    setCache(cacheKey, result, CACHE_TTL);
    return result;
  } catch {
    return { images: [], front: null };
  }
}
