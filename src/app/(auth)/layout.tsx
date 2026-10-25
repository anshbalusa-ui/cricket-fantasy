import "@/app/auth.css";
import { Brand } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icon";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="auth-shell">
      <div className="auth-layout">
        <aside className="auth-aside">
          <Brand />
          <p className="auth-mobile-note">
            Private cricket leagues for your friends. Drafting and scoring are
            still in development.
          </p>
          <div className="auth-aside-copy">
            <span className="auth-aside-kicker">
              <Icon name="shield" size={14} /> A PRIVATE HOME FOR YOUR LEAGUE
            </span>
            <h2>
              Good cricket
              <br />
              is better shared.
            </h2>
            <p>
              Create a league for your friends, gather your crew, and get ready
              for fantasy cricket together.
            </p>
            <div className="auth-aside-rule" />
            <p className="auth-aside-small">
              League setup is available. Player drafting and fantasy scoring are
              still in development.
            </p>
          </div>
          <span className="auth-aside-footer">
            Independent fantasy cricket project
          </span>
        </aside>
        <div className="auth-content">{children}</div>
      </div>
    </main>
  );
}
