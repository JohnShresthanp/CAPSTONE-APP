import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import FilmCard from './FilmCard';

function FilmRow({ films, loading }) {
  const rowRef = useRef(null);

  const scroll = (direction) => {
    if (!rowRef.current) return;
    rowRef.current.scrollBy({ left: direction * 420, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <div className="absolute left-0 top-1/2 z-10 -translate-y-1/2 px-1">
        <button
          type="button"
          onClick={() => scroll(-1)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-surface3 text-text transition hover:border-white/20"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>

      <div ref={rowRef} className="flex gap-4 overflow-x-auto pb-4 pt-3 pl-12 pr-3 scrollbar-hidden">
        {loading
          ? Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="min-w-[190px] max-w-[190px] animate-pulse rounded-[28px] bg-surface3 h-[385px]" />
            ))
          : films.map((film) => <FilmCard key={film.id} film={film} />)}
      </div>

      <div className="absolute right-0 top-1/2 z-10 -translate-y-1/2 px-1">
        <button
          type="button"
          onClick={() => scroll(1)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-surface3 text-text transition hover:border-white/20"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

export default FilmRow;
