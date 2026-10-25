export function safeNextPath(value: unknown, fallback = "/dashboard"): string {
  if (typeof value !== "string") return fallback;
  const path = value.trim();
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\") || /[\u0000-\u001f\u007f]/.test(path)) return fallback;
  try {
    const url = new URL(path, "https://local.invalid");
    if (url.origin !== "https://local.invalid") return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export type AuthFormState = { error?: string; success?: string };

export function validEmail(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export function validPassword(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" && value.length >= 8 && value.length <= 128 ? value : null;
}

export function validDisplayName(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const name = value.trim();
  return name.length >= 1 && name.length <= 40 && !/[\u0000-\u001f\u007f]/.test(name) ? name : null;
}
