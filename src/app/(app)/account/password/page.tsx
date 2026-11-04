import Link from "next/link";
import { PasswordChangeForm } from "@/components/forms/password-forms";
import { PageHeading, Panel } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icon";
import { requireUser } from "@/lib/auth/session";
import { safeNextPath } from "@/lib/auth/validation";

export default async function PasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  await requireUser("/account/password");
  const query = await searchParams;
  return (
    <div className="app-page">
      <Link href="/account" className="app-back">
        <Icon name="arrowLeft" size={17} /> Your account
      </Link>
      <PageHeading
        eyebrow="ACCOUNT SECURITY"
        title="Choose a new password"
        description="Your app password protects your private leagues and fantasy teams."
      />
      <Panel title="Password" className="form-panel">
        <PasswordChangeForm next={safeNextPath(query.next)} />
      </Panel>
    </div>
  );
}
