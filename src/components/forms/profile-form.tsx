"use client";

import { useActionState, useState } from "react";
import { updateDisplayName } from "@/lib/auth/actions";
import { SubmitButton } from "@/components/forms/submit-button";
import type { AuthFormState } from "@/lib/auth/validation";

export function ProfileForm({ displayName }: { displayName: string }) {
  const [state, action] = useActionState(
    updateDisplayName,
    {} satisfies AuthFormState,
  );
  const [name, setName] = useState(displayName);
  return (
    <form action={action} className="app-form">
      <div className="app-field">
        <label htmlFor="displayName">Display name</label>
        <input
          id="displayName"
          name="displayName"
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
          autoComplete="name"
          maxLength={40}
          required
          aria-describedby="display-name-help"
        />
        <span className="app-help" id="display-name-help">
          This name appears to managers in your private leagues.
        </span>
      </div>
      {state.error && (
        <p className="notice notice-error" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="notice notice-success" role="status">
          {state.success}
        </p>
      )}
      <SubmitButton className="button button-primary" pendingLabel="Saving…">
        Save changes
      </SubmitButton>
    </form>
  );
}
