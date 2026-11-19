import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, createToken, verifyToken } from "@/lib/sessionToken";

export type Session = {
  personId: string;
  name: string;
  householdId: string | null;
  isAdmin: boolean;
  /** False until the person has replaced the family PIN with their own. */
  hasPin: boolean;
};

export function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

/** The signed-in person, re-checked against the database on every call. */
export async function getSession(): Promise<Session | null> {
  await connection(); // request-time only: we read the clock below
  const token = verifyToken((await cookies()).get(SESSION_COOKIE)?.value, nowSeconds());
  if (!token) return null;
  const person = await prisma.person.findUnique({
    where: { id: token.personId },
    select: { id: true, name: true, householdId: true, canLogin: true, isAdmin: true, pinHash: true, sessionVersion: true },
  });
  // A changed or reset PIN bumps sessionVersion, which signs out older sessions.
  if (!person?.canLogin || person.sessionVersion !== token.version) return null;
  return {
    personId: person.id,
    name: person.name,
    householdId: person.householdId,
    isAdmin: person.isAdmin,
    hasPin: person.pinHash !== null,
  };
}

/** For pages: must be signed in and have set a personal PIN. */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.hasPin) redirect("/pin");
  return session;
}

/** Sets the session cookie. Only callable from server actions / route handlers. */
export async function setSessionCookie(personId: string, version: number) {
  (await cookies()).set(SESSION_COOKIE, createToken(personId, version, nowSeconds()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}
