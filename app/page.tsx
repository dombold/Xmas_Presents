import { Suspense } from "react";
import Link from "next/link";
import ChristmasCountdown from "@/components/ChristmasCountdown";
import Snowfall from "@/components/Snowfall";
import { requireSession } from "@/lib/session";
import { loadFamily, loadGifts, loadSettlements, loadYears } from "@/lib/queries";
import SettleToggle from "@/components/SettleToggle";
import YearSelect from "@/components/YearSelect";
import { formatMoney, isHiddenFrom, settleUp, summarise } from "@/lib/split";
import { canEditGift } from "@/lib/permissions";
import { currentYear, parseYear } from "@/lib/years";

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <>
      <section className="relative overflow-hidden bg-accent text-white">
        <Snowfall />
        <div className="relative mx-auto max-w-5xl px-4 py-10">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Christmas Presents</h1>
          <p className="mt-2 text-white/85">
            Add what you&apos;ve bought and the costs are shared out between households automatically.
          </p>
          <ChristmasCountdown />
        </div>
      </section>
      <Suspense fallback={<p className="mx-auto max-w-5xl px-4 py-10 text-muted">Loading presents…</p>}>
        <Tracker searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Tracker({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const session = await requireSession();
  const year = parseYear((await searchParams).year);
  const [{ households, people }, gifts, years, settlements] = await Promise.all([
    loadFamily(),
    loadGifts(year),
    loadYears(currentYear()),
    loadSettlements(year),
  ]);

  // Money is always worked out from every present; only the list hides presents for your household.
  const summary = summarise(gifts, households, people);
  // A tick only counts while the payment's amount is unchanged.
  const transfers = settleUp(summary).map((t) => ({
    ...t,
    settled: settlements.get(`${t.fromId}:${t.toId}`) === t.amountCents,
  }));
  const allSettled = transfers.length > 0 && transfers.every((t) => t.settled);
  const totalSpentCents = gifts.reduce((sum, g) => sum + g.costCents, 0);
  const householdName = new Map(households.map((h) => [h.id, h.name]));
  const personName = new Map(people.map((p) => [p.id, p.name]));
  const peopleById = new Map(people.map((p) => [p.id, p]));
  const visibleGifts = gifts.filter((g) => !isHiddenFrom(g.recipientIds, session.householdId, peopleById));

  // Per-recipient tally: how much has been spent on each person this year.
  const received = new Map<string, { count: number; cents: number }>();
  for (const g of gifts) {
    for (const pid of g.recipientIds) {
      const r = received.get(pid) ?? { count: 0, cents: 0 };
      r.count++;
      r.cents += g.costCents / g.recipientIds.length;
      received.set(pid, r);
    }
  }
  const groups = [
    ...households.map((h) => ({
      label: h.name,
      own: h.id === session.householdId,
      isHousehold: true,
      members: people.filter((p) => p.householdId === h.id),
    })),
    {
      label: "Everyone shares",
      own: false,
      isHousehold: false,
      // Retired recipients (e.g. from years ago) only show in years they received something.
      members: people.filter((p) => p.householdId === null && (!p.retired || received.has(p.id))),
    },
  ].filter((g) => g.members.length > 0);

  return (
    <div className="mx-auto max-w-5xl space-y-12 px-4 py-10">
      {/* Year + actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <YearSelect years={years} year={year} />
        <Link href={`/presents/new?year=${year}`} className="btn-primary">
          + Add a Present
        </Link>
      </div>

      {/* Balances */}
      <section aria-labelledby="balances">
        <h2 id="balances" className="mb-4 text-2xl font-bold">
          Balances {year}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summary.map((s) => (
            <div key={s.householdId} className="card p-5">
              <h3 className="font-semibold">{s.name}</h3>
              <dl className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">Spent</dt>
                  <dd className="tabular-nums">{formatMoney(s.spentCents)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Their share</dt>
                  <dd className="tabular-nums">{formatMoney(s.shareCents)}</dd>
                </div>
                <div className="flex justify-between border-t border-border pt-2 font-semibold">
                  <dt>{s.balanceCents > 0 ? "Is owed" : s.balanceCents < 0 ? "Owes" : "Square"}</dt>
                  <dd className={`tabular-nums ${s.balanceCents > 0 ? "text-accent" : s.balanceCents < 0 ? "text-primary" : ""}`}>
                    {formatMoney(Math.abs(s.balanceCents))}
                  </dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </section>

      {/* Who has a present */}
      <section aria-labelledby="recipients">
        <h2 id="recipients" className="mb-4 text-2xl font-bold">
          Who&apos;s covered
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <div key={g.label} className="card p-5">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
                {g.label}
                {g.own ? " (yours)" : ""}
              </h3>
              {/* Parents, then a dividing line, then their kids. */}
              {[g.members.filter((p) => p.canLogin || !g.isHousehold), g.members.filter((p) => !p.canLogin && g.isHousehold)]
                .filter((list) => list.length > 0)
                .map((list, i) => (
                  <ul key={i} className={`space-y-2 text-sm ${i > 0 ? "mt-3 border-t border-border pt-3" : ""}`}>
                    {list.map((p) => {
                      const r = received.get(p.id);
                      return (
                        <li key={p.id} className="flex items-center justify-between gap-2">
                          <span>
                            <span aria-hidden>{r ? "✅" : "⬜"}</span> {p.name}
                          </span>
                          {/* Your own household: ticks only — no amounts or counts. */}
                          {!g.own && (
                            <span className={`tabular-nums ${r ? "" : "text-muted"}`}>
                              {r ? `${formatMoney(Math.round(r.cents))}${r.count > 1 ? ` (${r.count})` : ""}` : "Not yet"}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ))}
            </div>
          ))}
        </div>
      </section>

      {/* Settle up */}
      <section aria-labelledby="settle">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h2 id="settle" className="text-2xl font-bold">
            Settle up
          </h2>
          {allSettled && (
            <span className="rounded-full bg-accent px-3 py-1 text-sm font-semibold text-white">✓ Settled up</span>
          )}
        </div>
        {transfers.length === 0 ? (
          <p className="text-muted">Everyone is square{gifts.length === 0 ? " — no presents added yet" : ""}.</p>
        ) : (
          <>
            {!allSettled && (
              <p className="mb-3 text-sm text-muted">The household being paid ticks each payment once it arrives.</p>
            )}
            <ul className={`card divide-y divide-border ${allSettled ? "border-accent" : ""}`}>
              {transfers.map((t) => (
                <li key={`${t.fromId}-${t.toId}`} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 p-4">
                  <span className={t.settled ? "text-muted" : ""}>
                    <strong>{t.fromName}</strong> pays <strong>{t.toName}</strong>{" "}
                    <span className="font-semibold tabular-nums">{formatMoney(t.amountCents)}</span>
                  </span>
                  <SettleToggle
                    year={year}
                    fromId={t.fromId}
                    toId={t.toId}
                    settled={t.settled}
                    canTick={session.householdId === t.toId || session.isAdmin}
                    payee={t.toName}
                  />
                </li>
              ))}
            </ul>
          </>
        )}
        {gifts.length > 0 && (
          <p className="mt-4 flex justify-between gap-4 border-t-2 border-border pt-3 font-semibold">
            <span>Total spent on presents in {year}</span>
            <span className="tabular-nums">{formatMoney(totalSpentCents)}</span>
          </p>
        )}
      </section>

      {/* Present list */}
      <section aria-labelledby="presents">
        <h2 id="presents" className="mb-4 text-2xl font-bold">
          All presents {year}
        </h2>
        {session.householdId && (
          <p className="mb-4 text-sm text-muted">Presents for your own household are hidden so they stay a surprise.</p>
        )}
        {visibleGifts.length === 0 ? (
          <p className="text-muted">
            No presents to show yet.{" "}
            <Link href={`/presents/new?year=${year}`} className="font-semibold text-primary underline">
              Add the first one
            </Link>
            .
          </p>
        ) : (
          <ul className="card divide-y divide-border">
            {visibleGifts.map((g) => (
              <li key={g.id} className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {g.recipientIds.map((id) => personName.get(id)).join(" & ")}
                    <span className="font-normal text-muted"> — {g.description}</span>
                  </p>
                  <p className="text-sm text-muted">
                    Bought by {householdName.get(g.buyerId)}
                    {g.enteredBy ? ` · added by ${g.enteredBy.name}` : ""}
                    {g.note ? ` · ${g.note}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold tabular-nums">{formatMoney(g.costCents)}</span>
                  {canEditGift(g, session) && (
                    <Link href={`/presents/${g.id}/edit`} className="text-sm font-medium text-primary hover:underline">
                      Edit
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
