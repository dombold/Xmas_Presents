import type { Metadata } from "next";
import { Suspense } from "react";
import GiftForm from "@/components/GiftForm";
import PageHeading from "@/components/PageHeading";
import { requireSession } from "@/lib/session";
import { loadFamily } from "@/lib/queries";
import { parseYear } from "@/lib/years";

export const metadata: Metadata = { title: "Add a present" };

export default function NewPresentPage({ searchParams }: PageProps<"/presents/new">) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <PageHeading title="Add a present" intro="Enter something you've bought — the cost is shared out automatically." />
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <NewPresent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function NewPresent({ searchParams }: { searchParams: PageProps<"/presents/new">["searchParams"] }) {
  const session = await requireSession();
  const year = parseYear((await searchParams).year);
  const { households, people } = await loadFamily();
  return (
    <GiftForm
      households={households}
      people={people}
      year={year}
      defaultBuyerId={session.householdId ?? households[0]?.id ?? ""}
    />
  );
}
