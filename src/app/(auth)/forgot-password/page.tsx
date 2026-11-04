import Link from "next/link";
import { PasswordRecoveryForm } from "@/components/forms/password-forms";
import { safeNextPath } from "@/lib/auth/validation";

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const query = await searchParams;
  const next = safeNextPath(query.next);
  return (
    <section className="auth-card">
      <h1>Back in the game.</h1>
      <p className="auth-intro">
        Request a recovery email, then open it in this same browser to choose a
        new Cricket Fantasy password.
      </p>
      <PasswordRecoveryForm next={next} />
      <div className="auth-links">
        <Link href={`/sign-in?next=${encodeURIComponent(next)}`}>
          Back to sign in
        </Link>
      </div>
      <p className="app-help">
        Delivery depends on your league’s email configuration. Check spam
        folders; repeated requests can be rate-limited.
      </p>
    </section>
  );
}
