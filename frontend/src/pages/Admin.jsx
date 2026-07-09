import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Film, MessageSquare, TrendingUp, Shield, AlertTriangle, Plus, Search, X } from 'lucide-react';
import { fetchAdminStats, fetchAdminUsers, fetchAdminReviews, fetchFlaggedReviews, updateUserRole, banUser, unbanUser, moderateDeleteReview, createAdminMovie, searchAdminPersons, createAdminPerson, addAdminCast, removeAdminCast, importMoviesCsv } from '../services/adminApi';
import { useAuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';

function CsvUpload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError('');
    setResult(null);
    try {
      const data = await importMoviesCsv(file);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-[28px] border border-white/10 bg-surface2 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-[0.28em] text-muted">Bulk Import from CSV</p>
        <a href="/import-template.csv" download className="text-[10px] text-accentGold hover:underline">Download template</a>
      </div>
      <form onSubmit={handleUpload} className="flex items-end gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-xs text-muted">CSV file with columns: title, overview, release_date, poster_url, genres, cast, directors, themes</label>
          <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])}
            className="w-full rounded-2xl border border-white/10 bg-surface3 px-4 py-2.5 text-sm text-text outline-none file:mr-3 file:rounded-full file:border-0 file:bg-accentGold/20 file:px-3 file:py-1 file:text-[10px] file:font-semibold file:text-accentGold focus:border-white/20" />
        </div>
        <button type="submit" disabled={!file || uploading}
          className="shrink-0 rounded-2xl bg-accentGold px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-surface transition hover:bg-yellow-400 disabled:opacity-50">
          {uploading ? 'Uploading...' : 'Import'}
        </button>
      </form>
      {error && <div className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
      {result && (
        <div className="rounded-2xl bg-green-500/10 px-4 py-3 text-sm text-green-200 space-y-1">
          <p>Imported: {result.imported}</p>
          <p>Skipped: {result.skipped}</p>
          {result.errors?.length > 0 && (
            <div>
              <p className="mt-2 text-xs text-red-300">Errors:</p>
              <ul className="list-disc pl-4 text-xs text-red-300">
                {result.errors.map((e, i) => <li key={i}>{e.row}: {e.message}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MovieForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [runtime, setRuntime] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [backdropUrl, setBackdropUrl] = useState('');
  const [language, setLanguage] = useState('ne');
  const [genres, setGenres] = useState('');
  const [themes, setThemes] = useState('');
  const [status, setStatus] = useState('Released');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [castSearch, setCastSearch] = useState('');
  const [castResults, setCastResults] = useState([]);
  const [selectedCast, setSelectedCast] = useState([]);
  const [newPersonName, setNewPersonName] = useState('');

  useEffect(() => {
    if (castSearch.length < 2) { setCastResults([]); return; }
    const timer = setTimeout(async () => {
      try { setCastResults(await searchAdminPersons(castSearch)); } catch { setCastResults([]); }
    }, 300);
    return () => clearTimeout(timer);
  }, [castSearch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setResult(null);
    try {
      const movie = await createAdminMovie({
        title,
        description: description || undefined,
        releaseDate: releaseDate || undefined,
        runtime: runtime ? parseInt(runtime) : undefined,
        posterUrl: posterUrl || undefined,
        backdropUrl: backdropUrl || undefined,
        language,
        genres: genres ? genres.split(',').map((s) => s.trim()).filter(Boolean) : [],
        themes: themes ? themes.split(',').map((s) => s.trim()).filter(Boolean) : [],
        status
      });
      setResult(movie);
      for (const cast of selectedCast) {
        try { await addAdminCast({ movieId: movie.id, personId: cast.personId, role: cast.role }); } catch {}
      }
      setTitle(''); setDescription(''); setReleaseDate(''); setRuntime(''); setPosterUrl('');
      setBackdropUrl(''); setGenres(''); setThemes(''); setSelectedCast([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create movie');
    } finally {
      setSaving(false);
    }
  };

  const addPersonToCast = async (person) => {
    if (selectedCast.find((c) => c.personId === person.id)) return;
    setSelectedCast((prev) => [...prev, { personId: person.id, name: person.name, role: 'ACTOR' }]);
    setCastSearch('');
    setCastResults([]);
  };

  const createAndAddPerson = async () => {
    if (!newPersonName.trim()) return;
    try {
      const person = await createAdminPerson({ name: newPersonName.trim() });
      addPersonToCast(person);
      setNewPersonName('');
    } catch {}
  };

  const removeCastPerson = (personId) => {
    setSelectedCast((prev) => prev.filter((c) => c.personId !== personId));
  };

  const setCastRole = (personId, role) => {
    setSelectedCast((prev) => prev.map((c) => c.personId === personId ? { ...c, role } : c));
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div className="rounded-[28px] border border-white/10 bg-surface2 p-6 space-y-5">
        <p className="text-[11px] uppercase tracking-[0.28em] text-muted">Movie Details</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-muted">Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required
              className="w-full rounded-2xl border border-white/10 bg-surface3 px-4 py-2.5 text-sm text-text outline-none focus:border-white/20" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-muted">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              className="w-full resize-none rounded-2xl border border-white/10 bg-surface3 px-4 py-2.5 text-sm text-text outline-none focus:border-white/20" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Release Date</label>
            <input type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-surface3 px-4 py-2.5 text-sm text-text outline-none focus:border-white/20" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Runtime (minutes)</label>
            <input type="number" value={runtime} onChange={(e) => setRuntime(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-surface3 px-4 py-2.5 text-sm text-text outline-none focus:border-white/20" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-muted">Poster URL (Cloudinary or any direct image URL)</label>
            <input type="url" value={posterUrl} onChange={(e) => setPosterUrl(e.target.value)} placeholder="https://res.cloudinary.com/..."
              className="w-full rounded-2xl border border-white/10 bg-surface3 px-4 py-2.5 text-sm text-text outline-none focus:border-white/20" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-muted">Backdrop URL</label>
            <input type="url" value={backdropUrl} onChange={(e) => setBackdropUrl(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-surface3 px-4 py-2.5 text-sm text-text outline-none focus:border-white/20" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Language</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-surface3 px-4 py-2.5 text-sm text-text outline-none focus:border-white/20">
              <option value="ne">Nepali</option>
              <option value="en">English</option>
              <option value="hi">Hindi</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-surface3 px-4 py-2.5 text-sm text-text outline-none focus:border-white/20">
              <option value="Released">Released</option>
              <option value="Upcoming">Upcoming</option>
              <option value="In Production">In Production</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Genres (comma-separated)</label>
            <input value={genres} onChange={(e) => setGenres(e.target.value)} placeholder="Drama, Action, Romance"
              className="w-full rounded-2xl border border-white/10 bg-surface3 px-4 py-2.5 text-sm text-text outline-none focus:border-white/20" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Themes (comma-separated)</label>
            <input value={themes} onChange={(e) => setThemes(e.target.value)} placeholder="Family, Tradition, Love"
              className="w-full rounded-2xl border border-white/10 bg-surface3 px-4 py-2.5 text-sm text-text outline-none focus:border-white/20" />
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-surface2 p-6 space-y-4">
        <p className="text-[11px] uppercase tracking-[0.28em] text-muted">Cast & Crew</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input value={castSearch} onChange={(e) => setCastSearch(e.target.value)} placeholder="Search existing persons..."
              className="w-full rounded-2xl border border-white/10 bg-surface3 pl-9 pr-4 py-2.5 text-sm text-text outline-none focus:border-white/20" />
            {castResults.length > 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-xl border border-white/10 bg-surface3 py-1 shadow-xl">
                {castResults.map((p) => (
                  <button key={p.id} type="button" onClick={() => addPersonToCast(p)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text hover:bg-white/5 text-left">
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <input value={newPersonName} onChange={(e) => setNewPersonName(e.target.value)} placeholder="New person name"
              className="rounded-2xl border border-white/10 bg-surface3 px-4 py-2.5 text-sm text-text outline-none focus:border-white/20 w-40" />
            <button type="button" onClick={createAndAddPerson}
              className="flex items-center gap-1 rounded-2xl border border-white/10 px-3 py-2.5 text-xs text-muted hover:border-white/20">
              <Plus size={14} /> Add
            </button>
          </div>
        </div>
        {selectedCast.length > 0 && (
          <div className="space-y-2">
            {selectedCast.map((c) => (
              <div key={c.personId} className="flex items-center justify-between rounded-xl border border-white/10 bg-surface3 px-3 py-2">
                <span className="text-sm text-text">{c.name}</span>
                <div className="flex items-center gap-2">
                  <select value={c.role} onChange={(e) => setCastRole(c.personId, e.target.value)}
                    className="rounded-full border border-white/10 bg-surface2 px-2 py-1 text-[10px] text-text outline-none">
                    <option value="ACTOR">Actor</option>
                    <option value="DIRECTOR">Director</option>
                    <option value="WRITER">Writer</option>
                  </select>
                  <button type="button" onClick={() => removeCastPerson(c.personId)} className="text-muted hover:text-red-400">
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <div className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
      {result && <div className="rounded-2xl bg-green-500/10 px-4 py-3 text-sm text-green-200">Movie created: {result.title}</div>}

      <button type="submit" disabled={saving || !title.trim()}
        className="w-full rounded-2xl bg-accentGold px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-surface transition hover:bg-yellow-400 disabled:opacity-50">
        {saving ? 'Creating...' : 'Create Movie'}
      </button>
    </form>
  );
}

function Admin() {
  const { user } = useAuthContext();
  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [flagged, setFlagged] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || (user.role !== 'super_admin' && user.role !== 'moderator')) return;
    setLoading(true);
    Promise.all([
      fetchAdminStats().catch(() => null),
      fetchAdminUsers({ limit: 50 }).catch(() => []),
      fetchAdminReviews({ limit: 20 }).catch(() => []),
      fetchFlaggedReviews().catch(() => [])
    ]).then(([s, u, r, f]) => {
      setStats(s);
      setUsers(Array.isArray(u) ? u : (u?.data || []));
      setReviews(Array.isArray(r) ? r : (r?.data || []));
      setFlagged(Array.isArray(f) ? f : (f?.data || []));
    }).finally(() => setLoading(false));
  }, [user]);

  if (!user || (user.role !== 'super_admin' && user.role !== 'moderator')) {
    return (
      <div className="min-h-screen bg-surface text-text">
        <div className="mx-auto max-w-[1180px] px-4 py-5 sm:px-6 lg:px-8">
          <Navbar />
          <main className="mt-10 text-center text-sm text-muted">You don&apos;t have access to this page.</main>
        </div>
      </div>
    );
  }

  const isSuper = user.role === 'super_admin';

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'movies', label: 'Movies', icon: Film },
    { id: 'reviews', label: 'Reviews', icon: MessageSquare },
    { id: 'flagged', label: `Flagged (${flagged.length})`, icon: AlertTriangle }
  ];

  const handleRoleChange = async (userId, role) => {
    try { await updateUserRole(userId, role); setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role } : u)); } catch (e) { console.error(e); }
  };

  const handleBan = async (userId) => {
    if (!window.confirm('Ban this user?')) return;
    try { await banUser(userId); setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, isBanned: true } : u)); } catch (e) { console.error(e); }
  };

  const handleUnban = async (userId) => {
    try { await unbanUser(userId); setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, isBanned: false } : u)); } catch (e) { console.error(e); }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return;
    try { await moderateDeleteReview(reviewId); setReviews((prev) => prev.filter((r) => r.id !== reviewId)); } catch (e) { console.error(e); }
  };

  return (
    <div className="min-h-screen bg-surface text-text">
      <div className="mx-auto max-w-[1480px] px-4 py-5 sm:px-6 lg:px-8">
        <Navbar />
        <main className="mt-8">
          <div className="mb-6 flex items-center gap-2">
            <Shield size={18} className="text-accentGold" />
            <h1 className="text-2xl font-semibold text-white">Admin Panel</h1>
          </div>

          <div className="mb-6 flex gap-2 overflow-x-auto">
            {tabs.map((t) => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.18em] transition ${
                    tab === t.id ? 'bg-accentGold/10 text-accentGold border border-accentGold/30' : 'border border-white/10 text-muted hover:border-white/20'
                  }`}>
                  <Icon size={14} /> {t.label}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="text-sm text-muted">Loading...</div>
          ) : tab === 'dashboard' && stats ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-[28px] border border-white/10 bg-surface2 p-6">
                <p className="text-[11px] uppercase tracking-[0.28em] text-muted">Total Users</p>
                <p className="mt-2 text-3xl font-semibold text-white">{stats.totalUsers}</p>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-surface2 p-6">
                <p className="text-[11px] uppercase tracking-[0.28em] text-muted">Total Movies</p>
                <p className="mt-2 text-3xl font-semibold text-white">{stats.totalMovies}</p>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-surface2 p-6">
                <p className="text-[11px] uppercase tracking-[0.28em] text-muted">Total Reviews</p>
                <p className="mt-2 text-3xl font-semibold text-white">{stats.totalReviews}</p>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-surface2 p-6">
                <p className="text-[11px] uppercase tracking-[0.28em] text-muted">New This Week</p>
                <p className="mt-2 text-3xl font-semibold text-white">{stats.newThisWeek ?? 0}</p>
              </div>
            </div>
          ) : tab === 'users' ? (
            <div className="space-y-3">
              {users.length === 0 ? <p className="text-sm text-muted">No users found.</p> : users.map((u) => (
                <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-white/10 bg-surface3 p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-surface2 overflow-hidden">
                      {u.avatar_url ? <img src={u.avatar_url} className="h-full w-full object-cover" />
                        : <div className="flex h-full items-center justify-center text-xs text-muted">{u.username?.[0]}</div>}
                    </div>
                    <div>
                      <Link to={`/users/${u.username}`} className="text-sm font-semibold text-white hover:underline">{u.username}</Link>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-muted">{u.role}{u.isBanned ? ' (BANNED)' : ''}</p>
                    </div>
                  </div>
                  {isSuper && (
                    <div className="flex gap-2">
                      <select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="rounded-full border border-white/10 bg-surface2 px-3 py-1 text-xs text-text outline-none">
                        <option value="user">User</option>
                        <option value="moderator">Moderator</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                      {u.isBanned ? (
                        <button onClick={() => handleUnban(u.id)} className="rounded-full border border-accentGreen/30 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-accentGreen">Unban</button>
                      ) : (
                        <button onClick={() => handleBan(u.id)} className="rounded-full border border-red-400/30 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-red-400">Ban</button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : tab === 'movies' ? (
            <div className="space-y-8">
              <CsvUpload />
              <MovieForm />
            </div>
          ) : tab === 'reviews' ? (
            <div className="space-y-3">
              {reviews.length === 0 ? <p className="text-sm text-muted">No reviews found.</p> : reviews.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-white/10 bg-surface3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">{r.user?.username || 'Unknown'} on {r.movie?.title || 'Unknown'}</p>
                    <p className="text-xs text-muted truncate">{r.body?.slice(0, 100)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/reviews/${r.id}`} className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-muted hover:border-white/20">View</Link>
                    <button onClick={() => handleDeleteReview(r.id)} className="rounded-full border border-red-400/30 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-red-400">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ) : tab === 'flagged' ? (
            <div className="space-y-3">
              {flagged.length === 0 ? <p className="text-sm text-muted">No flagged reviews.</p> : flagged.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-red-400/20 bg-surface3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">{r.user?.username || 'Unknown'} on {r.movie?.title || 'Unknown'}</p>
                    <p className="text-xs text-muted truncate">{r.body?.slice(0, 100)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/reviews/${r.id}`} className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-muted hover:border-white/20">View</Link>
                    <button onClick={() => handleDeleteReview(r.id)} className="rounded-full border border-red-400/30 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-red-400">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}

export default Admin;
