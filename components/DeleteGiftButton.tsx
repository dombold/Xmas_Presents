"use client";

import { deleteGift } from "@/app/actions";

export default function DeleteGiftButton({ id }: { id: string }) {
  return (
    <form
      action={deleteGift}
      onSubmit={(e) => {
        if (!confirm("Delete this present? This can't be undone.")) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="text-sm font-medium text-primary hover:underline">
        Delete this present
      </button>
    </form>
  );
}
