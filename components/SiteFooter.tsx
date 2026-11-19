import { site } from "@/lib/data";

export default function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-muted">
        🎄 {site.name} · {site.christmasDate.slice(0, 4)}
      </div>
    </footer>
  );
}
