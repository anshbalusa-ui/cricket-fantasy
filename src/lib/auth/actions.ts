"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPreviewSiteOrigin, isSupabaseConfigured } from "@/lib/supabase/env";
import { requireUser } from "@/lib/auth/session";
import {
  safeNextPath,
  validDisplayName,
  validEmail,
  validPassword,
  type AuthFormState,
} from "@/lib/auth/validation";

const setupError =
  "Authentication is not configured yet. Add the Supabase URL and publishable key to the server environment.";

function emailRedirectOrigin(): string | null {
  const configured =
    getPreviewSiteOrigin() || process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const value =
    configured ||
    (process.env.NODE_ENV === "production" ? null : "http://localhost:3000");
  if (!value) return null;
  try {
    const url = new URL(value);
    if (
      url.username ||
      url.password ||
      !["http:", "https:"].includes(url.protocol) ||
      (process.env.NODE_ENV === "production" && url.protocol !== "https:") ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    )
      return null;
    return url.origin;
  } catch {
    return null;
  }
}

export async function signIn(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) return { error: setupError };
  const email = validEmail(formData.get("email"));
  const password = validPassword(formData.get("password"));
  if (!email || !password)
    return {
      error: "Enter a valid email and password (at least 8 characters).",
    };
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error)
      return {
        error:
          "Unable to sign in with those details. Check your email and password.",
      };
  } catch {
    return { error: "Unable to sign in right now. Please try again." };
  }
  redirect(safeNextPath(formData.get("next")));
}

export async function signUp(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) return { error: setupError };
  const email = validEmail(formData.get("email"));
  const password = validPassword(formData.get("password"));
  const displayName = validDisplayName(formData.get("displayName"));
  if (!email || !password || !displayName)
    return {
      error: "Enter a valid name, email, and password (at least 8 characters).",
    };
  const next = safeNextPath(formData.get("next"));
  let hasSession = false;
  try {
    const supabase = await createClient();
    const siteOrigin = emailRedirectOrigin();
    if (!siteOrigin)
      return {
        error:
          "Account creation needs a correctly configured trusted HTTPS site origin.",
      };
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: `${siteOrigin}/auth/confirm?next=${encodeURIComponent(next)}`,
      },
    });
    if (error)
      return {
        error:
          "Unable to create your account. Check the details and try again.",
      };
    hasSession = Boolean(data.session);
  } catch {
    return {
      error: "Unable to create your account right now. Please try again.",
    };
  }
  if (hasSession) redirect(next);
  return {
    success:
      "Check your email. Open the confirmation link in this same browser to finish creating your account.",
  };
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

export async function updateDisplayName(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const displayName = validDisplayName(formData.get("displayName"));
  if (!displayName) return { error: "Display name must be 1–40 characters." };
  const { user, supabase } = await requireUser("/account");
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", user.id);
  if (error) return { error: "Unable to update your profile right now." };
  revalidatePath("/", "layout");
  redirect("/account?updated=1");
}

export async function requestPasswordReset(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) return { error: setupError };
  const email = validEmail(formData.get("email"));
  if (!email) return { error: "Enter a valid email address." };
  const origin = emailRedirectOrigin();
  if (!origin)
    return {
      error:
        "Password recovery needs a correctly configured trusted site origin.",
    };
  const destination = `/account/password?next=${encodeURIComponent(safeNextPath(formData.get("next")))}`;
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(destination)}`,
    });
    if (error)
      return {
        error:
          "Unable to send a recovery email right now. Email delivery or rate limits may need attention.",
      };
    return {
      success:
        "If this account can receive recovery mail, a link has been sent. Open it in this same browser to choose a new password.",
    };
  } catch {
    return {
      error: "Unable to request password recovery right now. Please try again.",
    };
  }
}

export async function updatePassword(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const password = validPassword(formData.get("password"));
  if (!password || password !== formData.get("confirmPassword")) {
    return { error: "Use matching passwords between 8 and 128 characters." };
  }
  const { supabase } = await requireUser("/account/password");
  try {
    const { error } = await supabase.auth.updateUser({ password });
    if (error)
      return {
        error:
          "Unable to change your password. Try again, or open a fresh recovery email.",
      };
    return { success: "Your Cricket Fantasy password has been changed." };
  } catch {
    return {
      error: "Unable to change your password right now. Please try again.",
    };
  }
}
