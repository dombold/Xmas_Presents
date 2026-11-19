// Cost-sharing rules — a faithful port of the family spreadsheet
// it replaces, with joint presents split automatically.
//
// 1. A present's cost is divided equally between its recipients.
// 2. Each recipient's portion is paid by:
//    - every household EXCEPT the recipient's own, if the recipient belongs to a household
//      (siblings, partners and their kids), or
//    - every household, if the recipient has no household (e.g. grandparents).
// 3. The buying household pays its share like everyone else.
// 4. Balance = spent − share. Positive means the household is owed money.
//
// Pure module: no DB or React imports, so server pages, actions and client forms
// all compute the same numbers.

export type HouseholdRef = { id: string; name: string };
export type PersonRef = { id: string; name: string; householdId: string | null };
export type GiftRef = { buyerId: string; costCents: number; recipientIds: string[] };

export type HouseholdSummary = {
  householdId: string;
  name: string;
  spentCents: number;
  shareCents: number;
  balanceCents: number; // spent − share; > 0 is owed, < 0 owes
};

export type Transfer = { fromId: string; fromName: string; toId: string; toName: string; amountCents: number };

/**
 * Exact (fractional-cent) share each household pays for one present.
 * Households that pay nothing are absent from the map.
 */
export function giftShares(
  gift: Pick<GiftRef, "costCents" | "recipientIds">,
  households: HouseholdRef[],
  peopleById: Map<string, PersonRef>,
): Map<string, number> {
  const shares = new Map<string, number>();
  if (gift.recipientIds.length === 0 || households.length === 0) return shares;
  const perRecipient = gift.costCents / gift.recipientIds.length;

  for (const recipientId of gift.recipientIds) {
    const recipient = peopleById.get(recipientId);
    if (!recipient) throw new Error(`Unknown recipient ${recipientId}`);
    const payers = recipient.householdId
      ? households.filter((h) => h.id !== recipient.householdId)
      : households;
    if (payers.length === 0) continue;
    const each = perRecipient / payers.length;
    for (const h of payers) shares.set(h.id, (shares.get(h.id) ?? 0) + each);
  }
  return shares;
}

/**
 * Recipients the buying household is not allowed to choose: its own members.
 * (In the spreadsheet a cost entered against your own household counted as spending
 * but was never charged to anyone, silently giving you credit.)
 */
export function invalidRecipientIds(buyerId: string, recipientIds: string[], peopleById: Map<string, PersonRef>) {
  return recipientIds.filter((id) => peopleById.get(id)?.householdId === buyerId);
}

/** Round fractional-cent amounts to whole cents while keeping their exact total (largest remainder). */
function roundPreservingTotal(values: number[]): number[] {
  const total = Math.round(values.reduce((a, b) => a + b, 0));
  const floors = values.map((v) => Math.floor(v + 1e-9));
  let remainder = total - floors.reduce((a, b) => a + b, 0);
  const order = values
    .map((v, i) => ({ i, frac: v - floors[i] }))
    .sort((a, b) => b.frac - a.frac);
  for (const { i } of order) {
    if (remainder <= 0) break;
    floors[i] += 1;
    remainder -= 1;
  }
  return floors;
}

export function summarise(gifts: GiftRef[], households: HouseholdRef[], people: PersonRef[]): HouseholdSummary[] {
  const peopleById = new Map(people.map((p) => [p.id, p]));
  const spent = new Map<string, number>();
  const share = new Map<string, number>();

  for (const g of gifts) {
    spent.set(g.buyerId, (spent.get(g.buyerId) ?? 0) + g.costCents);
    for (const [hid, amount] of giftShares(g, households, peopleById)) {
      share.set(hid, (share.get(hid) ?? 0) + amount);
    }
  }

  const roundedShares = roundPreservingTotal(households.map((h) => share.get(h.id) ?? 0));
  return households.map((h, i) => {
    const spentCents = spent.get(h.id) ?? 0;
    return {
      householdId: h.id,
      name: h.name,
      spentCents,
      shareCents: roundedShares[i],
      balanceCents: spentCents - roundedShares[i],
    };
  });
}

/** Who pays whom to settle up: largest debtor pays largest creditor until everyone is square. */
export function settleUp(summary: HouseholdSummary[]): Transfer[] {
  const debtors = summary
    .filter((s) => s.balanceCents < 0)
    .map((s) => ({ ...s, left: -s.balanceCents }))
    .sort((a, b) => b.left - a.left);
  const creditors = summary
    .filter((s) => s.balanceCents > 0)
    .map((s) => ({ ...s, left: s.balanceCents }))
    .sort((a, b) => b.left - a.left);

  const transfers: Transfer[] = [];
  let d = 0;
  let c = 0;
  while (d < debtors.length && c < creditors.length) {
    const amount = Math.min(debtors[d].left, creditors[c].left);
    if (amount > 0) {
      transfers.push({
        fromId: debtors[d].householdId,
        fromName: debtors[d].name,
        toId: creditors[c].householdId,
        toName: creditors[c].name,
        amountCents: amount,
      });
    }
    debtors[d].left -= amount;
    creditors[c].left -= amount;
    if (debtors[d].left === 0) d++;
    if (creditors[c].left === 0) c++;
  }
  return transfers;
}

export function formatMoney(cents: number): string {
  const sign = cents < 0 ? "−" : "";
  return `${sign}$${(Math.abs(cents) / 100).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Parse a user-entered dollar amount ("12", "12.5", "$1,200.00") into whole cents, or null. */
export function parseDollars(input: string): number | null {
  const cleaned = input.replace(/[$,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  return Math.round(Number(cleaned) * 100);
}
