import * as mb from './musicbrainz.v2.provider.js';
import * as tad from './theaudiodb.provider.js';
import * as lfm from './lastfm.provider.js';
import * as caa from './coverart.provider.js';
import { getCached, setCache } from '../../../utils/cache.js';

const CACHE_TTL = 600;
const MBID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isMbid(id) { return MBID_REGEX.test(id); }

export async function search(query) {
  const cacheKey = `music:search:${query.toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const results = [];
  const seenNames = new Set();
  const seenMbid = new Set();
  const seenAlbumIds = new Set();

  const [mbArtists, mbAlbums, tadArtists, tadAlbums, lfmArtists] = await Promise.allSettled([
    mb.searchArtists(query, 5),
    mb.searchReleaseGroups(query, 5),
    tad.searchArtists(query),
    tad.searchAlbums(query),
    lfm.searchArtist(query)
  ]);

  // Collect MusicBrainz artists
  if (mbArtists.status === 'fulfilled') {
    for (const a of mbArtists.value) {
      const nameKey = a.name.toLowerCase();
      if (seenNames.has(nameKey)) continue;
      seenNames.add(nameKey);
      seenMbid.add(a.id);

      const lfmInfo = lfmArtists.status === 'fulfilled'
        ? lfmArtists.value.find((l) => l.name.toLowerCase() === nameKey)
        : null;

      results.push({
        id: `musicbrainz:${a.id}`,
        provider: 'musicbrainz',
        externalId: a.id,
        type: 'artist',
        title: a.name,
        subtitle: a.disambiguation || a.type || null,
        description: null,
        poster: null,
        backdrop: null,
        releaseDate: a.lifeSpan?.begin || null,
        genres: [],
        people: [],
        listeners: lfmInfo?.listeners || null,
        tags: [],
        country: a.country || null
      });
    }
  }

  // Collect TheAudioDB artists (only those not already found via MB)
  if (tadArtists.status === 'fulfilled') {
    for (const a of tadArtists.value) {
      const nameKey = a.name.toLowerCase();
      if (seenNames.has(nameKey)) continue;
      seenNames.add(nameKey);

      const lfmInfo = lfmArtists.status === 'fulfilled'
        ? lfmArtists.value.find((l) => l.name.toLowerCase() === nameKey)
        : null;

      results.push({
        id: `musicbrainz:tad:${a.id}`,
        provider: 'musicbrainz',
        externalId: a.id,
        type: 'artist',
        title: a.name,
        subtitle: a.genre || a.style || null,
        description: a.biography?.slice(0, 300) || null,
        poster: a.thumb || a.image,
        backdrop: a.banner || a.fanart,
        releaseDate: a.formedYear || null,
        genres: [a.genre, a.style].filter(Boolean),
        people: [],
        listeners: lfmInfo?.listeners || null,
        tags: [],
        country: a.country || null
      });
    }
  }

  // Collect MusicBrainz release groups (albums)
  if (mbAlbums.status === 'fulfilled') {
    for (const rg of mbAlbums.value) {
      const idKey = rg.id;
      if (seenAlbumIds.has(idKey)) continue;
      seenAlbumIds.add(idKey);

      results.push({
        id: `musicbrainz:${rg.id}`,
        provider: 'musicbrainz',
        externalId: rg.id,
        type: 'album',
        title: rg.title,
        subtitle: rg.artistCredit,
        description: null,
        poster: null,
        backdrop: null,
        releaseDate: rg.firstReleaseDate || null,
        genres: [],
        people: rg.artistCredit ? [{ name: rg.artistCredit, role: 'Artist' }] : []
      });
    }
  }

  // Collect TheAudioDB albums (deduplicate by name + artist)
  if (tadAlbums.status === 'fulfilled') {
    for (const a of tadAlbums.value) {
      const nameKey = `${a.name.toLowerCase()}|${(a.artistName || '').toLowerCase()}`;
      if (seenAlbumIds.has(nameKey)) continue;
      seenAlbumIds.add(nameKey);

      results.push({
        id: `musicbrainz:tad:${a.id}`,
        provider: 'musicbrainz',
        externalId: a.id,
        type: 'album',
        title: a.name,
        subtitle: a.artistName,
        description: null,
        poster: a.thumb,
        backdrop: null,
        releaseDate: a.yearReleased || null,
        genres: [a.genre, a.style].filter(Boolean),
        people: a.artistName ? [{ name: a.artistName, role: 'Artist' }] : []
      });
    }
  }

  setCache(cacheKey, results, CACHE_TTL);
  return results;
}

export async function getArtistDetails(externalId) {
  const cacheKey = `music:artist:${externalId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  if (isMbid(externalId)) {
    const [mbArtist, mbAlbums, tadInfo, lfmInfo] = await Promise.allSettled([
      mb.getArtist(externalId),
      mb.browseArtistReleaseGroups(externalId, 20),
      tad.getArtist(externalId), // Try TAD by MBID (unlikely to work, fallback)
      null
    ]);

    const artist = mbArtist.status === 'fulfilled' ? mbArtist.value : null;
    if (!artist) return null;

    let lfmData = null;
    if (artist.name) {
      const lfmResult = await lfm.getArtistInfo(artist.name);
      if (lfmResult.listeners) lfmData = lfmResult;
    }

    // Try to find TAD artist by MB relations or name
    let tadArtist = null;
    if (tadInfo.status === 'fulfilled') tadArtist = tadInfo.value;
    if (!tadArtist && artist.name) {
      const tadSearch = await tad.searchArtists(artist.name);
      tadArtist = tadSearch[0] || null;
    }

    const releaseGroups = mbAlbums.status === 'fulfilled' ? mbAlbums.value : [];
    const albums = await enrichAlbumsWithArt(releaseGroups);

    const result = {
      id: `musicbrainz:${externalId}`,
      provider: 'musicbrainz',
      externalId,
      type: 'artist',
      title: artist.name,
      subtitle: artist.disambiguation || artist.type || null,
      description: tadArtist?.biography || lfmData?.summary || null,
      poster: tadArtist?.thumb || tadArtist?.image || null,
      backdrop: tadArtist?.banner || tadArtist?.fanart || null,
      releaseDate: artist.lifeSpan?.begin || null,
      genres: (artist.tags || []).map((t) => t.name).concat(tadArtist?.genre || []).filter(Boolean).slice(0, 10),
      people: [],
      albums,
      tags: (artist.tags || []).map((t) => ({ name: t.name, count: t.count })),
      listeners: lfmData?.listeners || null,
      playCount: lfmData?.playCount || null,
      similar: lfmData?.similar || [],
      topTracks: lfmData?.topTracks || [],
      links: artist.externalLinks || {},
      country: artist.country || tadArtist?.country || null,
      logo: tadArtist?.logo || null,
      fanart: tadArtist?.fanart || tadArtist?.fanart2 || tadArtist?.fanart3 || null
    };

    setCache(cacheKey, result, CACHE_TTL);
    return result;
  }

  // Fallback: TheAudioDB numeric ID
  const [tadArtist, tadAlbumsRaw, mbSearch] = await Promise.allSettled([
    tad.getArtist(externalId),
    tad.searchAlbums(''),
    null
  ]);

  const artist = tadArtist.status === 'fulfilled' ? tadArtist.value : null;
  if (!artist) return null;

  let lfmData = null;
  if (artist.name) {
    const lfmResult = await lfm.getArtistInfo(artist.name);
    if (lfmResult.listeners) lfmData = lfmResult;
  }

  // Try to find MB match
  let mbArtist = null;
  let releaseGroups = [];
  if (artist.name) {
    const search = await mb.searchArtists(artist.name, 1);
    if (search.length > 0) {
      mbArtist = await mb.getArtist(search[0].id);
      const rgs = await mb.browseArtistReleaseGroups(search[0].id, 20);
      releaseGroups = await enrichAlbumsWithArt(rgs);
    }
  }

  // If no MB albums, use TAD albums
  let albums = releaseGroups;
  if (albums.length === 0 && artist.name) {
    const tadAlRes = await tad.searchAlbums(artist.name);
    albums = tadAlRes.slice(0, 20).map((a) => ({
      id: `musicbrainz:tad:${a.id}`,
      provider: 'musicbrainz',
      externalId: a.id,
      type: 'album',
      title: a.name,
      subtitle: a.yearReleased || null,
      poster: a.thumb,
      releaseDate: a.yearReleased || null
    }));
  }

  const result = {
    id: `musicbrainz:tad:${externalId}`,
    provider: 'musicbrainz',
    externalId,
    type: 'artist',
    title: artist.name,
    subtitle: artist.genre || artist.style || null,
    description: artist.biography || lfmData?.summary || null,
    poster: artist.thumb || artist.image,
    backdrop: artist.banner || artist.fanart,
    releaseDate: artist.formedYear || null,
    genres: [artist.genre, artist.style].filter(Boolean),
    people: [],
    albums,
    tags: lfmData?.tags?.map((t) => ({ name: t })) || [],
    listeners: lfmData?.listeners || null,
    playCount: lfmData?.playCount || null,
    similar: lfmData?.similar || [],
    topTracks: lfmData?.topTracks || [],
    links: {},
    country: artist.country || null,
    logo: artist.logo || null,
    fanart: artist.fanart || null
  };

  setCache(cacheKey, result, CACHE_TTL);
  return result;
}

export async function getAlbumDetails(externalId) {
  const cacheKey = `music:album:${externalId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  if (isMbid(externalId)) {
    const [mbRg, mbRelease, tadAlbum] = await Promise.allSettled([
      mb.getReleaseGroup(externalId),
      null,
      null
    ]);

    const rg = mbRg.status === 'fulfilled' ? mbRg.value : null;
    if (!rg) return null;

    // Get cover art
    const art = await caa.getReleaseGroupArt(externalId);

    // Get first release for tracklist / labels
    let release = null;
    if (rg.releases?.length > 0) {
      const relRes = await mb.getRelease(rg.releases[0].id);
      release = relRes;
    }

    let lfmData = null;
    if (rg.artistCredit && rg.title) {
      const lfmResult = await lfm.getAlbumInfo(rg.artistCredit.split(',')[0].trim(), rg.title);
      if (lfmResult.listeners) lfmData = lfmResult;
    }

    const result = {
      id: `musicbrainz:${externalId}`,
      provider: 'musicbrainz',
      externalId,
      type: 'album',
      title: rg.title,
      subtitle: rg.artistCredit,
      description: lfmData?.summary || null,
      poster: art.front,
      backdrop: null,
      releaseDate: rg.firstReleaseDate || null,
      genres: rg.tags?.map((t) => t.name) || [],
      people: rg.artistCredit ? [{ name: rg.artistCredit, role: 'Artist' }] : [],
      tracks: release?.tracks || [],
      labels: release?.labels || [],
      tags: rg.tags || [],
      listeners: lfmData?.listenrs || null,
      playCount: lfmData?.playCount || null,
      similar: lfmData?.similar || [],
      releaseDatePrecision: rg.firstReleaseDate || null,
      artistCredit: rg.artistCredit,
      releaseCount: rg.releases?.length || 0,
      art: art.images?.slice(0, 5) || []
    };

    setCache(cacheKey, result, CACHE_TTL);
    return result;
  }

  // Fallback: TheAudioDB numeric ID
  const tadAlbum = await tad.getAlbum(externalId);
  if (!tadAlbum) return null;

  let lfmData = null;
  if (tadAlbum.artistName && tadAlbum.name) {
    const lfmResult = await lfm.getAlbumInfo(tadAlbum.artistName, tadAlbum.name);
    if (lfmResult.listeners) lfmData = lfmResult;
  }

  const result = {
    id: `musicbrainz:tad:${externalId}`,
    provider: 'musicbrainz',
    externalId,
    type: 'album',
    title: tadAlbum.name,
    subtitle: tadAlbum.artistName,
    description: tadAlbum.description || lfmData?.summary || null,
    poster: tadAlbum.thumb || tadAlbum.image,
    backdrop: null,
    releaseDate: tadAlbum.yearReleased || null,
    genres: [tadAlbum.genre, tadAlbum.style].filter(Boolean),
    people: tadAlbum.artistName ? [{ name: tadAlbum.artistName, role: 'Artist' }] : [],
    tracks: [],
    labels: [],
    tags: lfmData?.tags?.map((t) => ({ name: t })) || [],
    listeners: lfmData?.listeners || null,
    playCount: lfmData?.playCount || null,
    similar: lfmData?.similar || [],
    releaseDatePrecision: tadAlbum.yearReleased || null,
    artistCredit: tadAlbum.artistName,
    releaseCount: 0,
    art: []
  };

  setCache(cacheKey, result, CACHE_TTL);
  return result;
}

async function enrichAlbumsWithArt(releaseGroups) {
  const enriched = await Promise.allSettled(
    releaseGroups.slice(0, 20).map(async (rg) => {
      const art = await caa.getReleaseGroupArt(rg.id);
      return {
        id: `musicbrainz:${rg.id}`,
        provider: 'musicbrainz',
        externalId: rg.id,
        type: 'album',
        title: rg.title,
        subtitle: rg.firstReleaseDate?.slice(0, 4) || null,
        poster: art.front,
        releaseDate: rg.firstReleaseDate || null
      };
    })
  );

  return enriched
    .filter((r) => r.status === 'fulfilled')
    .map((r) => r.value);
}
