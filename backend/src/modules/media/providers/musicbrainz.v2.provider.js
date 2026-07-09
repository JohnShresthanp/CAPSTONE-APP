import axios from 'axios';
import { getCached, setCache } from '../../../utils/cache.js';

const USER_AGENT = 'FilmMosaic/1.0 ( music@filmmosaic.app )';

const client = axios.create({
  baseURL: 'https://musicbrainz.org/ws/2',
  timeout: 12000,
  headers: {
    'User-Agent': USER_AGENT,
    'Accept': 'application/json'
  },
  params: { fmt: 'json' }
});

const httpClient = axios.create({
  baseURL: 'http://musicbrainz.org/ws/2',
  timeout: 12000,
  headers: {
    'User-Agent': USER_AGENT,
    'Accept': 'application/json'
  },
  params: { fmt: 'json' }
});

const CACHE_TTL = 600;

let lastRequestTime = 0;

async function rateLimitedRequest(clientInstance, url, config = {}) {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < 1100) {
    await new Promise((r) => setTimeout(r, 1100 - elapsed));
  }
  lastRequestTime = Date.now();
  return clientInstance.get(url, config);
}

async function mbRequest(url, config = {}) {
  try {
    return await rateLimitedRequest(client, url, config);
  } catch (err) {
    if (err.code === 'ERR_TLS_CERT_ALTNAME_INVALID' || err.code === 'ECONNRESET' || err.code === 'ERR_TLS_HANDSHAKE_FAILURE' || err.message?.includes('tls') || err.message?.includes('SSL')) {
      try {
        return await rateLimitedRequest(httpClient, url, config);
      } catch {
        throw err;
      }
    }
    throw err;
  }
}

export async function searchArtists(query, limit = 5) {
  const cacheKey = `mbv2:artist:search:${query.toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const res = await mbRequest('/artist', { params: { query, limit } });
    const artists = res.data?.artists || [];
    const results = artists.map((a) => ({
      id: a.id,
      name: a.name,
      sortName: a['sort-name'],
      type: a.type || null,
      gender: a.gender || null,
      country: a.country || null,
      disambiguation: a.disambiguation || null,
      lifeSpan: a['life-span'] || {}
    }));
    setCache(cacheKey, results, CACHE_TTL);
    return results;
  } catch {
    return [];
  }
}

export async function searchReleaseGroups(query, limit = 5) {
  const cacheKey = `mbv2:rg:search:${query.toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const res = await mbRequest('/release-group', { params: { query, limit } });
    const groups = res.data?.['release-groups'] || [];
    const results = groups.map((rg) => ({
      id: rg.id,
      title: rg.title,
      primaryType: rg['primary-type'] || null,
      secondaryTypes: rg['secondary-types'] || [],
      firstReleaseDate: rg['first-release-date'] || null,
      artistCredit: rg['artist-credit']?.map((ac) =>
        typeof ac === 'object' ? ac.name || ac.artist?.name : ac
      ).filter(Boolean).join(', ') || ''
    }));
    setCache(cacheKey, results, CACHE_TTL);
    return results;
  } catch {
    return [];
  }
}

export async function searchRecordings(query, limit = 5) {
  const cacheKey = `mbv2:rec:search:${query.toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const res = await mbRequest('/recording', { params: { query, limit } });
    const recordings = res.data?.recordings || [];
    const results = recordings.map((r) => ({
      id: r.id,
      title: r.title,
      length: r.length || null,
      artistCredit: r['artist-credit']?.map((ac) =>
        typeof ac === 'object' ? ac.name || ac.artist?.name : ac
      ).filter(Boolean).join(', ') || ''
    }));
    setCache(cacheKey, results, CACHE_TTL);
    return results;
  } catch {
    return [];
  }
}

export async function getArtist(mbid, include = 'url-rels+tags+ratings') {
  const cacheKey = `mbv2:artist:${mbid}:${include}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const res = await mbRequest(`/artist/${mbid}`, {
      params: { inc: include }
    });
    const a = res.data;
    if (!a) return null;

    const result = {
      id: a.id,
      name: a.name,
      sortName: a['sort-name'],
      type: a.type || null,
      gender: a.gender || null,
      country: a.country || null,
      disambiguation: a.disambiguation || null,
      lifeSpan: a['life-span'] || {},
      tags: (a.tags || []).map((t) => ({ name: t.name, count: t.count })),
      rating: a.rating?.value || null,
      ratingCount: a.rating?.['votes-count'] || 0,
      relations: (a.relations || []).map((r) => ({
        type: r.type,
        url: r.url?.resource || null,
        targetType: r['target-type'] || null
      })),
      externalLinks: extractExternalLinks(a.relations || [])
    };
    setCache(cacheKey, result, CACHE_TTL);
    return result;
  } catch {
    return null;
  }
}

