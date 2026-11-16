export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Cargando"
      className="flex min-h-[50vh] items-center justify-center"
    >
      <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
