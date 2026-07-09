import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../services/api';
import { getPosterUrl } from '../services/movieApi';
import Navbar from '../components/Navbar';

function PersonDetail() {
  const { id } = useParams();
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const response = await apiClient.get(`/api/movies/person/${id}`);
        if (!cancelled) setPerson(response.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface text-text">
        <div className="mx-auto max-w-[1180px] px-4 py-5 sm:px-6 lg:px-8">
          <Navbar /><div className="mt-10 text-sm text-muted">Loading...</div>
        </div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="min-h-screen bg-surface text-text">
        <div className="mx-auto max-w-[1180px] px-4 py-5 sm:px-6 lg:px-8">
          <Navbar /><div className="mt-10 text-sm text-muted">Person not found.</div>
        </div>
      </div>
    );
  }

  const directed = person.movieCast?.filter((c) => c.role === 'DIRECTOR') || [];
  const acted = person.movieCast?.filter((c) => c.role !== 'DIRECTOR') || [];

  return (
    <div className="min-h-screen bg-surface text-text">
      <div className="mx-auto max-w-[1180px] px-4 py-5 sm:px-6 lg:px-8">
        <Navbar />
        <main className="mt-8 space-y-8">
          <div className="flex items-start gap-6">
            <div className="h-32 w-32 shrink-0 overflow-hidden rounded-full border border-white/10 bg-surface3">
              {person.profileImage ? (
                <img src={person.profileImage} alt={person.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-2xl text-muted">{person.name?.[0]}</div>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.28em] text-muted">Person</p>
              <h1 className="text-3xl font-semibold text-white">{person.name}</h1>
              {person.biography && (
                <p className="max-w-2xl text-sm leading-6 text-muted">{person.biography}</p>
              )}
            </div>
          </div>

          {directed.length > 0 && (
            <section className="space-y-4">
              <p className="text-[11px] uppercase tracking-[0.28em] text-muted">Directed ({directed.length})</p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {directed.map((entry) => (
                  <Link key={entry.id} to={`/movies/${entry.movie.id}`}
                    className="group overflow-hidden rounded-[28px] border border-white/10 bg-surface3 transition hover:border-white/20">
                    <img src={getPosterUrl(entry.movie.posterUrl)} alt={entry.movie.title}
                      className="aspect-[2/3] w-full object-cover transition duration-300 group-hover:opacity-90" />
                    <div className="p-3"><p className="text-sm font-semibold text-white truncate">{entry.movie.title}</p>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-muted">{entry.movie.releaseDate?.slice(0, 4)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {acted.length > 0 && (
            <section className="space-y-4">
              <p className="text-[11px] uppercase tracking-[0.28em] text-muted">Acted In ({acted.length})</p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {acted.map((entry) => (
                  <Link key={entry.id} to={`/movies/${entry.movie.id}`}
                    className="group overflow-hidden rounded-[28px] border border-white/10 bg-surface3 transition hover:border-white/20">
                    <img src={getPosterUrl(entry.movie.posterUrl)} alt={entry.movie.title}
                      className="aspect-[2/3] w-full object-cover transition duration-300 group-hover:opacity-90" />
                    <div className="p-3">
                      <p className="text-sm font-semibold text-white truncate">{entry.movie.title}</p>
                      {entry.characterName && <p className="text-[10px] text-muted truncate">as {entry.characterName}</p>}
                      <p className="text-[10px] uppercase tracking-[0.18em] text-muted">{entry.movie.releaseDate?.slice(0, 4)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default PersonDetail;
