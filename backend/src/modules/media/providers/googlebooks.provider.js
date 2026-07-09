import axios from 'axios';
import { getCached, setCache } from '../../../utils/cache.js';

const API_KEY = process.env.GOOGLE_BOOKS_API_KEY || '';

const client = axios.create({
  baseURL: 'https://www.googleapis.com/books/v1',
  timeout: 8000,
  params: API_KEY ? { key: API_KEY } : {}
});

const CACHE_TTL = 600;

export async function search(query) {
  const cacheKey = `gb:search:${query.toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const res = await client.get('/volumes', {
      params: { q: query, maxResults: 10 }
    });
    const items = res.data?.items || [];
    const results = items.map(transformBook);
    setCache(cacheKey, results, CACHE_TTL);
    return results;
  } catch {
    return [];
  }
}

export async function getDetails(volumeId) {
  const cacheKey = `gb:detail:${volumeId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const res = await client.get(`/volumes/${volumeId}`);
    const book = res.data;
    if (!book) return null;
    const result = transformBook(book);
    setCache(cacheKey, result, CACHE_TTL);
    return result;
  } catch {
    return null;
  }
}

export async function enrichFromIsbn(isbn) {
  const cacheKey = `gb:isbn:${isbn}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const res = await client.get('/volumes', {
      params: { q: `isbn:${isbn}`, maxResults: 1 }
    });
    const item = res.data?.items?.[0];
    if (!item) return null;
    const result = transformBook(item);
    setCache(cacheKey, result, CACHE_TTL);
    return result;
  } catch {
    return null;
  }
}

export async function enrichFromTitle(title, author) {
  const cacheKey = `gb:title:${title.toLowerCase()}:${(author || '').toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const q = author ? `intitle:${title}+inauthor:${author}` : `intitle:${title}`;
    const res = await client.get('/volumes', {
      params: { q, maxResults: 1 }
    });
    const item = res.data?.items?.[0];
    if (!item) return null;
    const result = transformBook(item);
    setCache(cacheKey, result, CACHE_TTL);
    return result;
  } catch {
    return null;
  }
}

function transformBook(item) {
  const vol = item.volumeInfo || {};
  const isbn = vol.industryIdentifiers?.find((i) => i.type === 'ISBN_13' || i.type === 'ISBN_10');
  return {
    id: `googlebooks:${item.id}`,
    provider: 'googlebooks',
    externalId: item.id,
    type: 'book',
    title: vol.title || 'Untitled',
    subtitle: (vol.authors || []).join(', ') || null,
    description: vol.description || null,
    poster: vol.imageLinks?.thumbnail?.replace('http:', 'https:')?.replace('&edge=curl', '') || null,
    backdrop: null,
    releaseDate: vol.publishedDate || null,
    genres: vol.categories || [],
    people: (vol.authors || []).map((a) => ({ name: a, role: 'Author' })),
    pageCount: vol.pageCount || null,
    publisher: vol.publisher || null,
    isbn: isbn?.identifier || null,
    previewLink: vol.previewLink || null,
    infoLink: vol.infoLink || null,
    language: vol.language || null
  };
}
