"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPreviewSiteOrigin, isSupabaseConfigured } from "@/lib/supabase/env";
import { requireUser } from "@/lib/auth/session";
import { safeNextPath, validDisplayName, validEmail, validPassword, type AuthFormState } from "@/lib/auth/validation";

const setupError = "Authentication is not configured yet. Add the Supabase URL and publishable key to the server environment.";

export async function signIn(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) return { error: setupError };
  const email = validEmail(formData.get("email"));
  const password = validPassword(formData.get("password"));
  if (!email || !password) return { error: "Enter a valid email and password (at least 8 characters)." };
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: "Unable to sign in with those details. Check your email and password." };
  } catch {
    return { error: "Unable to sign in right now. Please try again." };
  }
  redirect(safeNextPath(formData.get("next")));
}

export async function signUp(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) return { error: setupError };
  const email = validEmail(formData.get("email"));
  const password = validPassword(formData.get("password"));
  const displayName = validDisplayName(formData.get("displayName"));
  if (!email || !password || !displayName) return { error: "Enter a valid name, email, and password (at least 8 characters)." };
  const next = safeNextPath(formData.get("next"));
  let hasSession = false;
  try {
    const supabase = await createClient();
    const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    const previewSiteUrl = getPreviewSiteOrigin();
    if (process.env.NODE_ENV === "production" && !configuredSiteUrl && !previewSiteUrl) {
      return { error: "Account creation is not configured. Set NEXT_PUBLIC_SITE_URL to the trusted HTTPS site origin." };
    }
    const siteUrl = previewSiteUrl || configuredSiteUrl || "http://localhost:3000";
    const parsedSiteUrl = new URL(siteUrl);
    if (
      parsedSiteUrl.username ||
      parsedSiteUrl.password ||
      !["http:", "https:"].includes(parsedSiteUrl.protocol) ||
      (process.env.NODE_ENV === "production" && parsedSiteUrl.protocol !== "https:") ||
      parsedSiteUrl.pathname !== "/" ||
      parsedSiteUrl.search ||
      parsedSiteUrl.hash
    ) {
      return { error: "Account creation is unavailable because the site URL is not configured correctly." };
    }
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: `${parsedSiteUrl.origin}/auth/confirm?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) return { error: "Unable to create your account. Check the details and try again." };
    hasSession = Boolean(data.session);
  } catch {
    return { error: "Unable to create your account right now. Please try again." };
  }
  if (hasSession) redirect(next);
  return { success: "Check your email for the confirmation link to finish creating your account." };
}

export async function signOut(_formData?: FormData): Promise<void> {
  if (!isSupabaseConfigured()) redirect("/sign-in?error=signout");
  let failed = false;
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut({ scope: "local" });
    failed = Boolean(error);
  } catch {
    failed = true;
  }
  if (failed) redirect("/account?error=signout");
  redirect("/sign-in");
}

export async function updateDisplayName(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const displayName = validDisplayName(formData.get("displayName"));
  if (!displayName) return { error: "Display name must be 1–40 characters." };
  const { user, supabase } = await requireUser("/account");
  const { error } = await supabase.from("profiles").update({ display_name: displayName }).eq("id", user.id);
  if (error) return { error: "Unable to update your profile right now." };
  revalidatePath("/", "layout");
  redirect("/account?updated=1");
}
