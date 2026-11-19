import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, verifyToken } from "@/lib/sessionToken";

export type Session = { personId: string; name: string; householdId: string | null };

export function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

/** The signed-in person, re-checked against the database on every call. */
export async function getSession(): Promise<Session | null> {
  await connection(); // request-time only: we read the clock below
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const personId = verifyToken(token, nowSeconds());
  if (!personId) return null;
  const person = await prisma.person.findUnique({
    where: { id: personId },
    select: { id: true, name: true, householdId: true, canLogin: true },
  });
  if (!person?.canLogin) return null;
  return { personId: person.id, name: person.name, householdId: person.householdId };
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}
