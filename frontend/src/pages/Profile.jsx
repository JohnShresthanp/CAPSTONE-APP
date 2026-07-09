import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, BookOpen, Users, Star, Calendar, Search, Rss, ExternalLink, Trash2, Eye, EyeOff } from 'lucide-react';
import { fetchUserProfile, fetchUserReviews, fetchUserLists, fetchUserStats, fetchUserDiary, updateProfile, followUser } from '../services/userApi';
import { getPosterUrl } from '../services/movieApi';
import { fetchMyLists, addMovieToList, removeMovieFromList } from '../services/listApi';
import { useAuthContext } from '../context/AuthContext';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const TABS = [
  { key: 'profile', label: 'Profile' },
  { key: 'activity', label: 'Activity' },
  { key: 'films', label: 'Films' },
  { key: 'diary', label: 'Diary' },
  { key: 'reviews', label: 'Reviews' },
  { key: 'watchlist', label: 'Watchlist' },
  { key: 'lists', label: 'Lists' },
  { key: 'likes', label: 'Likes' },
  { key: 'tags', label: 'Tags' },
  { key: 'network', label: 'Network' }
];

function DiaryWidget({ diary }) {
  if (!diary || diary.length === 0) return null;
  const recent = diary.slice(0, 5);
  return (
    <div className="rounded-xl border border-white/10 bg-[#1c1c1c] p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-white">Diary</p>
        <span className="rounded-full bg-[#00c030]/20 px-2 py-0.5 text-[10px] font-medium text-[#00c030]">{diary.length}</span>
      </div>
      <div className="space-y-2">
        {recent.map((entry, i) => {
          const d = new Date(entry.createdAt || entry.date);
          return (
            <Link key={entry.id || i} to={`/movies/${entry.movie?.id || entry.movieId}`} className="flex items-center gap-2 group">
              <span className="flex h-7 w-7 items-center justify-center rounded bg-[#00c030]/10 text-[10px] font-bold text-[#00c030]">
                {MONTHS[d.getMonth()]}
              </span>
              <span className="w-5 text-center text-[11px] text-muted">{d.getDate()}</span>
              <span className="flex-1 truncate text-[12px] text-text group-hover:text-white">{entry.movie?.title || 'Unknown'}</span>
            </Link>
          );
        })}
      </div>
      <Link to={`/diary/${diary[0]?.user?.username || ''}`} className="mt-3 block text-center text-[10px] font-medium uppercase tracking-wider text-[#00c030] hover:underline">
        View all entries →
      </Link>
    </div>
  );
}

