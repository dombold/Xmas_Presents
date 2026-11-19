import type { Metadata } from "next";
import PageHeading from "@/components/PageHeading";

export const metadata: Metadata = { title: "How it works" };

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <PageHeading title="How it works" intro="The same rules as the family spreadsheet." />
      <div className="space-y-6 leading-relaxed">
        <section className="card p-6">
          <h2 className="text-lg font-semibold">1. Add what you bought</h2>
          <p className="mt-2">
            Each present is entered against the household that paid for it. If one present is for more than one person
            (say, a couple), tick them all — the cost is split evenly between them.
          </p>
        </section>
        <section className="card p-6">
          <h2 className="text-lg font-semibold">2. Who pays for whom</h2>
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
        <section className="card p-6">
          <h2 className="text-lg font-semibold">3. Balances and settling up</h2>
          <p className="mt-2">
            Each household&apos;s balance is what it <em>spent</em> minus its <em>share</em>. A positive balance means the
            household is owed money; a negative one means it owes. The balances always add up to zero, and the
            “Settle up” list shows the fewest payments needed to square everyone up.
          </p>
        </section>
      </div>
    </div>
  );
}
