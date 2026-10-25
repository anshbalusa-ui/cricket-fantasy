"use client";

import { useActionState, useState } from "react";
import { signIn, signUp } from "@/lib/auth/actions";
import type { AuthFormState } from "@/lib/auth/validation";
import { SubmitButton } from "@/components/forms/submit-button";
import { Icon } from "@/components/ui/icon";

const initialState: AuthFormState = {};

export function AuthForm({
  mode,
  next = "/dashboard",
}: {
  mode: "sign-in" | "sign-up";
  next?: string;
}) {
  const action = mode === "sign-in" ? signIn : signUp;
  const [state, formAction] = useActionState(action, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  return (
    <form action={formAction} className="auth-form">
      {mode === "sign-up" && (
        <div className="auth-field">
          <label htmlFor="displayName">Display name</label>
          <input
            id="displayName"
            name="displayName"
            autoComplete="name"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            minLength={1}
            maxLength={40}
            required
          />
        </div>
      )}
      <div className="auth-field">
        <label htmlFor="email">Email address</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          maxLength={254}
          required
        />
      </div>
      <div className="auth-field">
        <label htmlFor="password">Password</label>
        <div className="password-control">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete={
              mode === "sign-in" ? "current-password" : "new-password"
            }
            minLength={8}
            maxLength={128}
            required
          />
          <button
            className="password-toggle"
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
          >
            <Icon name={showPassword ? "eyeOff" : "eye"} size={17} />
          </button>
        </div>
        {mode === "sign-up" && (
          <span className="auth-field-hint">Use at least 8 characters.</span>
        )}
      </div>
      <input type="hidden" name="next" value={next} />
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
        className="button-primary auth-submit"
        pendingLabel={mode === "sign-in" ? "Signing in…" : "Creating account…"}
      >
        {mode === "sign-in" ? "Sign in" : "Create account"}
      </SubmitButton>
    </form>
  );
}
