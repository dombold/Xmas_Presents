"use client";

import { useOptimistic, useState, useTransition } from "react";
import { setSettled } from "@/app/actions";

type Props = { year: number; fromId: string; toId: string; settled: boolean; canTick: boolean; payee: string };

/** The payee ticks a payment once it has arrived; everyone else just sees its status. */
export default function SettleToggle({ year, fromId, toId, settled, canTick, payee }: Props) {
  const [optimistic, setOptimistic] = useOptimistic(settled);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!canTick) {
    return (
      <span className={`text-sm font-medium ${settled ? "text-accent" : "text-muted"}`}>
        {settled ? "✓ Paid" : `Waiting for ${payee} to tick`}
      </span>
    );
  }
  return (
    <span className="flex flex-col items-end gap-1">
      <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={optimistic}
          disabled={pending}
          onChange={(e) => {
            const next = e.target.checked;
            setError(null);
            startTransition(async () => {
              setOptimistic(next);
              const res = await setSettled({ year, fromId, toId, settled: next });
              if (res?.error) setError(res.error);
            });
          }}
          className="h-5 w-5 accent-[var(--accent)]"
        />
        {optimistic ? "Received" : "Tick when received"}
      </label>
      {error && (
        <span role="alert" className="text-xs text-primary">
          {error}
        </span>
      )}
    </span>
  );
}
