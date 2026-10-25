import { signOut } from "@/lib/auth/actions";
import { getMyProfile } from "@/lib/users/queries";
import { ProfileForm } from "@/components/forms/profile-form";
import { Avatar, PageHeading, Panel } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icon";

export const dynamic = "force-dynamic";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; updated?: string }>;
}) {
  const { user, profile } = await getMyProfile("/account");
  const { error: queryError, updated } = await searchParams;
  const signOutError = queryError === "signout";
  const displayName = profile.display_name;
  return (
    <div className="app-page">
      <PageHeading
        eyebrow="ACCOUNT"
        title="Your profile"
        description="Manage the name your league mates see and your sign-in session."
      />
      {signOutError && (
        <p className="notice notice-error" role="alert">
          Unable to sign out right now. Please try again.
        </p>
      )}
      {updated === "1" && (
        <p className="notice notice-success" role="status">
          Display name updated. Your identity is now current across your league
          spaces.
        </p>
      )}
      <div className="account-grid">
        <Panel eyebrow="PROFILE" title="Manager identity">
          <div className="account-identity">
            <Avatar name={displayName} size="xl" />
            <div>
              <strong>{displayName}</strong>
              <span>Shown to your league managers</span>
            </div>
          </div>
          <ProfileForm displayName={displayName} />
        </Panel>
        <Panel eyebrow="SECURITY" title="Sign-in session">
          <div className="email-identity">
            <span className="action-row-icon">
              <Icon name="mail" size={18} />
            </span>
            <div>
              <span className="eyebrow">EMAIL</span>
              <p>{user.email ?? "Email unavailable"}</p>
            </div>
          </div>
          <p className="app-help">
            Your account is managed through your secure sign-in session.
          </p>
          <form action={signOut}>
            <button className="button button-secondary" type="submit">
              <Icon name="logout" size={17} /> Sign out
            </button>
          </form>
        </Panel>
      </div>
    </div>
  );
}
