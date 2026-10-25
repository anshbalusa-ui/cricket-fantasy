import Link from "next/link";
import type { ReactNode } from "react";
import { signOut } from "@/lib/auth/actions";
import { getMyProfile } from "@/lib/users/queries";
import { Avatar, Brand } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icon";
import { ApplicationNavigation } from "@/components/application/navigation";
import "../application.css";

export default async function ApplicationLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const { profile } = await getMyProfile();
  const displayName = profile.display_name;
  return (
    <div className="app-frame">
      <Link href="#main-content" className="skip-link">
        Skip to content
      </Link>
      <aside className="app-sidebar">
        <Brand href="/dashboard" />
        <div className="sidebar-season">
          <span className="sidebar-season-mark">
            <Icon name="flag" size={17} />
          </span>
          <span>
            <strong>Major League Cricket</strong>
            <small>2026 season hub</small>
          </span>
        </div>
        <ApplicationNavigation surface="sidebar" />
        <div className="sidebar-account">
          <Avatar name={displayName} size="md" />
          <span className="sidebar-account-copy">
            <strong>{displayName}</strong>
            <small>Manager account</small>
          </span>
          <form action={signOut}>
            <button className="icon-button" type="submit" aria-label="Sign out">
              <Icon name="logout" size={18} />
            </button>
          </form>
        </div>
      </aside>
      <div className="app-content">
        <header className="app-topbar">
          <div>
            <span className="app-mobile-brand">
              <Brand compact href="/dashboard" />
            </span>
            <span className="app-topbar-copy">
              <span className="topbar-kicker">MLC · 2026</span>
              <strong>Your fantasy hub</strong>
            </span>
          </div>
          <Link
            className="topbar-account"
            href="/account"
            aria-label={`Account for ${displayName}`}
          >
            <Avatar name={displayName} size="sm" />
          </Link>
        </header>
        <main id="main-content" className="app-main">
          {children}
        </main>
      </div>
      <ApplicationNavigation surface="mobile" />
    </div>
  );
}
