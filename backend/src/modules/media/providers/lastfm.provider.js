import axios from 'axios';
import { getCached, setCache } from '../../../utils/cache.js';

const API_KEY = process.env.LASTFM_API_KEY || '4c5d0e6d8a5f4b8a9c0d1e2f3a4b5c6d';
const BASE = 'https://ws.audioscrobbler.com/2.0';

const client = axios.create({
  baseURL: BASE,
  timeout: 8000,
  params: { api_key: API_KEY, format: 'json' }
});

const CACHE_TTL = 600;

export async function getArtistInfo(artistName) {
  const cacheKey = `lfm:artist:${artistName.toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const [infoRes, similarRes, topTracksRes] = await Promise.allSettled([
      client.get('/', { params: { method: 'artist.getinfo', artist: artistName } }),
      client.get('/', { params: { method: 'artist.getsimilar', artist: artistName, limit: 6 } }),
      client.get('/', { params: { method: 'artist.gettoptracks', artist: artistName, limit: 5 } })
    ]);

    const result = { tags: [], similar: [], topTracks: [], listeners: null, playCount: null, summary: null };

    if (infoRes.status === 'fulfilled') {
      const artist = infoRes.value.data?.artist;
      if (artist) {
        result.tags = (artist.tags?.tag || []).map((t) => t.name);
        result.listeners = parseInt(artist.stats?.listeners) || null;
        result.playCount = parseInt(artist.stats?.playcount) || null;
        result.summary = artist.bio?.summary?.replace(/<[^>]*>/g, '')?.trim() || null;
      }
    }

    if (similarRes.status === 'fulfilled') {
      const similar = similarRes.value.data?.similarartists?.artist || [];
      result.similar = similar.slice(0, 6).map((a) => ({
        name: a.name,
        match: parseFloat(a.match) || 0
      }));
    }

    if (topTracksRes.status === 'fulfilled') {
      const tracks = topTracksRes.value.data?.toptracks?.track || [];
      result.topTracks = tracks.slice(0, 5).map((t) => ({
        name: t.name,
        listeners: parseInt(t.listeners) || 0,
        url: t.url
      }));
    }

    setCache(cacheKey, result, CACHE_TTL);
    return result;
  } catch {
    return { tags: [], similar: [], topTracks: [], listeners: null, playCount: null, summary: null };
  }
}

export async function getAlbumInfo(artistName, albumName) {
  const cacheKey = `lfm:album:${artistName.toLowerCase()}:${albumName.toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const [infoRes, similarRes] = await Promise.allSettled([
      client.get('/', { params: { method: 'album.getinfo', artist: artistName, album: albumName } }),
      client.get('/', { params: { method: 'album.getsimilar', artist: artistName, album: albumName, limit: 6 } })
    ]);

    const result = { tags: [], similar: [], listeners: null, playCount: null, summary: null, wiki: null };

    if (infoRes.status === 'fulfilled') {
      const album = infoRes.value.data?.album;
      if (album) {
        result.tags = (album.tags?.tag || []).map((t) => t.name);
        result.listeners = parseInt(album.listeners) || null;
        result.playCount = parseInt(album.playcount) || null;
        result.wiki = album.wiki?.summary?.replace(/<[^>]*>/g, '')?.trim() || null;
        result.summary = result.wiki;
      }
    }

    if (similarRes.status === 'fulfilled') {
      const similar = similarRes.value.data?.similaralbums?.album || [];
      result.similar = similar.slice(0, 6).map((a) => ({
        name: a.name,
        artist: a.artist?.name || null,
        match: parseFloat(a.match) || 0
      }));
    }

    setCache(cacheKey, result, CACHE_TTL);
    return result;
  } catch {
    return { tags: [], similar: [], listeners: null, playCount: null, summary: null, wiki: null };
  }
}

export async function searchArtist(query) {
  const cacheKey = `lfm:search:${query.toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const res = await client.get('/', {
      params: { method: 'artist.search', artist: query, limit: 5 }
    });
    const artists = res.data?.results?.artistmatches?.artist || [];
    const results = artists.map((a) => ({
      name: a.name,
      listeners: parseInt(a.listeners) || 0,
      url: a.url,
      image: a.image?.find((img) => img.size === 'large')?.['#text'] || null
    }));
    setCache(cacheKey, results, CACHE_TTL);
    return results;
  } catch {
    return [];
  }
}
