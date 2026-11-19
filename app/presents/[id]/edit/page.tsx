import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import GiftForm from "@/components/GiftForm";
import DeleteGiftButton from "@/components/DeleteGiftButton";
import PageHeading from "@/components/PageHeading";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { loadFamily } from "@/lib/queries";
import { canEditGift } from "@/lib/permissions";
import { isHiddenFrom } from "@/lib/split";

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
  const session = await requireSession();
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
        enteredById: true,
        enteredBy: { select: { name: true } },
        recipients: { select: { personId: true } },
      },
    }),
    loadFamily(),
  ]);
  if (!gift) notFound();
  const recipientIds = gift.recipients.map((r) => r.personId);

  // Presents for your own household don't exist as far as you're concerned — admins included.
  if (isHiddenFrom(recipientIds, session.householdId, new Map(people.map((p) => [p.id, p])))) notFound();

  const back = (
    <Link href={`/?year=${gift.year}`} className="btn-secondary mt-6">
      Back to presents
    </Link>
  );
  if (!canEditGift(gift, session)) {
    return (
      <div>
        <p>
          {gift.enteredBy
            ? `Only ${gift.enteredBy.name} can edit this present.`
            : "This present can't be edited."}
        </p>
        {back}
      </div>
    );
  }

  const editingAsAdmin = gift.enteredById !== session.personId;
  return (
    <div className="space-y-10">
      {editingAsAdmin && (
        <p className="card border-gold p-4 text-sm">
          You&apos;re editing {gift.enteredBy ? `${gift.enteredBy.name}'s` : "an imported"} present as admin.
        </p>
      )}
      <GiftForm
        households={households}
        people={people.filter((p) => !p.retired || recipientIds.includes(p.id))}
        year={gift.year}
        buyerId={gift.buyerId}
        viewerHouseholdId={session.householdId}
        gift={{
          id: gift.id,
          description: gift.description,
          costCents: gift.costCents,
          note: gift.note,
          recipientIds,
        }}
      />
      <div className="border-t border-border pt-6">
        <DeleteGiftButton id={gift.id} />
      </div>
    </div>
  );
}
