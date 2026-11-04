"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { requestPasswordReset, updatePassword } from "@/lib/auth/actions";
import { SubmitButton } from "@/components/forms/submit-button";
import type { AuthFormState } from "@/lib/auth/validation";

export function PasswordRecoveryForm({ next }: { next: string }) {
  const [state, action] = useActionState(
    requestPasswordReset,
    {} satisfies AuthFormState,
  );
  const [email, setEmail] = useState("");
  return (
    <form action={action} className="auth-form">
      <input type="hidden" name="next" value={next} />
      <div className="auth-field">
        <label htmlFor="recovery-email">Email address</label>
        <input
          id="recovery-email"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={254}
          required
          value={email}
          onChange={(event) => setEmail(event.currentTarget.value)}
        />
      </div>
      {state.error && (
        <p className="auth-message auth-error" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="auth-message auth-success" role="status">
          {state.success}
        </p>
      )}
      <SubmitButton
        className="button button-primary auth-submit"
        pendingLabel="Sending recovery link…"
      >
        Send recovery link
      </SubmitButton>
    </form>
  );
}

export function PasswordChangeForm({ next }: { next: string }) {
  const [state, action] = useActionState(
    updatePassword,
    {} satisfies AuthFormState,
  );
  return (
    <form action={action} className="app-form">
      <div className="app-field">
        <label htmlFor="new-password">New Cricket Fantasy password</label>
        <input
          id="new-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          required
        />
        <span className="app-help">
          Use a unique password of 8–128 characters.
        </span>
      </div>
      <div className="app-field">
        <label htmlFor="confirm-password">Confirm new password</label>
        <input
          id="confirm-password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          required
        />
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
      <SubmitButton
        className="button button-primary"
        pendingLabel="Changing password…"
      >
        Save new password
      </SubmitButton>
      {state.success && (
        <Link className="button button-secondary" href={next}>
          Continue to Cricket Fantasy
        </Link>
      )}
    </form>
  );
}
