import { Link } from 'react-router-dom';

function SectionHeader({ title, actionText, actionTo }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-[0.28em] text-muted">{title}</p>
        <div className="mt-3 h-[1px] w-full max-w-[240px] bg-white/10" />
      </div>
      {actionText && actionTo && (
        <Link
          to={actionTo}
          className="shrink-0 rounded-full border border-white/10 bg-surface3 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-text transition hover:border-white/20"
        >
          {actionText}
        </Link>
      )}
    </div>
  );
}

export default SectionHeader;
