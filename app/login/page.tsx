import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = { title: "Sign in" };

async function LoginOptions() {
  await connection();
  const session = await getSession();
  if (session) redirect(session.hasPin ? "/" : "/pin");
  const people = await prisma.person.findMany({
    where: { canLogin: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });
  return <LoginForm people={people} />;
}

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-3xl font-bold">🎁 Sign in</h1>
      <p className="mt-2 text-muted">Choose your name and enter your PIN.</p>
      <p className="mt-1 text-sm text-muted">First time? Use the family PIN, then you&apos;ll choose your own.</p>
      <Suspense fallback={<p className="mt-8 text-muted">Loading…</p>}>
        <LoginOptions />
      </Suspense>
    </div>
  );
}
