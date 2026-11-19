"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, setSessionCookie, type Session } from "@/lib/session";
import { SESSION_COOKIE, familyPinMatches } from "@/lib/sessionToken";
import { PIN_PATTERN, hashPin, verifyPin } from "@/lib/pinHash";
import { allowAttempt, clearFailures, recordFailure } from "@/lib/rateLimit";
import { canEditGift } from "@/lib/permissions";
import { invalidRecipientIds, isHiddenFrom, parseDollars } from "@/lib/split";

export type FormState = { error?: string } | undefined;

/** Signed in AND has set a personal PIN; otherwise redirects. */
async function requireActionSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.hasPin) redirect("/pin");
  return session;
}

async function clientIp() {
  // nginx sets X-Real-IP; the first X-Forwarded-For entry can be spoofed by the client.
  return (await headers()).get("x-real-ip") || "local";
}

// ---------- Login / logout ----------

const LoginSchema = z.object({
  personId: z.string().min(1, "Choose your name"),
  pin: z.string().min(1, "Enter your PIN").max(50),
});

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = LoginSchema.safeParse({ personId: formData.get("personId"), pin: formData.get("pin") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const now = Date.now();
  const ipKey = `ip:${await clientIp()}`;
  const personKey = `person:${parsed.data.personId}`;
  if (!allowAttempt(ipKey, now) || !allowAttempt(personKey, now)) {
    return { error: "Too many attempts. Try again in 15 minutes." };
  }

  const person = await prisma.person.findUnique({
    where: { id: parsed.data.personId },
    select: { id: true, canLogin: true, pinHash: true, sessionVersion: true },
  });
  if (!person?.canLogin) return { error: "Choose your name from the list." };

  // Once someone has their own PIN, the family PIN no longer works for them.
  const ok = person.pinHash ? verifyPin(parsed.data.pin, person.pinHash) : familyPinMatches(parsed.data.pin);
  if (!ok) {
    recordFailure(ipKey, now);
    recordFailure(personKey, now);
    return {
      error: person.pinHash
        ? "That PIN isn't right. Use your own PIN, not the family one."
        : "That PIN isn't right.",
    };
  }

  clearFailures(ipKey);
  clearFailures(personKey);
  await setSessionCookie(person.id, person.sessionVersion);
  redirect(person.pinHash ? "/" : "/pin");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}

// ---------- Personal PIN ----------

const PinSchema = z
  .object({
    currentPin: z.string().max(50).optional(),
    newPin: z.string().regex(PIN_PATTERN, "Your PIN must be 4 to 8 digits."),
    confirmPin: z.string(),
  })
  .refine((d) => d.newPin === d.confirmPin, { message: "The two PINs don't match." });

export async function setPin(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const parsed = PinSchema.safeParse({
    currentPin: formData.get("currentPin") ?? undefined,
    newPin: formData.get("newPin"),
    confirmPin: formData.get("confirmPin"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (familyPinMatches(parsed.data.newPin)) return { error: "Choose a PIN that's different from the family PIN." };

  const person = await prisma.person.findUnique({
    where: { id: session.personId },
    select: { pinHash: true, sessionVersion: true },
  });
  if (!person) redirect("/login");

  // Changing an existing PIN needs the current one.
  if (person.pinHash) {
    const now = Date.now();
    const key = `person:${session.personId}`;
    if (!allowAttempt(key, now)) return { error: "Too many attempts. Try again in 15 minutes." };
    if (!parsed.data.currentPin || !verifyPin(parsed.data.currentPin, person.pinHash)) {
      recordFailure(key, now);
      return { error: "Your current PIN isn't right." };
    }
    clearFailures(key);
  }

  // Bumping the version signs out every other session for this person.
  const updated = await prisma.person.update({
    where: { id: session.personId },
    data: { pinHash: hashPin(parsed.data.newPin), sessionVersion: { increment: 1 } },
    select: { sessionVersion: true },
  });
  await setSessionCookie(session.personId, updated.sessionVersion);
  redirect("/");
}

// ---------- Presents ----------

const GiftSchema = z.object({
  id: z.string().optional(),
  year: z.coerce.number().int().min(2000).max(2100),
  description: z.string().trim().min(1, "Say what the present is").max(200),
  cost: z.string().trim().min(1, "Enter the cost"),
  note: z.string().trim().max(500).optional(),
  recipientIds: z.array(z.string().min(1)).min(1, "Choose who it's for").max(20),
});

async function peopleMap(ids: string[]) {
  const people = await prisma.person.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, householdId: true, retired: true },
  });
  return new Map(people.map((p) => [p.id, p]));
}

export async function saveGift(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireActionSession();

  const parsed = GiftSchema.safeParse({
    id: formData.get("id") || undefined,
    year: formData.get("year"),
    description: formData.get("description"),
    cost: formData.get("cost"),
    note: formData.get("note") || undefined,
    recipientIds: formData.getAll("recipientIds"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = parsed.data;

  const costCents = parseDollars(data.cost);
  if (costCents === null || costCents <= 0) return { error: "Enter the cost as a dollar amount, e.g. 45 or 45.50" };
  if (costCents > 100_000_00) return { error: "That cost looks too high — check the amount." };

  // The buyer never comes from the form: a new present is bought by your household;
  // an edited one keeps its buyer (so an admin fixing it doesn't move it).
  let buyerId: string;
  let existingRecipients: string[] = [];
  if (data.id) {
    const existing = await prisma.gift.findUnique({
      where: { id: data.id },
      select: { buyerId: true, enteredById: true, recipients: { select: { personId: true } } },
    });
    if (!existing) return { error: "That present no longer exists." };
    existingRecipients = existing.recipients.map((r) => r.personId);
    if (isHiddenFrom(existingRecipients, session.householdId, await peopleMap(existingRecipients))) {
      return { error: "That present no longer exists." };
    }
    if (!canEditGift(existing, session)) return { error: "Only the person who added this present can change it." };
    buyerId = existing.buyerId;
  } else {
    if (!session.householdId) return { error: "You need to be in a household to add presents." };
    buyerId = session.householdId;
  }

  // Cross-check recipient IDs from the form against the database.
  const recipientIds = [...new Set(data.recipientIds)];
  const people = await peopleMap(recipientIds);
  if (people.size !== recipientIds.length) return { error: "Unknown recipient." };
  // Retired recipients can stay on a present that already has them, but can't be added.
  if (recipientIds.some((id) => people.get(id)?.retired && !existingRecipients.includes(id))) {
    return { error: "Unknown recipient." };
  }
  const ownMembers = invalidRecipientIds(buyerId, recipientIds, people);
  if (ownMembers.length > 0) {
    const names = ownMembers.map((id) => people.get(id)?.name).join(", ");
    return { error: `${names} is in the buying household — presents for your own household aren't shared.` };
  }
  if (isHiddenFrom(recipientIds, session.householdId, people)) {
    return { error: "You can't add presents for your own household." };
  }

  const fields = { year: data.year, buyerId, description: data.description, costCents, note: data.note ?? null };

  if (data.id) {
    await prisma.$transaction([
      prisma.giftRecipient.deleteMany({ where: { giftId: data.id } }),
      prisma.gift.update({
        where: { id: data.id },
        data: { ...fields, recipients: { create: recipientIds.map((personId) => ({ personId })) } },
      }),
    ]);
  } else {
    await prisma.gift.create({
      data: {
        ...fields,
        enteredById: session.personId,
        recipients: { create: recipientIds.map((personId) => ({ personId })) },
      },
    });
  }

  revalidatePath("/");
  redirect(`/?year=${data.year}`);
}

export async function deleteGift(formData: FormData) {
  const session = await requireActionSession();
  const id = z.string().min(1).parse(formData.get("id"));
  const gift = await prisma.gift.findUnique({
    where: { id },
    select: { year: true, enteredById: true, recipients: { select: { personId: true } } },
  });
  if (gift) {
    const recipientIds = gift.recipients.map((r) => r.personId);
    const hidden = isHiddenFrom(recipientIds, session.householdId, await peopleMap(recipientIds));
    if (!hidden && canEditGift(gift, session)) await prisma.gift.delete({ where: { id } });
  }
  revalidatePath("/");
  redirect(`/?year=${gift?.year ?? ""}`);
}
