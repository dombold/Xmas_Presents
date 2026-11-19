import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import GiftForm from "@/components/GiftForm";
import DeleteGiftButton from "@/components/DeleteGiftButton";
import PageHeading from "@/components/PageHeading";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { loadFamily } from "@/lib/queries";

export const metadata: Metadata = { title: "Edit present" };

export default function EditPresentPage({ params }: PageProps<"/presents/[id]/edit">) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <PageHeading title="Edit present" />
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <EditPresent params={params} />
      </Suspense>
    </div>
  );
}

async function EditPresent({ params }: { params: PageProps<"/presents/[id]/edit">["params"] }) {
  await requireSession();
  const { id } = await params;
  const [gift, { households, people }] = await Promise.all([
    prisma.gift.findUnique({
      where: { id },
      select: {
        id: true,
        year: true,
        buyerId: true,
        description: true,
        costCents: true,
        note: true,
        recipients: { select: { personId: true } },
      },
    }),
    loadFamily(),
  ]);
  if (!gift) notFound();
  const { recipients, year, ...rest } = gift;

  return (
    <div className="space-y-10">
      <GiftForm
        households={households}
        people={people}
        year={year}
        defaultBuyerId={gift.buyerId}
        gift={{ ...rest, recipientIds: recipients.map((r) => r.personId) }}
      />
      <div className="border-t border-border pt-6">
        <DeleteGiftButton id={gift.id} />
      </div>
    </div>
  );
}
