import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getPosterUrl } from '../services/movieApi';

function formatScore(score) {
  return score ? score.toFixed(1) : '0.0';
}

function MiniCard({ film }) {
  const posterUrl = getPosterUrl(film.poster_path);

  return (
    <Link to={`/movies/${film.id}`} className="overflow-hidden rounded-[24px] border border-white/10 bg-surface3 text-sm shadow-subtle transition hover:border-white/20">
      <img src={posterUrl} alt={film.title} className="h-[220px] w-full object-cover" />
      <div className="space-y-2 p-3">
        <p className="font-semibold leading-tight text-white">{film.title}</p>
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted">
          <Star className="h-4 w-4 text-accentGold" />
          <span className="text-white">{formatScore(film.vote_average)} / 10</span>
        </div>
      </div>
    </Link>
  );
}

export default MiniCard;
