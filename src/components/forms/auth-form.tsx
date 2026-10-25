"use client";

import { useActionState } from "react";
import { signIn, signUp } from "@/lib/auth/actions";
import type { AuthFormState } from "@/lib/auth/validation";
import { SubmitButton } from "@/components/forms/submit-button";

const initialState: AuthFormState = {};

export function AuthForm({ mode, next = "/dashboard" }: { mode: "sign-in" | "sign-up"; next?: string }) {
  const action = mode === "sign-in" ? signIn : signUp;
  const [state, formAction] = useActionState(action, initialState);
  return (
    <form action={formAction} className="auth-form">
      {mode === "sign-up" && <label>Display name<input name="displayName" autoComplete="name" minLength={1} maxLength={40} required /></label>}
      <label>Email<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
      <label>Password<input name="password" type="password" autoComplete={mode === "sign-in" ? "current-password" : "new-password"} minLength={8} maxLength={128} required /></label>
      <input type="hidden" name="next" value={next} />
      {state.error && <p className="auth-message auth-error" role="alert">{state.error}</p>}
      {state.success && <p className="auth-message auth-success" role="status">{state.success}</p>}
      <SubmitButton className="auth-submit" pendingLabel={mode === "sign-in" ? "Signing in…" : "Creating account…"}>{mode === "sign-in" ? "Sign in" : "Create account"}</SubmitButton>
    </form>
  );
}
