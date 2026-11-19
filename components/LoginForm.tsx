"use client";

import { startTransition, useActionState, useState } from "react";
import { login } from "@/app/actions";

export default function LoginForm({ people }: { people: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(login, undefined);
  // Controlled so the chosen name stays selected after a wrong PIN.
  const [personId, setPersonId] = useState("");

  return (
    <form
      // Submitted via onSubmit (not the action prop) so React doesn't reset the fields when the server returns an error.
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
      className="mt-8 space-y-5">
      <div>
        <label htmlFor="personId" className="block text-sm font-medium">
          Your name
        </label>
        <select id="personId" name="personId" required value={personId} onChange={(e) => setPersonId(e.target.value)} className="input mt-1">
          <option value="" disabled>
            Choose…
          </option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="pin" className="block text-sm font-medium">
          Family PIN
        </label>
        <input id="pin" name="pin" type="password" inputMode="numeric" autoComplete="current-password" required className="input mt-1" />
      </div>
      {state?.error && (
        <p role="alert" className="text-sm font-medium text-primary">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
