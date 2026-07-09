import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, Check, Plus, Eye, List as ListIcon, Edit3, ExternalLink, Film } from 'lucide-react';
import { fetchMovieDetails, getPosterUrl, fetchSimilarMovies } from '../services/movieApi';
import { fetchMovieReviews, createReview, updateReview } from '../services/reviewApi';
import { fetchMyLists, addMovieToList, removeMovieFromList } from '../services/listApi';
import { useAuthContext } from '../context/AuthContext';
import StarRating from '../components/StarRating';

const castRoleLabel = {
  DIRECTOR: 'Director',
  ACTOR: 'Actor',
  WRITER: 'Writer'
};

function SystemListButton({ isActive, loading: btnLoading, onToggle, label, activeLabel, activeIcon: ActiveIcon, inactiveIcon: InactiveIcon }) {
  const Icon = isActive ? ActiveIcon : InactiveIcon;
  return (
    <button
      onClick={onToggle}
      disabled={btnLoading}
      className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.18em] transition disabled:opacity-50 ${
        isActive
          ? 'bg-accentGold/10 text-accentGold border border-accentGold/30'
          : 'border border-white/10 text-muted hover:border-white/20 hover:text-text'
      }`}
    >
      <Icon size={14} />
      {btnLoading ? '...' : (isActive ? activeLabel : label)}
    </button>
  );
}

function MovieDetail() {
  const { id } = useParams();
  const { user } = useAuthContext();
  const [movie, setMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [systemLists, setSystemLists] = useState({});
  const [listLoading, setListLoading] = useState({});
  const [ratingSaving, setRatingSaving] = useState(false);
  const [ratingError, setRatingError] = useState('');
  const [listError, setListError] = useState('');
  const [reviewBody, setReviewBody] = useState('');
  const [containsSpoiler, setContainsSpoiler] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const loadReviews = useCallback(async () => {
    try {
      const data = await fetchMovieReviews(id);
      setReviews(data);
    } catch {
      setReviews([]);
    }
  }, [id]);

  useEffect(() => {
    async function loadMovie() {
      setLoading(true);
      try {
        const [movieData] = await Promise.all([
          fetchMovieDetails(id),
          loadReviews()
        ]);
        setMovie(movieData);
        fetchSimilarMovies(id).then(setSimilar).catch(() => {});
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadMovie();
    }
  }, [id, loadReviews]);

  useEffect(() => {
    if (!user) { setSystemLists({}); return; }
    let cancelled = false;

    async function loadLists() {
      try {
        const lists = await fetchMyLists();
        if (cancelled) return;
        const map = {};
        lists.forEach((list) => {
          if (list.isSystem && list.systemType) {
            map[list.systemType] = {
              id: list.id,
              hasMovie: list.movies?.some((lm) => lm.movieId === id || lm.movie?.id === id)
            };
          }
        });
        if (!cancelled) setSystemLists(map);
      } catch (err) {
        console.error(err);
      }
    }

    loadLists();
    return () => { cancelled = true; };
  }, [user, id]);

  const userReview = reviews.find((r) => user && r.user?.id === user.id);

  useEffect(() => {
    if (userReview) {
      setReviewBody(userReview.body || '');
      setContainsSpoiler(userReview.containsSpoiler || false);
    } else {
      setReviewBody('');
      setContainsSpoiler(false);
    }
  }, [userReview]);

  const addToWatchedList = useCallback(async () => {
    if (systemLists.watched?.hasMovie || !systemLists.watched?.id) return;
    try {
      await addMovieToList(systemLists.watched.id, id);
      setSystemLists((prev) => ({
        ...prev,
        watched: { ...prev.watched, hasMovie: true }
      }));
    } catch (err) {
      console.error(err);
    }
  }, [systemLists.watched, id]);

  const handleRatingChange = async (rating) => {
    if (!user || !rating || ratingSaving) return;
    setRatingSaving(true);
    setRatingError('');
    try {
      const payload = { movieId: id, rating, body: userReview?.body || undefined };
      let saved;
      if (userReview) {
        saved = await updateReview(userReview.id, payload);
      } else {
        saved = await createReview(payload);
      }
      setReviews((prev) => {
        const idx = prev.findIndex((r) => user && r.user?.id === user.id);
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = { ...next[idx], ...saved, user: saved.user || next[idx].user, movie: saved.movie || next[idx].movie };
          return next;
        }
        return [...prev, saved];
      });
      await addToWatchedList();
      await loadReviews();
    } catch (err) {
      setRatingError(err.response?.data?.message || err.message || 'Failed to save rating.');
    } finally {
      setRatingSaving(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!userReview) return;
    setReviewSubmitting(true);
    setReviewError('');
    try {
      await updateReview(userReview.id, { movieId: id, body: reviewBody.trim() || undefined, containsSpoiler });
      await loadReviews();
    } catch (err) {
      setReviewError(err.response?.data?.message || err.message || 'Failed to save review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const toggleSystemList = async (systemType, listId) => {
    if (listLoading[systemType]) return;
    if (!listId) {
      setListError('Could not find your system lists. Try refreshing the page.');
      return;
    }
    setListLoading((prev) => ({ ...prev, [systemType]: true }));
    setListError('');
    try {
      const has = systemLists[systemType]?.hasMovie;
      if (has) {
        await removeMovieFromList(listId, id);
      } else {
        await addMovieToList(listId, id);
      }
      setSystemLists((prev) => ({
        ...prev,
        [systemType]: { ...prev[systemType], hasMovie: !has }
      }));
    } catch (err) {
      setListError(err.response?.data?.message || err.message || 'Failed to update list.');
    } finally {
      setListLoading((prev) => ({ ...prev, [systemType]: false }));
    }
  };

  const watched = systemLists.watched;
  const watchlist = systemLists.watchlist;
  const liked = systemLists.liked;
  const directors = movie?.cast?.filter((c) => c.role === 'DIRECTOR') || [];
  const actors = movie?.cast?.filter((c) => c.role !== 'DIRECTOR') || [];

  if (loading) {
    return <div className="mx-auto max-w-[1180px] px-4 py-10 text-sm text-muted">Loading movie details...</div>;
  }

  if (!movie) {
    return <div className="mx-auto max-w-[1180px] px-4 py-10 text-sm text-muted">Unable to load movie data.</div>;
  }

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-10 sm:px-6 lg:px-8">
      {movie.backdropUrl && (
        <div className="relative -mx-4 -mt-10 mb-8 h-[200px] overflow-hidden sm:-mx-6 sm:h-[300px] lg:-mx-8 lg:h-[400px]">
          <img src={getPosterUrl(movie.backdropUrl)} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/60 to-transparent" />
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-surface3">
          <img src={getPosterUrl(movie.posterUrl)} alt={movie.title} className="w-full object-cover" />
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.28em] text-muted">{movie.status || 'FILM DETAILS'}</p>
            <h1 className="text-3xl font-semibold text-white">{movie.title}</h1>
            <div className="flex flex-wrap gap-3 text-sm text-muted">
              <span>{movie.releaseDate?.slice(0, 4)}</span>
              <span>{movie.runtime ? `${movie.runtime} min` : 'Runtime unknown'}</span>
              {movie.genres?.length ? <span>{movie.genres.join(', ')}</span> : null}
            </div>
          </div>

          {user && (
            <div className="flex flex-wrap gap-2">
              {listError && <p className="w-full text-[10px] text-red-400">{listError}</p>}
              <SystemListButton
                isActive={watched?.hasMovie}
                loading={listLoading.watched}
                onToggle={() => toggleSystemList('watched', watched?.id)}
                label="Watched"
                activeLabel="Watched"
                activeIcon={Check}
                inactiveIcon={Eye}
              />
              <SystemListButton
                isActive={watchlist?.hasMovie}
                loading={listLoading.watchlist}
                onToggle={() => toggleSystemList('watchlist', watchlist?.id)}
                label="Add to Watchlist"
                activeLabel="In Watchlist"
                activeIcon={ListIcon}
                inactiveIcon={Plus}
              />
              <SystemListButton
                isActive={liked?.hasMovie}
                loading={listLoading.liked}
                onToggle={() => toggleSystemList('liked', liked?.id)}
                label="Like"
                activeLabel="Liked"
                activeIcon={Heart}
                inactiveIcon={Heart}
              />
            </div>
          )}

          <div className="rounded-[28px] border border-white/10 bg-surface2 p-6">
            <p className="text-sm leading-7 text-muted">{movie.description || movie.overview || 'No summary available.'}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[28px] border border-white/10 bg-surface2 p-6">
              <p className="text-xs uppercase tracking-[0.28em] text-muted">Rating</p>
              <p className="mt-3 text-3xl font-semibold text-white">{movie.tmdbRating ?? movie.voteAverage ?? '—'}</p>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-surface2 p-6">
              <p className="text-xs uppercase tracking-[0.28em] text-muted">Votes</p>
              <p className="mt-3 text-3xl font-semibold text-white">{movie.tmdbVoteCount ?? movie.vote_count ?? 0}</p>
            </div>
            {user ? (
              <div className="rounded-[28px] border border-white/10 bg-surface2 p-6">
                <p className="text-xs uppercase tracking-[0.28em] text-muted">
                  Your Rating
                  {ratingSaving && <span className="ml-2 inline-block animate-pulse text-[10px]">saving...</span>}
                </p>
                <div className="mt-3">
                  <StarRating
                    value={userReview?.rating || 0}
                    onChange={handleRatingChange}
                    size={22}
                  />
                  {ratingError && <p className="mt-2 text-[10px] text-red-400">{ratingError}</p>}
                </div>
              </div>
            ) : movie.imdbId ? (
              <div className="rounded-[28px] border border-white/10 bg-surface2 p-6">
                <p className="text-xs uppercase tracking-[0.28em] text-muted">IMDb</p>
                <a
                  href={`https://www.imdb.com/title/${movie.imdbId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 text-sm text-accentGold transition hover:underline"
                >
                  View on IMDb <ExternalLink size={14} />
                </a>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {user && (
        <section className="mt-10 space-y-4">
          <p className="text-[11px] uppercase tracking-[0.28em] text-muted">
            <Edit3 size={12} className="mr-1 inline" />
            Your Review
          </p>
          <div className="rounded-[28px] border border-white/10 bg-surface2 p-6">
            {userReview ? (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <textarea
                  value={reviewBody}
                  onChange={(e) => setReviewBody(e.target.value)}
                  placeholder="What did you think of this movie?"
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-white/10 bg-surface3 px-4 py-3 text-sm text-text outline-none placeholder:text-muted focus:border-white/20"
                />
                <label className="flex items-center gap-2 text-xs text-muted cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={containsSpoiler}
                    onChange={(e) => setContainsSpoiler(e.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-surface3 accent-accentGold"
                  />
                  Contains spoilers
                </label>
                {reviewError && <p className="text-xs text-red-400">{reviewError}</p>}
                {reviewBody !== (userReview?.body || '') || containsSpoiler !== (userReview?.containsSpoiler || false) ? (
                  <button
                    type="submit"
                    disabled={reviewSubmitting}
                    className="rounded-full bg-accentGold px-5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-black transition hover:opacity-90 disabled:opacity-50"
                  >
                    {reviewSubmitting ? 'Saving...' : 'Save Review'}
                  </button>
                ) : null}
              </form>
            ) : (
              <p className="text-sm text-muted">Rate the movie above to start writing a review.</p>
            )}
          </div>
        </section>
      )}

      {directors.length > 0 && (
        <section className="mt-10 space-y-4">
          <p className="text-[11px] uppercase tracking-[0.28em] text-muted">Directed By</p>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {directors.map((entry) => (
              <Link key={entry.id} to={`/people/${entry.personId}`} className="min-w-[130px] max-w-[130px] shrink-0 rounded-[28px] border border-white/10 bg-surface3 p-4 text-center transition hover:border-white/20">
                <div className="mx-auto h-16 w-16 overflow-hidden rounded-full bg-surface2">
                  {entry.person?.profileImage ? (
                    <img src={entry.person.profileImage} alt={entry.person.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted">?</div>
                  )}
                </div>
                <p className="mt-3 text-xs font-semibold text-white truncate">{entry.person?.name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {actors.length > 0 && (
        <section className="mt-10 space-y-4">
          <p className="text-[11px] uppercase tracking-[0.28em] text-muted">Cast</p>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {actors.map((entry) => (
              <Link key={entry.id} to={`/people/${entry.personId}`} className="min-w-[130px] max-w-[130px] shrink-0 rounded-[28px] border border-white/10 bg-surface3 p-4 text-center transition hover:border-white/20">
                <div className="mx-auto h-16 w-16 overflow-hidden rounded-full bg-surface2">
                  {entry.person?.profileImage ? (
                    <img src={entry.person.profileImage} alt={entry.person.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted">?</div>
                  )}
                </div>
                <p className="mt-3 text-xs font-semibold text-white truncate">{entry.person?.name}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-muted">{castRoleLabel[entry.role] || entry.role}</p>
                  {entry.characterName && (
                    <p className="mt-1 text-[10px] text-muted truncate">as {entry.characterName}</p>
                  )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {reviews.length > 0 && (
        <section className="mt-10 space-y-4">
          <p className="text-[11px] uppercase tracking-[0.28em] text-muted">All Reviews ({reviews.length})</p>
          <div className="space-y-3">
            {reviews.map((review) => (
              <Link
                key={review.id}
                to={`/reviews/${review.id}`}
                className="block rounded-[28px] border border-white/10 bg-surface3 p-5 transition hover:border-white/20"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 overflow-hidden rounded-full bg-surface2">
                      {review.user?.avatar_url ? (
                        <img src={review.user.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-muted">{review.user?.username?.[0]?.toUpperCase() || '?'}</div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{review.user?.username || 'Unknown'}</p>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-muted">{review.rating}/5</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-white/10 bg-accentGold/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-accentGold">{review.rating}/5</span>
                </div>
                {review.body && <p className="mt-3 text-sm leading-6 text-muted">{review.body.slice(0, 200)}{review.body.length > 200 ? '...' : ''}</p>}
              </Link>
            ))}
          </div>
        </section>
      )}

      {similar.length > 0 && (
        <section className="mt-10 space-y-4">
          <p className="text-[11px] uppercase tracking-[0.28em] text-muted"><Film size={12} className="mr-1 inline" /> Similar Movies</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {similar.map((m) => (
              <Link key={m.id} to={`/movies/${m.id}`} className="group overflow-hidden rounded-[28px] border border-white/10 bg-surface3 transition hover:border-white/20">
                <img src={getPosterUrl(m.posterUrl || m.poster_path)} alt={m.title} className="aspect-[2/3] w-full object-cover transition duration-300 group-hover:opacity-90" />
                <div className="p-3">
                  <p className="text-sm font-semibold text-white truncate">{m.title}</p>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-muted">{m.releaseDate?.slice(0, 4) || m.release_date?.slice(0, 4) || ''}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mt-10">
        <Link to="/" className="rounded-full border border-white/10 bg-surface2 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-text transition hover:border-white/20">
          Back to browse
        </Link>
      </div>
    </div>
  );
}

export default MovieDetail;