function Profile() {
  const { username } = useParams();
  const { user: currentUser } = useAuthContext();
  const [profile, setProfile] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [lists, setLists] = useState([]);
  const [stats, setStats] = useState(null);
  const [diary, setDiary] = useState([]);
  const [activeTab, setActiveTab] = useState('profile');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [likedListId, setLikedListId] = useState(null);
  const [revealedSpoilers, setRevealedSpoilers] = useState(new Set());

  const toggleSpoiler = (reviewId) => {
    setRevealedSpoilers((prev) => {
      const next = new Set(prev);
      if (next.has(reviewId)) next.delete(reviewId);
      else next.add(reviewId);
      return next;
    });
  };

  const isOwnProfile = currentUser && profile && currentUser.username === profile.username;

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [profileResult, reviewData, listData, statsData, diaryData] = await Promise.all([
          fetchUserProfile(username),
          fetchUserReviews(username).catch(() => []),
          fetchUserLists(username).catch(() => []),
          fetchUserStats(username).catch(() => null),
          fetchUserDiary(username).catch(() => [])
        ]);
        setProfile(profileResult.user || profileResult);
        setProfileData(profileResult);
        setReviews(reviewData);
        setLists(listData);
        setStats(statsData);
        setDiary(diaryData);

        if (currentUser?.username === username) {
          fetchMyLists().then((myLists) => {
            const liked = myLists.find((l) => l.systemType === 'liked');
            if (liked) setLikedListId(liked.id);
          }).catch(() => {});
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [username]);

  useEffect(() => {
    setActiveTab('profile');
  }, [username]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const updated = await updateProfile(formData);
      setProfile((prev) => ({ ...prev, avatar_url: updated.avatar_url }));
    } catch (error) {
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser || isOwnProfile) return;
    setFollowLoading(true);
    try {
      const result = await followUser(username);
      setIsFollowing(result.following);
      setProfileData((prev) => ({
        ...prev,
        counts: {
          ...prev.counts,
          followers: prev.counts.followers + (result.following ? 1 : -1)
        }
      }));
    } catch (error) {
      console.error(error);
    } finally {
      setFollowLoading(false);
    }
  };

  const counts = profileData?.counts || {};
  const favoriteFilms = profileData?.likedMovies || [];
  const recentlyWatched = profileData?.recentlyWatched || [];
  const recentActivity = stats?.recentActivity || [];
  const recentReviews = reviews
    .filter((r) => r.body)
    .slice(0, 3);
  const currentYear = new Date().getFullYear();
  const yearCount = diary.filter((e) => {
    const d = new Date(e.createdAt || e.date);
    return d.getFullYear() === currentYear;
  }).length || stats?.totalMoviesWatched || 0;

  const handleRemoveFavorite = async (movieId) => {
    if (!likedListId) return;
    try {
      await removeMovieFromList(likedListId, movieId);
      const updated = await fetchUserProfile(username);
      setProfileData(updated);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#14181c] text-[#9ab] px-4 py-20 text-sm">
        <div className="mx-auto max-w-[1100px] animate-pulse space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-white/5" />
            <div className="space-y-2">
              <div className="h-5 w-40 rounded bg-white/5" />
              <div className="h-3 w-60 rounded bg-white/5" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <div className="min-h-screen bg-[#14181c] px-4 py-20 text-sm text-[#9ab] text-center">User not found.</div>;
  }

  return (
    <div className="min-h-screen bg-[#14181c] text-[#9ab]">
      <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-white/5">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-lg font-bold text-[#9ab]">
                  {profile.username?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              {isOwnProfile && (
                <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/0 text-[0px] transition hover:bg-black/60 hover:text-[9px] hover:font-semibold hover:uppercase hover:tracking-wider hover:text-white">
                  Edit
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={uploading} />
                </label>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{profile.username}</h1>
              {profile.bio && <p className="mt-1 text-sm text-[#9ab] max-w-md">{profile.bio}</p>}
              {isOwnProfile ? (
                <Link to="/settings" className="mt-2 inline-block rounded-full border border-white/10 px-4 py-1.5 text-[11px] font-medium uppercase tracking-wider text-[#9ab] transition hover:border-white/20 hover:text-white">
                  Edit profile
                </Link>
              ) : currentUser && (
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[11px] font-medium uppercase tracking-wider transition disabled:opacity-50 ${
                    isFollowing
                      ? 'bg-[#00c030]/10 text-[#00c030] border border-[#00c030]/30'
                      : 'border border-white/10 text-[#9ab] hover:border-white/20 hover:text-white'
                  }`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
              {uploading && <p className="mt-2 text-[10px] text-[#9ab]">Uploading...</p>}
            </div>
          </div>

          <div className="flex gap-6 sm:gap-8">
            {[
              { label: 'Films', value: counts.watchedMovies ?? 0 },
              { label: String(currentYear), value: yearCount },
              { label: 'Following', value: counts.following ?? 0 },
              { label: 'Followers', value: counts.followers ?? 0 }
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-lg font-bold text-white">{stat.value}</p>
                <p className="text-[10px] uppercase tracking-wider text-[#9ab]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tab Navigation ── */}
        <div className="mt-8 flex items-center border-b border-white/10">
          <div className="flex flex-1 gap-0 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative px-3 py-3 text-[11px] font-medium uppercase tracking-wider transition whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'text-white'
                    : 'text-[#9ab] hover:text-white'
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00c030]" />
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 pl-4">
            <Search size={14} className="text-[#9ab] hover:text-white cursor-pointer transition" />
            <Rss size={14} className="text-[#9ab] hover:text-white cursor-pointer transition" />
          </div>
        </div>

        {/* ── Content Area ── */}
        <div className="mt-8 flex flex-col gap-8 lg:flex-row">
          {/* Main */}
          <div className="flex-1 min-w-0 space-y-10">
            {activeTab === 'profile' && (
              <>
                {/* Favorite Films */}
                <section>
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-[#9ab]">
                    <Heart size={10} className="mr-1 inline" />
                    Favorite films
                  </p>
                  <div className="flex gap-3">
                    {[0, 1].map((slotIndex) => {
                      const film = favoriteFilms[slotIndex] || null;
                      return (
                        <div key={slotIndex} className="w-[140px]">
                          {film ? (
                            <div className="group relative">
                              <Link to={`/movies/${film.id}`}>
                                <div className="aspect-[2/3] overflow-hidden rounded-lg bg-white/5">
                                  {film.posterUrl || film.poster_path ? (
                                    <img src={getPosterUrl(film.posterUrl || film.poster_path)} alt={film.title} className="h-full w-full object-cover transition duration-200 group-hover:opacity-80" />
                                  ) : (
                                    <div className="flex h-full items-center justify-center p-2 text-center text-[9px] text-[#9ab]">{film.title}</div>
                                  )}
                                </div>
                              </Link>
                              {isOwnProfile && (
                                <button
                                  onClick={() => handleRemoveFavorite(film.id)}
                                  className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white/80 opacity-0 transition hover:bg-red-500/80 hover:text-white group-hover:opacity-100"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="aspect-[2/3] rounded-lg bg-white/5" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Recent Reviews */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#9ab]">Recent reviews</p>
                    {reviews.length > 0 && (
                      <button onClick={() => setActiveTab('reviews')} className="text-[10px] font-medium uppercase tracking-wider text-[#00c030] hover:underline">ALL</button>
                    )}
                  </div>
                    <div className="space-y-2">
                    {recentReviews.length > 0 ? recentReviews.map((review) => (
                      <Link key={review.id} to={`/movies/${review.movie?.id}`} className="flex gap-3 rounded-lg border border-white/10 bg-[#1c1c1c] p-3 transition hover:border-white/20">
                        {review.movie?.posterUrl ? (
                          <img src={getPosterUrl(review.movie.posterUrl)} alt="" className="h-16 w-11 shrink-0 rounded object-cover bg-white/5" />
                        ) : (
                          <div className="h-16 w-11 shrink-0 rounded bg-white/5" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-white truncate">{review.movie?.title}</p>
                          <p className="text-[10px] text-[#00c030]">{review.rating}/5</p>
                          <div className="relative mt-1">
                            <p className={`text-[11px] text-[#9ab] leading-relaxed ${review.containsSpoiler && !revealedSpoilers.has(review.id) ? 'blur-sm select-none' : ''} line-clamp-2`}>
                              {review.body}
                            </p>
                            {review.containsSpoiler && (
                              <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSpoiler(review.id); }}
                                className="absolute right-0 top-0 flex items-center gap-1 rounded bg-red-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-red-400 hover:bg-red-500/30"
                              >
                                {revealedSpoilers.has(review.id) ? <EyeOff size={10} /> : <Eye size={10} />}
                                SPOILER
                              </button>
                            )}
                          </div>
                        </div>
                      </Link>
                    )) : (
                      <p className="text-xs text-[#9ab] py-2">No reviews yet.</p>
                    )}
                  </div>
                </section>
              </>
            )}

            {activeTab === 'reviews' && (
              <section>
                <p className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-[#9ab]">Reviews</p>
                <div className="space-y-3">
                  {reviews.length > 0 ? reviews.map((review) => (
                    <Link key={review.id} to={`/reviews/${review.id}`} className="flex gap-4 rounded-xl border border-white/10 bg-[#1c1c1c] p-4 transition hover:border-white/20">
                      {review.movie?.posterUrl ? (
                        <img src={getPosterUrl(review.movie.posterUrl)} alt="" className="h-20 w-14 shrink-0 rounded object-cover bg-white/5" />
                      ) : null}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white">{review.movie?.title}</p>
                        <p className="text-xs text-[#00c030]">{review.rating}/5</p>
                        {review.body && (
                          <div className="relative mt-1">
                            <p className={`text-xs text-[#9ab] line-clamp-2 ${review.containsSpoiler && !revealedSpoilers.has(review.id) ? 'blur-sm select-none' : ''}`}>{review.body}</p>
                            {review.containsSpoiler && (
                              <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSpoiler(review.id); }}
                                className="absolute right-0 top-0 flex items-center gap-1 rounded bg-red-500/20 px-1 py-0.5 text-[9px] font-semibold text-red-400 hover:bg-red-500/30"
                              >
                                {revealedSpoilers.has(review.id) ? <EyeOff size={10} /> : <Eye size={10} />}
                                SPOILER
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </Link>
                  )) : (
                    <p className="text-sm text-[#9ab]">No reviews yet.</p>
                  )}
                </div>
              </section>
            )}

            {activeTab === 'lists' && (
              <section>
                <p className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-[#9ab]">Lists</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {lists.length > 0 ? lists.map((list) => (
                    <Link key={list.id} to={`/lists/${list.id}`} className="rounded-xl border border-white/10 bg-[#1c1c1c] p-4 transition hover:border-white/20">
                      <p className="text-sm font-semibold text-white">{list.name}</p>
                      <p className="text-xs text-[#9ab] mt-1">{list.movieCount ?? list._count?.movies ?? list.movies?.length ?? 0} films</p>
                    </Link>
                  )) : (
                    <p className="text-sm text-[#9ab]">No lists yet.</p>
                  )}
                </div>
              </section>
            )}

            {activeTab === 'diary' && (
              <section>
                <p className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-[#9ab]">Film Diary</p>
                <div className="space-y-2">
                  {diary.length > 0 ? diary.slice(0, 20).map((entry, i) => {
                    const d = new Date(entry.createdAt || entry.date);
                    return (
                      <Link key={entry.id || i} to={`/movies/${entry.movie?.id || entry.movieId}`} className="flex items-center gap-3 rounded-lg border border-white/5 bg-[#1c1c1c] px-3 py-2 text-sm transition hover:border-white/10">
                        <span className="w-8 text-center text-xs text-[#9ab]">{d.getDate()} {MONTHS[d.getMonth()]}</span>
                        <span className="flex-1 text-white">{entry.movie?.title || 'Unknown'}</span>
                        {entry.rating && <span className="text-xs text-[#00c030]">{entry.rating}/5</span>}
                      </Link>
                    );
                  }) : (
                    <p className="text-sm text-[#9ab]">No diary entries.</p>
                  )}
                </div>
              </section>
            )}

            {activeTab === 'activity' && (
              <section>
                <p className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-[#9ab]">Activity</p>
                <div className="space-y-2">
                  {recentActivity.length > 0 ? recentActivity.map((act, i) => (
                    <div key={act.id || i} className="rounded-lg border border-white/5 bg-[#1c1c1c] px-4 py-3 text-sm">
                      <span className="text-xs text-[#9ab]">{act.type?.replace(/_/g, ' ').toLowerCase()}</span>
                      {act.metadata?.movieTitle && (
                        <p className="text-white">{act.metadata.movieTitle}</p>
                      )}
                      <p className="text-[10px] text-[#9ab] mt-0.5">{new Date(act.createdAt).toLocaleDateString()}</p>
                    </div>
                  )) : (
                    <p className="text-sm text-[#9ab]">No activity yet.</p>
                  )}
                </div>
              </section>
            )}

            {activeTab === 'films' && (
              <section>
                <p className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-[#9ab]">All Watched Films</p>
                <div className="grid grid-cols-4 gap-3">
                  {recentlyWatched.length > 0 ? recentlyWatched.map((film) => (
                    <Link key={film.id} to={`/movies/${film.id}`} className="group block">
                      <div className="aspect-[2/3] overflow-hidden rounded-lg bg-white/5">
                        {film.posterUrl ? (
                          <img src={getPosterUrl(film.posterUrl)} alt={film.title} className="h-full w-full object-cover transition duration-200 group-hover:opacity-80" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[9px] text-[#9ab]">{film.title}</div>
                        )}
                      </div>
                      <p className="mt-1.5 text-xs text-white truncate">{film.title}</p>
                    </Link>
                  )) : (
                    <p className="col-span-4 text-sm text-[#9ab]">No films watched yet.</p>
                  )}
                </div>
              </section>
            )}

            {activeTab === 'likes' && (
              <section>
                <p className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-[#9ab]">Liked Films</p>
                <div className="grid grid-cols-4 gap-3">
                  {(favoriteFilms.length > 0 ? favoriteFilms : [null, null, null, null]).map((film, i) => (
                    <div key={i}>
                      {film ? (
                        <Link to={`/movies/${film.id}`} className="group block">
                          <div className="aspect-[2/3] overflow-hidden rounded-lg bg-white/5">
                            {film.posterUrl || film.poster_path ? (
                              <img src={getPosterUrl(film.posterUrl || film.poster_path)} alt={film.title} className="h-full w-full object-cover transition duration-200 group-hover:opacity-80" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-[9px] text-[#9ab]">No poster</div>
                            )}
                          </div>
                        </Link>
                      ) : (
                        <div className="aspect-[2/3] rounded-lg bg-white/5" />
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeTab === 'watchlist' && (
              <section>
                <p className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-[#9ab]">Watchlist</p>
                {profileData?.watchlistMovies?.length > 0 ? (
                  <div className="grid grid-cols-4 gap-3">
                    {profileData.watchlistMovies.map((film) => (
                      <Link key={film.id} to={`/movies/${film.id}`} className="group block">
                        <div className="aspect-[2/3] overflow-hidden rounded-lg bg-white/5">
                          {film.posterUrl ? (
                            <img src={getPosterUrl(film.posterUrl)} alt={film.title} className="h-full w-full object-cover transition duration-200 group-hover:opacity-80" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[9px] text-[#9ab]">{film.title}</div>
                          )}
                        </div>
                        <p className="mt-1.5 text-xs text-white truncate">{film.title}</p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#9ab]">No watchlist items.</p>
                )}
              </section>
            )}
          </div>

          {/* ── Right Sidebar ── */}
          <aside className="w-full shrink-0 lg:w-[280px] space-y-6">
            <DiaryWidget diary={diary} />

            <div className="rounded-xl border border-white/10 bg-gradient-to-b from-[#1c1c1c] to-[#14181c] p-5 text-center">
              <p className="text-sm font-bold text-white">Track every film you watch</p>
              <p className="mt-2 text-xs text-[#9ab] leading-relaxed">
                Keep a diary of everything you watch, rate and review films, and connect with friends.
              </p>
              <Link
                to="/search"
                className="mt-4 inline-block rounded-full bg-[#00c030] px-5 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#00d838]"
              >
                Find films to watch
              </Link>
            </div>

            {stats?.favoriteGenres?.length > 0 && (
              <div className="rounded-xl border border-white/10 bg-[#1c1c1c] p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white">Top genres</p>
                <div className="flex flex-wrap gap-2">
                  {stats.favoriteGenres.map((g) => (
                    <span key={g.genre || g} className="rounded-full border border-white/10 px-3 py-1 text-[10px] text-[#9ab]">{g.genre || g}</span>
                  ))}
                </div>
              </div>
            )}

            {stats?.ratingDistribution && Object.keys(stats.ratingDistribution).length > 0 && (
              <div className="rounded-xl border border-white/10 bg-[#1c1c1c] p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white">Rating distribution</p>
                <div className="space-y-1.5">
                  {[5, 4, 3, 2, 1, 0.5].map((r) => {
                    const count = stats.ratingDistribution[r] || 0;
                    const maxCount = Math.max(...Object.values(stats.ratingDistribution), 1);
                    const pct = (count / maxCount) * 100;
                    return (
                      <div key={r} className="flex items-center gap-2 text-[11px]">
                        <span className="w-6 text-right text-[#9ab]">{r}</span>
                        <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full rounded-full bg-[#00c030]" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-6 text-right text-[#9ab]">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

export default Profile;
