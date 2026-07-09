import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Star, UserPlus, Eye, List as ListIcon } from 'lucide-react';
import { fetchActivityFeed } from '../services/userApi';
import { useAuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const activityConfig = {
  REVIEWED: { icon: Star, color: 'text-accentGold', text: 'reviewed' },
  LIKED_REVIEW: { icon: Heart, color: 'text-red-400', text: 'liked a review' },
  COMMENTED_ON_REVIEW: { icon: MessageCircle, color: 'text-accentBlue', text: 'commented on a review' },
  FOLLOWED_USER: { icon: UserPlus, color: 'text-accentGreen', text: 'followed' },
  WATCHED: { icon: Eye, color: 'text-accentGold', text: 'watched' },
  ADDED_TO_LIST: { icon: ListIcon, color: 'text-accentBlue', text: 'added to list' }
};

function Feed() {
  const { user } = useAuthContext();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchActivityFeed();
        if (!cancelled) setActivities(data?.data || data || []);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-surface text-text">
        <div className="mx-auto max-w-[1180px] px-4 py-5 sm:px-6 lg:px-8">
          <Navbar />
          <main className="mt-10 text-center text-sm text-muted">
            <Link to="/login" className="text-accentGold underline">Log in</Link> to see your feed.
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-text">
      <div className="mx-auto max-w-[1180px] px-4 py-5 sm:px-6 lg:px-8">
        <Navbar />
        <main className="mt-8 space-y-6">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.28em] text-muted">Activity</p>
            <h1 className="text-2xl font-semibold text-white">Your Feed</h1>
          </div>

          {loading ? (
            <div className="text-sm text-muted">Loading feed...</div>
          ) : activities.length === 0 ? (
            <div className="rounded-[32px] border border-white/10 bg-surface2 p-10 text-center">
              <p className="text-sm text-muted">No activity yet. Follow users or watch movies to see activity here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => {
                const cfg = activityConfig[activity.activityType] || { icon: Star, color: 'text-muted', text: activity.activityType };
                const Icon = cfg.icon;
                const actor = activity.actor || {};
                const targetLink = activity.targetType === 'review'
                  ? `/reviews/${activity.targetId}`
                  : activity.targetType === 'movie'
                  ? `/movies/${activity.targetId}`
                  : activity.targetType === 'user'
                  ? `/users/${activity.targetId}`
                  : null;

                return (
                  <div key={activity.id} className="flex items-center gap-4 rounded-[28px] border border-white/10 bg-surface3 p-4">
                    <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-surface2 ${cfg.color}`}>
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Link to={`/users/${actor.username}`} className="font-semibold text-white hover:underline">{actor.username}</Link>
                        <span className="text-muted">{cfg.text}</span>
                        {targetLink ? (
                          <Link to={targetLink} className="text-accentGold hover:underline truncate">
                            {activity.metadata?.title || activity.targetId}
                          </Link>
                        ) : (
                          <span className="text-muted truncate">{activity.metadata?.title || activity.targetId}</span>
                        )}
                      </div>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-muted">
                        {new Date(activity.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Feed;
