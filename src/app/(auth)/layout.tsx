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
            Private cricket leagues. Fifteen picks. Your starting XI.
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
              Draft real players with your friends, set your XI, and settle a
              season head-to-head.
            </p>
            <div className="auth-aside-rule" />
            <p className="auth-aside-small">
              MLC 2026 historical replay. Free private leagues. No live feed,
              entry fees or prizes.
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
