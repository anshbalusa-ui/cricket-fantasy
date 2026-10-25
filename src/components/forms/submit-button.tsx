"use client";

import { useFormStatus } from "react-dom";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type SubmitButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "type"
> & {
  children: ReactNode;
  pendingLabel?: string;
};

export function SubmitButton({
  children,
  pendingLabel = "Saving…",
  disabled,
  className,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const buttonClass = ["button", className].filter(Boolean).join(" ");
  return (
    <button
      {...props}
      className={buttonClass}
      type="submit"
      disabled={disabled || pending}
      aria-busy={pending || undefined}
    >
      {pending && <span className="submit-spinner" aria-hidden="true" />}
      {pending ? pendingLabel : children}
    </button>
  );
}
