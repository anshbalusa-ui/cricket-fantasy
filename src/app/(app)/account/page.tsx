import { signOut } from "@/lib/auth/actions";
import { getMyProfile } from "@/lib/users/queries";
import { ProfileForm } from "@/components/forms/profile-form";

export const dynamic = "force-dynamic";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ error?: string; updated?: string }> }) {
  const { user, profile } = await getMyProfile("/account");
  const { error: queryError, updated } = await searchParams;
  const signOutError = queryError === "signout";
  const displayName = profile.display_name;
  return <section className="account-page">
    <header><p className="eyebrow">ACCOUNT</p><h1>Your profile</h1><p>Manage the name your league mates see and your sign-in session.</p></header>
    {signOutError && <p role="alert">Unable to sign out right now. Please try again.</p>}
    {updated === "1" && <p role="status">Display name updated.</p>}
    <div className="account-profile-card"><p className="eyebrow">PROFILE</p><ProfileForm displayName={displayName} /></div>
    <div className="account-profile-card"><p className="eyebrow">SIGN-IN EMAIL</p><p>{user.email ?? "Email unavailable"}</p><form action={signOut}><button type="submit">Sign out</button></form></div>
    <style>{`.account-page{max-width:720px;margin:0 auto;padding:32px 20px;color:#f4f4f5}.account-page header p:not(.eyebrow){color:#a4afb9}.account-page h1{font-size:32px;margin:8px 0}.account-page .eyebrow{color:#9fe870;font-size:12px;font-weight:800;letter-spacing:.16em}.account-profile-card{margin-top:24px;padding:22px;border:1px solid #29333c;border-radius:14px;background:#10161c}.account-profile-form{display:grid;gap:12px;max-width:420px}.account-profile-form label{font-weight:600}.account-profile-form input{padding:12px;border:1px solid #35414c;border-radius:8px;background:#0a0f14;color:#f4f4f5;font:inherit}.account-profile-form button,.account-profile-card button{width:max-content;border:0;border-radius:8px;background:#9fe870;padding:11px 16px;color:#10160c;font:inherit;font-weight:800;cursor:pointer}.account-profile-form p{margin:0;color:#b7ed98}`}</style>
  </section>;
}
