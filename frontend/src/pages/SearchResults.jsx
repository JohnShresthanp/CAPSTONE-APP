import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchMovies, getPosterUrl } from '../services/movieApi';
import Navbar from '../components/Navbar';

function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!query) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await searchMovies(query);
        if (!cancelled) {
          const list = data.movies || [];
          setMovies(list);
          setTotal(data.total || list.length);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [query]);

  return (
    <div className="min-h-screen bg-surface text-text">
      <div className="mx-auto max-w-[1480px] px-4 py-5 sm:px-6 lg:px-8">
        <Navbar />

        <main className="pt-8">
          <div className="mb-6 space-y-2">
            <p className="text-[11px] uppercase tracking-[0.28em] text-muted">Search</p>
            <h1 className="text-2xl font-semibold text-white">
              {query ? (
                <>Results for &ldquo;{query}&rdquo; <span className="text-sm font-normal text-muted">({total})</span></>
              ) : (
                'Enter a search term'
              )}
            </h1>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] animate-pulse rounded-[28px] bg-surface3" />
              ))}
            </div>
          ) : movies.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {movies.map((movie) => (
                <Link
                  key={movie.id}
                  to={`/movies/${movie.id}`}
                  className="group overflow-hidden rounded-[28px] border border-white/10 bg-surface3 transition hover:border-white/20"
                >
                  <img
                    src={getPosterUrl(movie.posterUrl || movie.poster_path)}
                    alt={movie.title}
                    className="aspect-[2/3] w-full object-cover transition duration-300 group-hover:opacity-90"
                  />
                  <div className="p-3 space-y-1">
                    <p className="text-sm font-semibold text-white truncate">{movie.title}</p>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-muted">{movie.releaseDate?.slice(0, 4) || movie.release_date?.slice(0, 4) || ''}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : query && !loading ? (
            <div className="rounded-[32px] border border-white/10 bg-surface2 p-10 text-center">
              <p className="text-sm text-muted">No results found for &ldquo;{query}&rdquo;.</p>
              <p className="mt-2 text-xs text-muted">Try a different search term.</p>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}

export default SearchResults;
