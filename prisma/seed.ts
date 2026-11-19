// Creates / updates households and people from data/family.json (gitignored — real names).
// Safe to re-run: matches on name, never deletes.
// First time: cp prisma/family.example.json data/family.json and edit it.
import "dotenv/config";
import { prisma } from "../lib/prisma";
import { FAMILY_FILE, readFamilyFile } from "../lib/familyFile";

async function main() {
  const family = readFamilyFile();
  if (!family) {
    console.warn(`${FAMILY_FILE} not found — skipping seed. Copy prisma/family.example.json to create it.`);
    return;
  }
  const adults = new Set(family.households.flatMap((h) => h.adults));
  const unknownAdmins = family.admins.filter((a) => !adults.has(a));
  if (unknownAdmins.length > 0) throw new Error(`"admins" must be adults in a household: ${unknownAdmins.join(", ")}`);
  const admins = new Set(family.admins);

  let order = 0;
  for (const [hi, h] of family.households.entries()) {
    const household = await prisma.household.upsert({
      where: { name: h.name },
      update: { sortOrder: hi },
      create: { name: h.name, sortOrder: hi },
      select: { id: true },
    });
    const members = [
      ...h.adults.map((name) => ({ name, canLogin: true, isAdmin: admins.has(name) })),
      ...h.kids.map((name) => ({ name, canLogin: false, isAdmin: false })),
    ];
    for (const m of members) {
      // PINs are never touched by the seed.
      const fields = { householdId: household.id, canLogin: m.canLogin, isAdmin: m.isAdmin, retired: false, sortOrder: order };
      await prisma.person.upsert({ where: { name: m.name }, update: fields, create: { name: m.name, ...fields } });
      order++;
    }
  }
  const shared = [
    ...family.shared.map((name) => ({ name, retired: false })),
    ...family.pastShared.map((name) => ({ name, retired: true })),
  ];
  for (const { name, retired } of shared) {
    const fields = { householdId: null, canLogin: false, isAdmin: false, retired, sortOrder: order };
    await prisma.person.upsert({ where: { name }, update: fields, create: { name, ...fields } });
    order++;
  }
  const [households, people] = await Promise.all([prisma.household.count(), prisma.person.count()]);
  console.log(`Seeded ${households} households, ${people} people, ${admins.size} admin(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
