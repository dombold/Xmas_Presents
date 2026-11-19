import "server-only";
import { prisma } from "@/lib/prisma";
import { settleUp, summarise } from "@/lib/split";

export async function loadFamily() {
  const [households, people] = await Promise.all([
    prisma.household.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    prisma.person.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, householdId: true, canLogin: true, retired: true },
    }),
  ]);
  return { households, people };
}

export async function loadGifts(year: number) {
  const gifts = await prisma.gift.findMany({
    where: { year },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      buyerId: true,
      description: true,
      costCents: true,
      note: true,
      enteredById: true,
      enteredBy: { select: { name: true } },
      recipients: { select: { personId: true } },
    },
  });
  return gifts.map(({ recipients, ...g }) => ({ ...g, recipientIds: recipients.map((r) => r.personId) }));
}

/** Payments ticked as received for a year, keyed "fromId:toId" → amount ticked. */
export async function loadSettlements(year: number) {
  const rows = await prisma.settlement.findMany({
    where: { year },
    select: { fromHouseholdId: true, toHouseholdId: true, amountCents: true },
  });
  return new Map(rows.map((r) => [`${r.fromHouseholdId}:${r.toHouseholdId}`, r.amountCents]));
}

/** The year's "Settle up" payments, worked out from its presents. */
export async function loadTransfers(year: number) {
  const [{ households, people }, gifts] = await Promise.all([loadFamily(), loadGifts(year)]);
  return settleUp(summarise(gifts, households, people));
}

export type LoadedGift = Awaited<ReturnType<typeof loadGifts>>[number];

/** Years that have presents, plus the current year, newest first. */
export async function loadYears(currentYear: number) {
  const rows = await prisma.gift.findMany({ distinct: ["year"], select: { year: true } });
  return [...new Set([currentYear, ...rows.map((r) => r.year)])].sort((a, b) => b - a);
}
