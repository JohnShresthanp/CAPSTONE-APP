import axios from 'axios';
import { getCached, setCache } from '../../../utils/cache.js';
import * as googleBooks from './googlebooks.provider.js';

const client = axios.create({ baseURL: 'http://openlibrary.org', timeout: 10000 });

const CACHE_TTL = 600;

const COVER_BASE = 'https://covers.openlibrary.org/b/id';

function getBestCover(coverId, size = 'L') {
  return coverId ? `${COVER_BASE}/${coverId}-${size}.jpg` : null;
}

function getAuthorName(doc) {
  if (doc.author_name?.length) return doc.author_name[0];
  if (doc.author_alternative_name?.length) return doc.author_alternative_name[0];
  return null;
}

const transformBook = (doc) => ({
  id: `openlibrary:${doc.key || doc.cover_edition_key || doc.olid || ''}`,
  provider: 'openlibrary',
  externalId: (doc.key || doc.cover_edition_key || doc.olid || '').replace(/^\//, ''),
  type: 'book',
  title: doc.title || 'Untitled',
  subtitle: getAuthorName(doc),
  description: doc.first_sentence ? doc.first_sentence[0] : (doc.subtitle || null),
  poster: getBestCover(doc.cover_i || doc.cover_id),
  backdrop: null,
  releaseDate: doc.first_publish_year ? String(doc.first_publish_year) : null,
  genres: doc.subject ? doc.subject.filter(Boolean).slice(0, 5) : [],
  people: getAuthorName(doc) ? [{ name: getAuthorName(doc), role: 'Author' }] : [],
  pageCount: null,
  publisher: null,
  isbn: null,
  previewLink: null
});

export async function search(query) {
  const cacheKey = `ol:search:${query.toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const results = [];

  try {
    const response = await client.get('/search.json', {
      params: { q: query, limit: 10 }
    });
    results.push(...(response.data?.docs || []).map(transformBook));
  } catch (err) {
    console.error('OpenLibrary search error:', err.message);
  }

  try {
    const authorRes = await client.get('/search/authors.json', {
      params: { q: query, limit: 5 }
    });
    for (const author of (authorRes.data?.docs || [])) {
      results.push({
        id: `openlibrary:author:${author.key || author.name}`,
        provider: 'openlibrary',
        externalId: (author.key || '').replace(/^\//, ''),
        type: 'person',
        title: author.name || 'Unknown Author',
        subtitle: 'Author',
        description: author.bio?.value || author.bio || null,
        poster: author.photos?.[0] ? `https://covers.openlibrary.org/a/id/${author.photos[0]}-L.jpg` : null,
        backdrop: null,
        releaseDate: null,
        genres: author.top_subjects?.slice(0, 5) || [],
        people: [{ name: author.name, role: 'Author' }]
      });
    }
  } catch (err) {
    console.error('OpenLibrary author search error:', err.message);
  }

  // Enrich books with Google Books data for missing fields
  if (results.length > 0) {
    await Promise.allSettled(
      results.filter((r) => r.type === 'book').map(async (book) => {
        try {
          const enriched = await googleBooks.enrichFromTitle(book.title, book.subtitle);
          if (enriched) {
            book.description = book.description || enriched.description;
            book.poster = book.poster || enriched.poster;
            book.pageCount = enriched.pageCount;
            book.publisher = enriched.publisher;
            book.isbn = enriched.isbn;
            book.previewLink = enriched.previewLink;
            if (enriched.genres?.length) {
              book.genres = [...new Set([...book.genres, ...enriched.genres])].slice(0, 5);
            }
          }
        } catch {
          // enrichment non-fatal
        }
      })
    );
  }

  setCache(cacheKey, results, CACHE_TTL);
  return results;
}

export async function getDetails(externalId) {
  const cleaned = externalId.replace(/^\//, '').replace('/works/', '').replace('/books/', '');
  const cacheKey = `ol:detail:${cleaned}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const workPath = cleaned.startsWith('works/') || cleaned.startsWith('books/') || cleaned.startsWith('authors/')
      ? `/${cleaned}`
      : `/works/${cleaned}`;
    const response = await client.get(`${workPath}.json`);
    const book = response.data;

    let poster = null;
    if (book.covers?.length) {
      poster = getBestCover(book.covers[0]);
    }

    const description = typeof book.description === 'object'
      ? book.description.value
      : (book.description || null);

    const result = {
      id: `openlibrary:${externalId}`,
      provider: 'openlibrary',
      externalId,
      type: 'book',
      title: book.title || 'Untitled',
      subtitle: book.authors?.map((a) => a.name || a.author?.key).filter(Boolean).join(', ') || null,
      description,
      poster,
      backdrop: null,
      releaseDate: book.first_publish_date || String(book.first_publish_year || ''),
      genres: book.subjects?.filter(Boolean).slice(0, 10) || [],
      people: (book.authors || []).map((a) => ({
        name: typeof a === 'object' ? (a.name || a.author?.key || 'Unknown') : String(a),
        role: 'Author'
      })),
      pageCount: null,
      publisher: null,
      isbn: null,
      previewLink: null
    };

    // Enrich with Google Books
    try {
      const enriched = await googleBooks.enrichFromTitle(book.title, result.subtitle);
      if (enriched) {
        result.description = result.description || enriched.description;
        result.poster = result.poster || enriched.poster;
        result.pageCount = enriched.pageCount;
        result.publisher = enriched.publisher;
        result.isbn = enriched.isbn;
        result.previewLink = enriched.previewLink;
        if (enriched.genres?.length) {
          const existingGenres = new Set(result.genres);
          for (const g of enriched.genres) {
            if (!existingGenres.has(g)) {
              result.genres.push(g);
              existingGenres.add(g);
            }
          }
        }
      }
    } catch {
      // enrichment non-fatal
    }

    setCache(cacheKey, result, CACHE_TTL);
    return result;
  } catch (err) {
    console.error('OpenLibrary detail error:', err.message);
    return null;
  }
}
