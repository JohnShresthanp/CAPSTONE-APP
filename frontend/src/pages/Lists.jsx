import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchMyLists } from '../services/listApi';
import { useAuth } from '../hooks/useAuth';

function Lists() {
  const { isAuthenticated } = useAuth();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLists() {
      setLoading(true);
      try {
        const data = await fetchMyLists();
        setLists(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    if (isAuthenticated) {
      loadLists();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-[1180px] px-4 py-10 sm:px-6 lg:px-8 text-text">
        <div className="rounded-[32px] border border-white/10 bg-surface2 p-8 text-center">
          <p className="text-sm uppercase tracking-[0.28em] text-muted">Member access</p>
          <h2 className="mt-4 text-2xl font-semibold text-white">Sign in to manage your lists.</h2>
          <Link
            to="/login"
            className="mt-6 inline-flex rounded-full border border-accentGold/30 bg-accentGold/10 px-5 py-3 text-sm uppercase tracking-[0.18em] text-accentGold transition hover:border-accentGold/40"
          >
            Login to continue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-5">
        <div className="flex flex-col gap-3 rounded-[32px] border border-white/10 bg-surface2 p-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-muted">My Lists</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Your curated collections</h1>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-muted">
            Create watchlists, loved films, and organization for everything you’re exploring.
          </p>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="h-40 rounded-[28px] bg-surface3 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {lists.length > 0 ? (
              lists.map((list) => (
                <Link
                  key={list.id}
                  to={`/lists/${list.id}`}
                  className="rounded-[28px] border border-white/10 bg-surface3 p-5 transition hover:border-white/20"
                >
                  <p className="text-sm uppercase tracking-[0.28em] text-muted">{list.name}</p>
                  <p className="mt-4 text-2xl font-semibold text-white">{list.movieCount ?? list.movies?.length ?? 0} films</p>
                  <p className="mt-3 text-sm text-muted">View and manage this list.</p>
                </Link>
              ))
            ) : (
              <div className="rounded-[28px] border border-white/10 bg-surface3 p-8 text-center text-sm text-muted">
                No lists found yet. Create one from your first favorite movie.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Lists;
