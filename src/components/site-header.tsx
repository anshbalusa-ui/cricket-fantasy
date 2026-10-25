import Link from "next/link";
import { Brand } from "@/components/ui/primitives";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Brand />
        <nav className="nav-links" aria-label="Main navigation">
          <Link href="/demo">Practice</Link>
          <Link href="/dashboard">Leagues</Link>
        </nav>
        <div className="header-actions">
          <Link href="/sign-in" className="header-signin">
            Sign in
          </Link>
          <Link
            href="/sign-up?next=%2Fleagues%2Fnew"
            className="button button-primary button-small"
          >
            Create league
          </Link>
        </div>
      </div>
    </header>
  );
}
