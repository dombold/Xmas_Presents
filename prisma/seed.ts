// Creates / updates households and people from data/family.json (gitignored — real names).
// Safe to re-run: matches on name, never deletes.
// First time: cp prisma/family.example.json data/family.json and edit it.
import "dotenv/config";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const FamilySchema = z.object({
  households: z
    .array(
      z.object({
        name: z.string().min(1),
        adults: z.array(z.string().min(1)).min(1),
        kids: z.array(z.string().min(1)).default([]),
      }),
    )
    .min(2),
  /** Recipients shared by every household (no household of their own), e.g. grandparents. */
  shared: z.array(z.string().min(1)).default([]),
});

const FAMILY_FILE = join(__dirname, "..", "data", "family.json");

async function main() {
  if (!existsSync(FAMILY_FILE)) {
    console.warn("data/family.json not found — skipping seed. Copy prisma/family.example.json to create it.");
    return;
  }
  const family = FamilySchema.parse(JSON.parse(readFileSync(FAMILY_FILE, "utf8")));

  let order = 0;
  for (const [hi, h] of family.households.entries()) {
    const household = await prisma.household.upsert({
      where: { name: h.name },
      update: { sortOrder: hi },
      create: { name: h.name, sortOrder: hi },
      select: { id: true },
    });
    const members = [...h.adults.map((name) => ({ name, canLogin: true })), ...h.kids.map((name) => ({ name, canLogin: false }))];
    for (const m of members) {
      await prisma.person.upsert({
        where: { name: m.name },
        update: { householdId: household.id, canLogin: m.canLogin, sortOrder: order },
        create: { name: m.name, householdId: household.id, canLogin: m.canLogin, sortOrder: order },
      });
      order++;
    }
  }
  for (const name of family.shared) {
    await prisma.person.upsert({
      where: { name },
      update: { householdId: null, canLogin: false, sortOrder: order },
      create: { name, householdId: null, canLogin: false, sortOrder: order },
    });
    order++;
  }
  const [households, people] = await Promise.all([prisma.household.count(), prisma.person.count()]);
  console.log(`Seeded ${households} households, ${people} people.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
