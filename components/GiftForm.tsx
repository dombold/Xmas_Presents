"use client";

import { startTransition, useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { saveGift } from "@/app/actions";
import { formatMoney, giftShares, parseDollars, type HouseholdRef, type PersonRef } from "@/lib/split";

type Props = {
  households: HouseholdRef[];
  people: PersonRef[];
  year: number;
  defaultBuyerId: string;
  gift?: {
    id: string;
    buyerId: string;
    description: string;
    costCents: number;
    note: string | null;
    recipientIds: string[];
  };
};

export default function GiftForm({ households, people, year, defaultBuyerId, gift }: Props) {
  const [state, action, pending] = useActionState(saveGift, undefined);
  const [buyerId, setBuyerId] = useState(gift?.buyerId ?? defaultBuyerId);
  const [recipientIds, setRecipientIds] = useState<string[]>(gift?.recipientIds ?? []);
  const [cost, setCost] = useState(gift ? (gift.costCents / 100).toFixed(2) : "");
  // All fields are controlled so they survive React's form reset when the server returns an error.
  const [description, setDescription] = useState(gift?.description ?? "");
  const [note, setNote] = useState(gift?.note ?? "");

  const peopleById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);
  const groups = [
    ...households.map((h) => ({ id: h.id, label: h.name, members: people.filter((p) => p.householdId === h.id) })),
    { id: "shared", label: "Everyone shares", members: people.filter((p) => p.householdId === null) },
  ].filter((g) => g.members.length > 0);

  function changeBuyer(id: string) {
    setBuyerId(id);
    // Drop anyone who is now in the buying household.
    setRecipientIds((ids) => ids.filter((pid) => peopleById.get(pid)?.householdId !== id));
  }

  function toggle(id: string) {
    setRecipientIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

  const costCents = parseDollars(cost);
  const preview =
    costCents && recipientIds.length > 0 ? giftShares({ costCents, recipientIds }, households, peopleById) : null;

  return (
    <form
      // Submitted via onSubmit (not the action prop) so React doesn't reset the fields when the server returns an error.
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
      className="space-y-8">
      {gift && <input type="hidden" name="id" value={gift.id} />}
      <input type="hidden" name="year" value={year} />

      <div>
        <label htmlFor="buyerId" className="block font-semibold">
          Who bought it?
        </label>
        <select id="buyerId" name="buyerId" value={buyerId} onChange={(e) => changeBuyer(e.target.value)} className="input mt-2">
          {households.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
      </div>

      <fieldset>
        <legend className="font-semibold">Who is it for?</legend>
        <p className="mt-1 text-sm text-muted">
          Tick more than one for a joint present — the cost is split between them. Your own household isn&apos;t
          shared, so it&apos;s greyed out.
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => {
            const own = g.id === buyerId;
            return (
              <div key={g.id} className={`card p-4 ${own ? "opacity-50" : ""}`}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  {g.label}
                  {own ? " (your household)" : ""}
                </p>
                <ul className="space-y-1.5">
                  {g.members.map((p) => (
                    <li key={p.id}>
                      <label className={`flex items-center gap-2 ${own ? "cursor-not-allowed" : "cursor-pointer"}`}>
                        <input
                          type="checkbox"
                          name="recipientIds"
                          value={p.id}
                          checked={recipientIds.includes(p.id)}
                          onChange={() => toggle(p.id)}
                          disabled={own}
                          className="size-4 accent-[var(--primary)]"
                        />
                        {p.name}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="description" className="block font-semibold">
            What is it?
          </label>
          <input
            id="description"
            name="description"
            required
            maxLength={200}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Book voucher"
            className="input mt-2"
          />
        </div>
        <div>
          <label htmlFor="cost" className="block font-semibold">
            Cost ($)
          </label>
          <input
            id="cost"
            name="cost"
            required
            inputMode="decimal"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            placeholder="0.00"
            className="input mt-2"
          />
        </div>
      </div>

      <div>
        <label htmlFor="note" className="block font-semibold">
          Note <span className="font-normal text-muted">(optional)</span>
        </label>
        <input id="note" name="note" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} className="input mt-2" />
      </div>

      <div className="card p-5" aria-live="polite">
        <p className="font-semibold">How this is shared</p>
        {preview ? (
          <ul className="mt-2 space-y-1 text-sm">
            {households.map((h) => (
              <li key={h.id} className="flex justify-between">
                <span>{h.name}</span>
                <span className="tabular-nums">{formatMoney(Math.round(preview.get(h.id) ?? 0))}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted">Choose who it&apos;s for and enter a cost to see the split.</p>
        )}
      </div>

      {state?.error && (
        <p role="alert" className="font-medium text-primary">
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Saving…" : gift ? "Save changes" : "Add present"}
        </button>
        <Link href={`/?year=${year}`} className="btn-secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}