export async function getReleaseGroup(mbid) {
  const cacheKey = `mbv2:rg:${mbid}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const res = await mbRequest(`/release-group/${mbid}`, {
      params: { inc: 'artists+releases+tags+ratings+url-rels' }
    });
    const rg = res.data;
    if (!rg) return null;

    const result = {
      id: rg.id,
      title: rg.title,
      primaryType: rg['primary-type'] || null,
      secondaryTypes: rg['secondary-types'] || [],
      firstReleaseDate: rg['first-release-date'] || null,
      artistCredit: (rg['artist-credit'] || []).map((ac) =>
        typeof ac === 'object' ? (ac.artist?.name || ac.name) : ac
      ).filter(Boolean).join(', '),
      tags: (rg.tags || []).map((t) => ({ name: t.name, count: t.count })),
      rating: rg.rating?.value || null,
      releases: (rg.releases || []).map((r) => ({
        id: r.id,
        title: r.title,
        status: r.status || null,
        date: r.date || null,
        country: r.country || null,
        barcode: r.barcode || null
      })),
      relations: (rg.relations || []).map((r) => ({
        type: r.type,
        url: r.url?.resource || null
      }))
    };
    setCache(cacheKey, result, CACHE_TTL);
    return result;
  } catch {
    return null;
  }
}

export async function getRelease(mbid) {
  const cacheKey = `mbv2:release:${mbid}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const res = await mbRequest(`/release/${mbid}`, {
      params: { inc: 'artists+labels+recordings+tags+url-rels' }
    });
    const rel = res.data;
    if (!rel) return null;

    const result = {
      id: rel.id,
      title: rel.title,
      status: rel.status || null,
      date: rel.date || null,
      country: rel.country || null,
      barcode: rel.barcode || null,
      artistCredit: (rel['artist-credit'] || []).map((ac) =>
        typeof ac === 'object' ? (ac.artist?.name || ac.name) : ac
      ).filter(Boolean).join(', '),
      labels: (rel['label-info'] || []).map((li) => ({
        name: li.label?.name || null,
        catalogNumber: li['catalog-number'] || null
      })).filter((l) => l.name),
      tracks: (rel.media?.[0]?.tracks || []).map((t) => ({
        id: t.id,
        title: t.title,
        position: t.position,
        length: t.length || null
      })),
      tags: (rel.tags || []).map((t) => ({ name: t.name, count: t.count })),
      relations: (rel.relations || []).map((r) => ({
        type: r.type,
        url: r.url?.resource || null
      }))
    };
    setCache(cacheKey, result, CACHE_TTL);
    return result;
  } catch {
    return null;
  }
}

export async function browseArtistReleaseGroups(artistMbid, limit = 20) {
  const cacheKey = `mbv2:artist:${artistMbid}:rgs:${limit}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const res = await mbRequest('/release-group', {
      params: { artist: artistMbid, limit, offset: 0 }
    });
    const groups = res.data?.['release-groups'] || [];
    const results = groups.map((rg) => ({
      id: rg.id,
      title: rg.title,
      primaryType: rg['primary-type'] || null,
      secondaryTypes: rg['secondary-types'] || [],
      firstReleaseDate: rg['first-release-date'] || null,
      artistCredit: rg['artist-credit']?.map((ac) =>
        typeof ac === 'object' ? ac.name || ac.artist?.name : ac
      ).filter(Boolean).join(', ') || ''
    }));
    setCache(cacheKey, results, CACHE_TTL);
    return results;
  } catch {
    return [];
  }
}

function extractExternalLinks(relations) {
  const links = {};
  for (const r of relations) {
    if (r.url?.resource) {
      const url = r.url.resource;
      if (url.includes('theaudiodb.com')) links.theaudiodb = url;
      else if (url.includes('last.fm')) links.lastfm = url;
      else if (url.includes('wikipedia.org')) links.wikipedia = url;
      else if (url.includes('discogs.com')) links.discogs = url;
      else if (url.includes('imdb.com')) links.imdb = url;
      else if (url.includes('instagram.com')) links.instagram = url;
      else if (url.includes('twitter.com') || url.includes('x.com')) links.twitter = url;
      else if (url.includes('facebook.com')) links.facebook = url;
      else if (url.includes('youtube.com') || url.includes('youtu.be')) links.youtube = url;
      else if (url.includes('official')) links.official = url;
    }
  }
  return links;
}
