import Link from "next/link";
import type { ReactNode } from "react";
import { getMyProfile } from "@/lib/users/queries";
import { signOut } from "@/lib/auth/actions";
import "../application.css";

export default async function ApplicationLayout({ children }: Readonly<{ children: ReactNode }>) {
  const { profile } = await getMyProfile();
  const displayName = profile.display_name;
  return (
    <div className="app-frame">
      <header className="app-topbar">
        <div className="shell app-topbar-inner">
          <Link href="/dashboard" className="app-brand" aria-label="Cricket Fantasy dashboard">
            <span className="app-brand-mark" aria-hidden="true">C<span>F</span></span>
            <span>CRICKET<span className="brand-light">FANTASY</span></span>
          </Link>
          <nav className="app-nav" aria-label="Application navigation">
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/leagues">My leagues</Link>
            <Link href="/account">Account</Link>
          </nav>
          <div className="app-user-actions">
            <span className="app-user-name">{displayName}</span>
            <form action={signOut}><button className="app-signout" type="submit">Sign out</button></form>
          </div>
        </div>
      </header>
      <main className="shell app-main">{children}</main>
    </div>
  );
}
