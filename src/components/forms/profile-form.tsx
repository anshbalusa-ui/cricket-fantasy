"use client";

import { useActionState } from "react";
import { updateDisplayName } from "@/lib/auth/actions";
import { SubmitButton } from "@/components/forms/submit-button";
import type { AuthFormState } from "@/lib/auth/validation";

export function ProfileForm({ displayName }: { displayName: string }) {
  const [state, action] = useActionState(updateDisplayName, {} satisfies AuthFormState);
  return <form action={action} className="account-profile-form">
    <label htmlFor="displayName">Display name</label>
    <input id="displayName" name="displayName" defaultValue={displayName} autoComplete="name" maxLength={40} required />
    <SubmitButton pendingLabel="Saving…">Save changes</SubmitButton>
  </form>;
}
