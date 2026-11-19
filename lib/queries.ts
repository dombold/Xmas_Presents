import "server-only";
import { prisma } from "@/lib/prisma";

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

export type LoadedGift = Awaited<ReturnType<typeof loadGifts>>[number];

/** Years that have presents, plus the current year, newest first. */
export async function loadYears(currentYear: number) {
  const rows = await prisma.gift.findMany({ distinct: ["year"], select: { year: true } });
  return [...new Set([currentYear, ...rows.map((r) => r.year)])].sort((a, b) => b - a);
}
