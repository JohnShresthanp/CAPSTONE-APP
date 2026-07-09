import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchUserDiary } from '../services/userApi';
import { getPosterUrl } from '../services/movieApi';
import Navbar from '../components/Navbar';

function Diary() {
  const { username } = useParams();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await fetchUserDiary(username);
        if (!cancelled) setEntries(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [username]);

  const byMonth = {};
  entries.forEach((entry) => {
    const date = entry.addedAt ? new Date(entry.addedAt) : null;
    if (!date) return;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push({ ...entry, date });
  });

  const months = Object.keys(byMonth).sort((a, b) => b.localeCompare(a));

  return (
    <div className="min-h-screen bg-surface text-text">
      <div className="mx-auto max-w-[1180px] px-4 py-5 sm:px-6 lg:px-8">
        <Navbar />
        <main className="mt-8 space-y-6">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.28em] text-muted">Film Diary</p>
            <h1 className="text-2xl font-semibold text-white">{username}&rsquo;s Diary</h1>
            <p className="text-sm text-muted">{entries.length} movies logged</p>
          </div>

          {loading ? (
            <div className="text-sm text-muted">Loading diary...</div>
          ) : months.length === 0 ? (
            <div className="rounded-[32px] border border-white/10 bg-surface2 p-10 text-center">
              <p className="text-sm text-muted">No diary entries yet.</p>
            </div>
          ) : (
            months.map((month) => (
              <section key={month} className="space-y-4">
                <p className="text-xs uppercase tracking-[0.28em] text-muted">
                  {new Date(month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}
                  <span className="ml-2 text-[10px]">({byMonth[month].length})</span>
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  {byMonth[month].map((entry) => (
                    <Link key={entry.movieId || entry.id} to={`/movies/${entry.movieId || entry.movie?.id}`}
                      className="group overflow-hidden rounded-[28px] border border-white/10 bg-surface3 transition hover:border-white/20">
                      <img src={getPosterUrl(entry.movie?.posterUrl || entry.movie?.poster_path)}
                        alt={entry.movie?.title} className="aspect-[2/3] w-full object-cover transition duration-300 group-hover:opacity-90" />
                      <div className="p-3">
                        <p className="text-sm font-semibold text-white truncate">{entry.movie?.title}</p>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-muted">
                          {entry.date?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ))
          )}
        </main>
      </div>
    </div>
  );
}

export default Diary;
