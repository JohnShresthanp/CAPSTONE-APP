import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchListById } from '../services/listApi';
import { getPosterUrl } from '../services/movieApi';

function ListDetail() {
  const { id } = useParams();
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await fetchListById(id);
        setList(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return <div className="mx-auto max-w-[1180px] px-4 py-10 text-sm text-muted">Loading list...</div>;
  }

  if (!list) {
    return <div className="mx-auto max-w-[1180px] px-4 py-10 text-sm text-muted">List not found.</div>;
  }

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-5">
        <div className="rounded-[32px] border border-white/10 bg-surface2 p-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-muted">{list.isSystem ? 'System List' : 'Custom List'}</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">{list.name}</h1>
            {list.description && <p className="mt-2 text-sm text-muted">{list.description}</p>}
            <p className="mt-4 text-sm text-muted">{list._count?.movies ?? list.movies?.length ?? 0} films</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {(list.movies || []).map((entry) => {
            const movie = entry.movie || entry;
            return (
              <Link
                key={movie.id}
                to={`/movies/${movie.id}`}
                className="group overflow-hidden rounded-[28px] border border-white/10 bg-surface3 transition hover:border-white/20"
              >
                <img
                  src={getPosterUrl(movie.posterUrl || movie.poster_path)}
                  alt={movie.title}
                  className="h-[285px] w-full object-cover transition duration-300 group-hover:opacity-90"
                />
                <div className="p-3">
                  <p className="text-sm font-semibold text-white truncate">{movie.title}</p>
                </div>
              </Link>
            );
          })}
        </div>

        {(!list.movies || list.movies.length === 0) && (
          <div className="rounded-[28px] border border-white/10 bg-surface3 p-8 text-center text-sm text-muted">
            This list is empty.
          </div>
        )}
      </div>

      <div className="mt-6">
        <Link to="/lists" className="rounded-full border border-white/10 bg-surface2 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-muted transition hover:border-white/20">
          All Lists
        </Link>
      </div>
    </div>
  );
}

export default ListDetail;
