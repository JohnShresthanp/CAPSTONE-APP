import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, LogOut } from 'lucide-react';
import { useAuthContext } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className="flex flex-col gap-3 rounded-[32px] border border-white/5 bg-surface2 px-4 py-3 text-sm shadow-subtle sm:flex-row sm:items-center sm:px-6">
      <div className="flex items-center gap-4">
        <Link to="/" className="flex h-11 min-w-[140px] items-center justify-center rounded-3xl border border-white/10 bg-surface3 px-4 font-semibold uppercase tracking-[0.28em] text-text shrink-0">
          FILMMOSAIC
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-1 items-center gap-3 min-w-0">
        <label className="relative flex w-full items-center gap-3 rounded-full border border-white/10 bg-surface3 px-4 py-2.5 text-sm text-text transition focus-within:border-white/20">
          <Search className="h-4 w-4 shrink-0 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies..."
            className="w-full min-w-0 bg-transparent text-sm text-text outline-none placeholder:text-muted"
          />
        </label>
      </form>

      <div className="flex items-center gap-2 shrink-0">
        <Link
          to="/lists"
          className="rounded-full border border-white/10 bg-surface3 px-3.5 py-2 text-[11px] uppercase tracking-[0.18em] text-text transition hover:border-white/20"
        >
          Lists
        </Link>
        {user ? (
          <>
            <Link
              to="/feed"
              className="rounded-full border border-white/10 bg-surface3 px-3.5 py-2 text-[11px] uppercase tracking-[0.18em] text-text transition hover:border-white/20"
            >
              Feed
            </Link>
            {(user.role === 'moderator' || user.role === 'super_admin') && (
              <Link
                to="/admin"
                className="rounded-full border border-accentGold/30 bg-accentGold/10 px-3.5 py-2 text-[11px] uppercase tracking-[0.18em] text-accentGold transition hover:border-accentGold/40"
              >
                Admin
              </Link>
            )}
            <Link
              to={`/users/${user.username}`}
              className="rounded-full border border-white/10 bg-surface3 px-3.5 py-2 text-[11px] uppercase tracking-[0.18em] text-text transition hover:border-white/20"
            >
              Profile
            </Link>
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-surface3 px-3.5 py-2 text-[11px] uppercase tracking-[0.18em] text-muted transition hover:border-red-400/30 hover:text-red-400"
            >
              <LogOut size={12} />
              Logout
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="rounded-full border border-white/10 bg-surface3 px-3.5 py-2 text-[11px] uppercase tracking-[0.18em] text-text transition hover:border-white/20"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="rounded-full border border-accentGold/30 bg-accentGold/10 px-3.5 py-2 text-[11px] uppercase tracking-[0.18em] text-accentGold transition hover:border-accentGold/40"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

export default Navbar;
