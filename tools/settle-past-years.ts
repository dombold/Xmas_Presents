// Marks every "Settle up" payment as received for all years before this one.
// Safe to re-run; it refreshes amounts if past presents were changed.
//   npm run settle:past
import "dotenv/config";
import { prisma } from "../lib/prisma";
import { settleUp, summarise } from "../lib/split";

async function main() {
  const thisYear = new Date().getFullYear();
  const [households, people, gifts] = await Promise.all([
    prisma.household.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    prisma.person.findMany({ select: { id: true, name: true, householdId: true } }),
    prisma.gift.findMany({
      where: { year: { lt: thisYear } },
      select: { year: true, buyerId: true, costCents: true, recipients: { select: { personId: true } } },
    }),
  ]);
  const years = [...new Set(gifts.map((g) => g.year))].sort();
  for (const year of years) {
    const yearGifts = gifts
      .filter((g) => g.year === year)
      .map((g) => ({ buyerId: g.buyerId, costCents: g.costCents, recipientIds: g.recipients.map((r) => r.personId) }));
    const transfers = settleUp(summarise(yearGifts, households, people));
    await prisma.$transaction([
      prisma.settlement.deleteMany({ where: { year } }),
      prisma.settlement.createMany({
        data: transfers.map((t) => ({ year, fromHouseholdId: t.fromId, toHouseholdId: t.toId, amountCents: t.amountCents })),
      }),
    ]);
    console.log(`${year}: ${transfers.length} payment(s) marked as settled.`);
  }
}

main().finally(() => prisma.$disconnect());
