"use client";

import { useFormStatus } from "react-dom";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type SubmitButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
  children: ReactNode;
  pendingLabel?: string;
};

export function SubmitButton({ children, pendingLabel = "Saving…", disabled, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return <button {...props} type="submit" disabled={disabled || pending}>{pending ? pendingLabel : children}</button>;
}
