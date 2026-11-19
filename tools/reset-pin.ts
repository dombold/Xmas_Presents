// Forgotten PIN: clears a person's PIN and signs out their sessions.
// They then sign in with the family PIN and choose a new one.
//   npm run pin:reset -- "Name"
import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  const name = process.argv[2];
  if (!name) {
    console.error('Usage: npm run pin:reset -- "Name"');
    process.exit(1);
  }
  const person = await prisma.person.findUnique({ where: { name }, select: { id: true, canLogin: true } });
  if (!person?.canLogin) {
    const names = await prisma.person.findMany({ where: { canLogin: true }, select: { name: true }, orderBy: { sortOrder: "asc" } });
    console.error(`No one called "${name}" can sign in. Choose one of: ${names.map((n) => n.name).join(", ")}`);
    process.exit(1);
  }
  await prisma.person.update({ where: { id: person.id }, data: { pinHash: null, sessionVersion: { increment: 1 } } });
  console.log(`PIN reset for ${name}. They can sign in with the family PIN and choose a new one.`);
}

main().finally(() => prisma.$disconnect());
