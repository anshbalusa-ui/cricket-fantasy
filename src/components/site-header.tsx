import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link href="/" className="brand" aria-label="Cricket Fantasy home">
          <span className="brand-mark" aria-hidden="true">C<span>F</span></span>
          <span>CRICKET<span className="brand-light">FANTASY</span></span>
        </Link>
        <nav className="nav-links" aria-label="Main navigation">
          <Link href="/#features">Features</Link>
          <Link href="/#how">How it works</Link>
          <Link href="/demo">Prototype</Link>
          <Link href="/dashboard">My leagues</Link>
        </nav>
        <Link href="/sign-in" className="button button-small button-outline">Sign in <span aria-hidden="true">↗</span></Link>
      </div>
    </header>
  );
}
