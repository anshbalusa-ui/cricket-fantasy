import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/forms/auth-form";
import { getUser } from "@/lib/auth/session";
import { safeNextPath } from "@/lib/auth/validation";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const query = await searchParams;
  const next = safeNextPath(query.next);
  if (await getUser()) redirect(next);
  return <section className="auth-card"><h1>Build your league</h1><p className="auth-intro">Create your account to start a private season with friends.</p>
    {!isSupabaseConfigured() && <p className="auth-setup" role="status">Authentication needs setup: configure <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>.</p>}
    <AuthForm mode="sign-up" next={next} />
    <div className="auth-links"><span>Already have an account?</span><Link href={`/sign-in?next=${encodeURIComponent(next)}`}>Sign in</Link></div>
  </section>;
}
