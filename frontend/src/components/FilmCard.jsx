import { ArrowRight, Heart, List, Eye, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getPosterUrl } from '../services/movieApi';

const stats = [
  { key: 'views', label: 'Views', color: 'green', icon: Eye },
  { key: 'lists', label: 'Lists', color: 'blue', icon: List },
  { key: 'likes', label: 'Likes', color: 'red', icon: Heart },
  { key: 'fans', label: 'Fans', color: 'gold', icon: Crown }
];

const statColorClasses = {
  green: 'bg-accentGreen/10 text-accentGreen',
  blue: 'bg-accentBlue/10 text-accentBlue',
  red: 'bg-accentRed/10 text-accentRed',
  gold: 'bg-accentGold/10 text-accentGold'
};

function formatNumber(value) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toString();
}

function FilmCard({ film }) {
  const posterUrl = getPosterUrl(film.poster_path);

  const filmStats = {
    views: film.popularity ? Math.round(film.popularity * 10) : 0,
    lists: film.vote_count || 0,
    likes: film.vote_average ? Math.round(film.vote_average * 1500) : 0,
    fans: film.vote_average ? Math.round(film.vote_average * 900) : 0
  };

  return (
    <Link to={`/movies/${film.id}`} className="group min-w-[190px] max-w-[190px] rounded-[28px] border border-white/10 bg-surface3 text-sm shadow-subtle transition hover:border-white/20">
      <div className="relative overflow-hidden rounded-[28px]">
        <img
          src={posterUrl}
          alt={film.title}
          className="h-[285px] w-full object-cover transition duration-300 group-hover:opacity-90"
        />
        <div className="pointer-events-none absolute inset-0 bg-black/0 transition duration-300 group-hover:bg-black/15" />
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold leading-tight text-white">{film.title}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.24em] text-muted">{film.release_date?.slice(0, 4)}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {stats.map(({ key, icon: Icon, color }) => (
            <div key={key} className="flex items-center gap-2 rounded-3xl border border-white/10 bg-surface p-2 text-[11px] uppercase tracking-[0.18em] text-muted">
              <span className={`grid h-7 w-7 place-items-center rounded-full ${statColorClasses[color]}`}>
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="text-white">{formatNumber(filmStats[key])}</span>
            </div>
          ))}
        </div>
      </div>
    </Link>
  );
}

export default FilmCard;
