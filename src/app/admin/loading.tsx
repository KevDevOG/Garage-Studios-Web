import { Page } from "@/components/admin/ui";

export default function AdminLoading() {
  return (
    <Page width="wide">
      <div role="status" aria-live="polite" className="space-y-5">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-md bg-gs-raised motion-safe:animate-pulse" />
          <div className="h-4 w-72 max-w-full rounded-md bg-gs-raised motion-safe:animate-pulse" />
        </div>
        <div className="h-20 rounded-lg bg-gs-raised motion-safe:animate-pulse" />
        <div className="h-64 rounded-lg bg-gs-raised motion-safe:animate-pulse" />
        <span className="sr-only">Cargando…</span>
      </div>
    </Page>
  );
}
