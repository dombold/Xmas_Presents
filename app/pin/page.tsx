import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import PinForm from "@/components/PinForm";
import { getSession } from "@/lib/session";
import { logout } from "@/app/actions";

export const metadata: Metadata = { title: "Your PIN" };

export default function PinPage() {
  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <PinContent />
      </Suspense>
    </div>
  );
}

// Uses getSession (not requireSession) so first-time users without a PIN can reach it.
async function PinContent() {
  const session = await getSession();
  if (!session) redirect("/login");

  return session.hasPin ? (
    <>
      <h1 className="text-3xl font-bold">🔑 Change your PIN</h1>
      <p className="mt-2 text-muted">This also signs you out on any other device.</p>
      <PinForm changing />
    </>
  ) : (
    <>
      <h1 className="text-3xl font-bold">🔑 Choose your own PIN</h1>
      <p className="mt-2 text-muted">
        Hi {session.name}! From now on you&apos;ll sign in with your own PIN instead of the family one. That keeps
        presents bought for you a surprise.
      </p>
      <PinForm changing={false} />
      <form action={logout} className="mt-6 text-center text-sm">
        <button type="submit" className="text-muted underline hover:text-primary">
          Not {session.name}? Sign out
        </button>
      </form>
    </>
  );
}
