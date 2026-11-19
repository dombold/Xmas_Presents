import type { Metadata } from "next";
import { Suspense } from "react";
import PageHeading from "@/components/PageHeading";
import { readFamilyFile } from "@/lib/familyFile";
import { requireSession } from "@/lib/session";
import { formatMoney } from "@/lib/split";

export const metadata: Metadata = { title: "Guide" };

const sections = [
  { id: "adding", icon: "🎁", title: "Adding a present" },
  { id: "limits", icon: "💰", title: "Spending limits" },
  { id: "sharing", icon: "🤝", title: "Who pays for whom" },
  { id: "settling", icon: "⚖️", title: "Balances and settling up" },
  { id: "surprise", icon: "🤫", title: "Keeping it a surprise" },
  { id: "install", icon: "📲", title: "Add it to your phone" },
];

function Heading({ id }: { id: string }) {
  const s = sections.find((x) => x.id === id)!;
  return (
    <h2 className="flex items-center gap-2 text-lg font-semibold">
      <span aria-hidden>{s.icon}</span> {s.title}
    </h2>
  );
}

// Limits mention family names, so they come from the gitignored data/family.json.
async function SpendingLimits() {
  await requireSession();
  const limits = readFamilyFile()?.spendingLimits ?? [];
  if (limits.length === 0) return null;
  return (
    <section id="limits" className="card scroll-mt-6 p-6">
      <Heading id="limits" />
      <ul className="mt-3 divide-y divide-border">
        {limits.map((l) => (
          <li key={l.who} className="flex items-center justify-between gap-4 py-2">
            <span>{l.who}</span>
            <span className="font-semibold tabular-nums">{formatMoney(Math.round(l.amount * 100))}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <PageHeading title="Guide" intro="The same rules as the family spreadsheet." />

      <nav aria-label="On this page" className="card mb-6 p-4">
        <ul className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          {sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="font-medium hover:text-primary">
                <span aria-hidden>{s.icon}</span> {s.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-6 leading-relaxed">
        <section id="adding" className="card scroll-mt-6 p-6">
          <Heading id="adding" />
          <p className="mt-2">
            Add each present your household has bought — who it&apos;s for, what it is and what it cost. If one present
            is for more than one person (say, a couple), tick them all and the cost is split evenly between them.
          </p>
        </section>

        <Suspense fallback={null}>
          <SpendingLimits />
        </Suspense>

        <section id="sharing" className="card scroll-mt-6 p-6">
          <Heading id="sharing" />
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>
              A present for someone in a household — a sibling, partner or one of the kids — is shared equally by{" "}
              <strong>all the other households</strong>. You never pay towards presents for your own household.
            </li>
            <li>
              A present for someone outside the households (like the grandparents) is shared equally by{" "}
              <strong>every household</strong>.
            </li>
            <li>The household that bought the present pays its share too, like everyone else.</li>
          </ul>
        </section>

        <section id="settling" className="card scroll-mt-6 p-6">
          <Heading id="settling" />
          <p className="mt-2">
            Each household&apos;s balance is what it <em>spent</em> minus its <em>share</em>. A positive balance means the
            household is owed money; a negative one means it owes. The balances always add up to zero, and the
            “Settle up” list shows the fewest payments needed to square everyone up.
          </p>
        </section>

        <section id="surprise" className="card scroll-mt-6 p-6">
          <Heading id="surprise" />
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>
              The first time you sign in you use the family PIN, then choose your own. After that only your own PIN
              works for you.
            </li>
            <li>Presents bought for anyone in your household are hidden from you — you&apos;ll just see a tick.</li>
            <li>Only the person who added a present (or the site admin) can change or delete it.</li>
            <li>Forgotten your PIN? Ask the site admin to reset it.</li>
          </ul>
        </section>

        <section id="install" className="card scroll-mt-6 p-6">
          <Heading id="install" />
          <p className="mt-2">
            Add Xmas Presents to your home screen and it works like a regular app: full screen, no browser bar, and one
            tap to open.
          </p>
          <div className="mt-4 space-y-3">
            <div className="rounded-lg bg-background p-4">
              <p className="mb-1 font-semibold">Android (Chrome)</p>
              <ol className="list-inside list-decimal space-y-1 text-muted">
                <li>Open Xmas Presents in Chrome.</li>
                <li>
                  Tap the <strong className="text-foreground">⋮</strong> menu in the top-right corner.
                </li>
                <li>
                  Tap <strong className="text-foreground">Add to Home screen</strong> (or{" "}
                  <strong className="text-foreground">Install app</strong>).
                </li>
                <li>
                  Tap <strong className="text-foreground">Add</strong> to confirm.
                </li>
              </ol>
            </div>
            <div className="rounded-lg bg-background p-4">
              <p className="mb-1 font-semibold">iPhone / iPad (Safari)</p>
              <ol className="list-inside list-decimal space-y-1 text-muted">
                <li>Open Xmas Presents in Safari.</li>
                <li>
                  Tap the <strong className="text-foreground">Share</strong> button (the box with an arrow pointing up)
                  at the bottom of the screen.
                </li>
                <li>
                  Scroll down and tap <strong className="text-foreground">Add to Home Screen</strong>.
                </li>
                <li>
                  Tap <strong className="text-foreground">Add</strong> in the top-right corner.
                </li>
              </ol>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
