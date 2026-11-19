# Xmas Presents

Track the family's Christmas presents and share the costs fairly between households.

- A present for someone in a household is shared by all the **other** households.
- A present for someone outside the households (e.g. grandparents) is shared by **every** household.
- Joint presents are split between their recipients. The rules live in `lib/split.ts`.

Next.js 16 · Prisma 7 · PostgreSQL. Sign-in is choose-your-name + a shared family PIN.

## Setup

```bash
npm install
cp .env.example .env                                   # set DATABASE_URL, FAMILY_PIN, SESSION_SECRET
cp prisma/family.example.json data/family.json         # put in real names (gitignored)
npx prisma migrate deploy
npm run db:seed
npm run dev
```

`data/family.json` is kept out of git so the family's names aren't committed. To add a new
partner or child, edit it and re-run `npm run db:seed` (it adds and updates people and never deletes them).

## PINs and admins

Everyone signs in the first time with `FAMILY_PIN` and then has to choose their own PIN.
Presents for a person's household are hidden from that household. Only the person who added a
present, or an admin (`"admins"` in `data/family.json`), can edit it.

Forgotten PIN (run on the server): `npm run pin:reset -- "Name"`. That person then signs in
with the family PIN again and chooses a new one.
