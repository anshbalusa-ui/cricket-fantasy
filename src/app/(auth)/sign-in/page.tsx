import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/forms/auth-form";
import { getUser } from "@/lib/auth/session";
import { safeNextPath } from "@/lib/auth/validation";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const query = await searchParams;
  const next = safeNextPath(query.next);
  if (await getUser()) redirect(next);
  const callbackError = query.error === "setup"
    ? "Authentication is not configured. Please try again after setup."
    : query.error === "confirmation"
      ? "That confirmation link is invalid or expired. Request a new one by creating an account again."
      : query.error === "signout"
        ? "Unable to sign out right now. Please try again."
        : null;
  return <section className="auth-card"><h1>Welcome back</h1><p className="auth-intro">Sign in to get back to your private cricket leagues.</p>
    {!isSupabaseConfigured() && <p className="auth-setup" role="status">Authentication needs setup: configure <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>.</p>}
    {callbackError && <p className="auth-message auth-error" role="alert">{callbackError}</p>}
    <AuthForm mode="sign-in" next={next} />
    <div className="auth-links"><span>New here?</span><Link href={`/sign-up?next=${encodeURIComponent(next)}`}>Create an account</Link></div>
  </section>;
}
