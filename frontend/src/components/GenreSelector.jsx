const ALL_GENRES = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
  'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music',
  'Mystery', 'Romance', 'Science Fiction', 'Thriller', 'War', 'Western'
];

function GenreSelector({ selected, onChange, min }) {
  const toggle = (genre) => {
    const next = selected.includes(genre)
      ? selected.filter((g) => g !== genre)
      : [...selected, genre];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {ALL_GENRES.map((genre) => {
          const isActive = selected.includes(genre);
          return (
            <button
              type="button"
              key={genre}
              onClick={() => toggle(genre)}
              className={`rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.18em] transition ${
                isActive
                  ? 'bg-accentGold text-black font-semibold'
                  : 'border border-white/10 bg-surface3 text-muted hover:border-white/20'
              }`}
            >
              {genre}
            </button>
          );
        })}
      </div>
      {min && selected.length < min && (
        <p className="text-xs text-muted">Select at least {min} genres ({selected.length}/{min})</p>
      )}
    </div>
  );
}

export default GenreSelector;
