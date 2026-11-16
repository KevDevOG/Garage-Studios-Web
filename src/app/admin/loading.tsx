export default function AdminLoading() {
  return (
    <section
      role="status"
      aria-live="polite"
      aria-label="Cargando panel"
      className="mx-auto max-w-6xl animate-pulse space-y-6 px-4 py-8 sm:px-6"
    >
      <div className="h-8 w-48 rounded-lg bg-white/5" />
      <div className="h-10 w-full rounded-xl bg-white/5" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl border border-white/5 bg-card-bg" />
        ))}
      </div>
      <div className="h-64 rounded-2xl border border-white/5 bg-card-bg" />
      <span className="sr-only">Cargando…</span>
    </section>
  );
}
