import { Suspense } from "react";
import Link from "next/link";
import { navLinks, site } from "@/lib/data";
import { getSession } from "@/lib/session";
import { logout } from "@/app/actions";

// Only shown once signed in with a personal PIN.
async function SignedInNav() {
  const session = await getSession();
  // No nav until a personal PIN is set (every page would redirect to /pin anyway).
  if (!session?.hasPin) return null;
  return (
    <>
      <form action={logout} className="flex items-center gap-3 text-sm">
        <span className="text-muted">
          Hi, {session.name}
          {session.isAdmin ? " (admin)" : ""}
        </span>
        <Link href="/pin" className="font-medium hover:text-primary">
          Change PIN
        </Link>
        <button type="submit" className="font-medium hover:text-primary">
          Sign out
        </button>
      </form>
      <nav aria-label="Main" className="w-full">
        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="hover:text-primary">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}

export default function SiteHeader() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-4">
        <Link href="/" className="text-xl font-bold text-primary">
          🎁 {site.name}
        </Link>
        <Suspense fallback={null}>
          <SignedInNav />
        </Suspense>
      </div>
    </header>
  );
}
