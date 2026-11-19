"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, nowSeconds } from "@/lib/session";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, createToken, pinMatches } from "@/lib/sessionToken";
import { allowAttempt, clearFailures, recordFailure } from "@/lib/rateLimit";
import { invalidRecipientIds, parseDollars } from "@/lib/split";

export type FormState = { error?: string } | undefined;

// ---------- Login / logout ----------

const LoginSchema = z.object({
  personId: z.string().min(1, "Choose your name"),
  pin: z.string().min(1, "Enter the family PIN").max(50),
});

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = LoginSchema.safeParse({ personId: formData.get("personId"), pin: formData.get("pin") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // nginx sets X-Real-IP; the first X-Forwarded-For entry can be spoofed by the client.
  const ip = (await headers()).get("x-real-ip") || "local";
  const now = Date.now();
  if (!allowAttempt(ip, now)) return { error: "Too many attempts. Try again in 15 minutes." };

  if (!pinMatches(parsed.data.pin)) {
    recordFailure(ip, now);
    return { error: "That PIN isn't right." };
  }
  const person = await prisma.person.findUnique({
    where: { id: parsed.data.personId },
    select: { id: true, canLogin: true },
  });
  if (!person?.canLogin) return { error: "Choose your name from the list." };

  clearFailures(ip);
  (await cookies()).set(SESSION_COOKIE, createToken(person.id, nowSeconds()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  redirect("/");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}

// ---------- Presents ----------

const GiftSchema = z.object({
  id: z.string().optional(),
  year: z.coerce.number().int().min(2000).max(2100),
  buyerId: z.string().min(1, "Choose who bought it"),
  description: z.string().trim().min(1, "Say what the present is").max(200),
  cost: z.string().trim().min(1, "Enter the cost"),
  note: z.string().trim().max(500).optional(),
  recipientIds: z.array(z.string().min(1)).min(1, "Choose who it's for").max(20),
});

export async function saveGift(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const parsed = GiftSchema.safeParse({
    id: formData.get("id") || undefined,
    year: formData.get("year"),
    buyerId: formData.get("buyerId"),
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

  // Cross-check IDs from the form against the database.
  const recipientIds = [...new Set(data.recipientIds)];
  const [buyer, people] = await Promise.all([
    prisma.household.findUnique({ where: { id: data.buyerId }, select: { id: true } }),
    prisma.person.findMany({ where: { id: { in: recipientIds } }, select: { id: true, name: true, householdId: true } }),
  ]);
  if (!buyer) return { error: "Unknown household." };
  if (people.length !== recipientIds.length) return { error: "Unknown recipient." };
  const ownMembers = invalidRecipientIds(buyer.id, recipientIds, new Map(people.map((p) => [p.id, p])));
  if (ownMembers.length > 0) {
    const names = people.filter((p) => ownMembers.includes(p.id)).map((p) => p.name).join(", ");
    return { error: `${names} is in the buying household — presents for your own household aren't shared.` };
  }

  const fields = {
    year: data.year,
    buyerId: buyer.id,
    description: data.description,
    costCents,
    note: data.note ?? null,
  };

  if (data.id) {
    const existing = await prisma.gift.findUnique({ where: { id: data.id }, select: { id: true } });
    if (!existing) return { error: "That present no longer exists." };
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
  const session = await getSession();
  if (!session) redirect("/login");
  const id = z.string().min(1).parse(formData.get("id"));
  const gift = await prisma.gift.findUnique({ where: { id }, select: { year: true } });
  if (gift) await prisma.gift.delete({ where: { id } });
  revalidatePath("/");
  redirect(`/?year=${gift?.year ?? ""}`);
}
