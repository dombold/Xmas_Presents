// Pure permission rules, shared by pages and server actions.

export type Viewer = { personId: string; householdId: string | null; isAdmin: boolean };

/** The person who added a present can change it; so can an admin. */
export function canEditGift(gift: { enteredById: string | null }, viewer: Viewer): boolean {
  return viewer.isAdmin || (gift.enteredById !== null && gift.enteredById === viewer.personId);
}
