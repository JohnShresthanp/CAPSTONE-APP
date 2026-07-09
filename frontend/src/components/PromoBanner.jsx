function PromoBanner() {
  return (
    <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-surface2 px-6 py-6 sm:px-8">
      <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr] lg:items-center">
        <div className="max-w-xl space-y-4">
          <div className="inline-flex items-center rounded-full bg-accentGold/10 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-accentGold">
            PRO
          </div>
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">Unlock the next chapter of your film journey.</h2>
          <p className="max-w-2xl text-sm leading-7 text-muted">
            Upgrade to FilmMosaic Pro for early access to curated collections, advanced watchlists, and premium discovery tools.
          </p>
          <button className="inline-flex items-center rounded-full border border-white/10 bg-surface3 px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:border-white/20">
            UPGRADE TO PRO
          </button>
        </div>
        <div className="hidden overflow-hidden rounded-[32px] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_35%)] sm:block">
          <div className="h-full min-h-[220px] bg-[url('https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80')] bg-cover bg-center opacity-20" />
        </div>
      </div>
    </div>
  );
}

export default PromoBanner;
