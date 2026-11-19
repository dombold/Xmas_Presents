"use client";

import { startTransition, useActionState } from "react";
import { setPin } from "@/app/actions";

export default function PinForm({ changing }: { changing: boolean }) {
  const [state, action, pending] = useActionState(setPin, undefined);

  return (
    <form
      // Submitted via onSubmit (not the action prop) so React doesn't clear the fields on an error.
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
      className="mt-8 space-y-5"
    >
      {changing && (
        <div>
          <label htmlFor="currentPin" className="block text-sm font-medium">
            Current PIN
          </label>
          <input id="currentPin" name="currentPin" type="password" inputMode="numeric" autoComplete="current-password" required className="input mt-1" />
        </div>
      )}
      <div>
        <label htmlFor="newPin" className="block text-sm font-medium">
          New PIN <span className="font-normal text-muted">(4–8 digits)</span>
        </label>
        <input id="newPin" name="newPin" type="password" inputMode="numeric" autoComplete="new-password" pattern="\d{4,8}" required className="input mt-1" />
      </div>
      <div>
        <label htmlFor="confirmPin" className="block text-sm font-medium">
          New PIN again
        </label>
        <input id="confirmPin" name="confirmPin" type="password" inputMode="numeric" autoComplete="new-password" pattern="\d{4,8}" required className="input mt-1" />
      </div>
      {state?.error && (
        <p role="alert" className="text-sm font-medium text-primary">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Saving…" : changing ? "Change PIN" : "Save my PIN"}
      </button>
    </form>
  );
}
