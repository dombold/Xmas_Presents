// Reads data/family.json (gitignored — real names). Used by the seed and by pages that show
// family-specific text (e.g. spending limits) so no names live in the code.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";

export const FamilySchema = z.object({
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
  /** Shared recipients from earlier years who aren't bought for any more (kept for past years). */
  pastShared: z.array(z.string().min(1)).default([]),
  /** Shared recipients who can sign in: they add presents they pay for themselves (never split)
   *  so nobody buys the same thing twice, and see the present list but not the balances. */
  sharedLogins: z.array(z.string().min(1)).default([]),
  /** Adults who can edit or delete any present they can see. */
  admins: z.array(z.string().min(1)).default([]),
  /** Shown on the Guide page. */
  spendingLimits: z.array(z.object({ who: z.string().min(1), amount: z.number().positive() })).default([]),
});

export type Family = z.infer<typeof FamilySchema>;

/** data/family.json relative to the app root (PM2 and npm scripts run from there). */
export const FAMILY_FILE = join(process.cwd(), "data", "family.json");

export function readFamilyFile(): Family | null {
  if (!existsSync(FAMILY_FILE)) return null;
  return FamilySchema.parse(JSON.parse(readFileSync(FAMILY_FILE, "utf8")));
}
