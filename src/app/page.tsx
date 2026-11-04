import "./marketing.css";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Avatar, Badge, Brand } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icon";
import { BENCH_COUNT, SQUAD_SIZE, STARTER_COUNT } from "@/lib/fantasy/lineup";

const lineupFormat = [
  { role: "BAT", count: 2, tone: "amber" },
  { role: "BOWL", count: 2, tone: "blue" },
  { role: "ALL", count: 2, tone: "violet" },
  { role: "WK", count: 1, tone: "mint" },
  { role: "FLEX", count: 4, tone: "neutral" },
] as const;

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="marketing">
        <section className="marketing-hero shell">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="live-mark" /> PRIVATE LEAGUES, BUILT FOR CRICKET
            </p>
            <h1>
              Your cricket. <span>Your league.</span>
            </h1>
            <p className="hero-description">
              Draft real cricket players. Choose your XI. Play your friends
              head-to-head, from draft night to the championship.
            </p>
            <div className="hero-actions">
              <Link
                href="/sign-up?next=%2Fleagues%2Fnew"
                className="button button-primary"
              >
                Create a private league <Icon name="arrowUpRight" size={16} />
              </Link>
              <Link href="/demo" className="button button-secondary">
                Try the practice draft <Icon name="arrowRight" size={16} />
              </Link>
            </div>
            <p className="hero-footnote">
              Free private leagues · Invite-only · Early access
            </p>
          </div>
          <div
            className="product-stage"
            role="group"
            aria-label="Illustrative preview of a private fantasy cricket league"
          >
            <div className="stage-caption">
              <span>YOUR LEAGUE, AT A GLANCE</span>
              <Badge tone="amber" dot>
                Illustrative
              </Badge>
            </div>
            <div className="league-preview">
              <div className="preview-topline">
                <span>
                  <span className="preview-mark">C</span> PRIVATE LEAGUE
                </span>
                <span className="league-season">SETUP</span>
              </div>
              <div className="league-title">
                <div>
                  <span className="preview-label">WELCOME TO</span>
                  <h2>The Boundary Room</h2>
                </div>
                <span className="league-symbol" aria-hidden="true">
                  <Icon name="users" size={19} />
                </span>
              </div>
              <div className="league-meta">
                <span>MAJOR LEAGUE CRICKET</span>
                <span>·</span>
                <span>YOUR FRIEND GROUP</span>
              </div>
              <div className="preview-divider" />
              <div className="manager-heading">
                <span>LEAGUE MEMBERS</span>
                <span>FICTIONAL EXAMPLE</span>
              </div>
              <div className="manager-row">
                <Avatar name="Aarav Mehta" size="sm" tone="mint" />
                <span className="manager-name">Aarav Mehta</span>
                <span className="manager-role">MEMBER</span>
              </div>
              <div className="manager-row">
                <Avatar name="Rohan Patel" size="sm" tone="blue" />
                <span className="manager-name">Rohan Patel</span>
                <span className="manager-role">MEMBER</span>
              </div>
              <div className="manager-row">
                <Avatar name="Dev Singh" size="sm" tone="amber" />
                <span className="manager-name">Dev Singh</span>
                <span className="manager-role">MEMBER</span>
              </div>
              <div className="preview-lineup">
                <div className="preview-lineup-heading">
                  <strong>THE LINEUP BLUEPRINT</strong>
                  <span>Starting XI format</span>
                </div>
                <div className="preview-role-grid">
                  {lineupFormat.map(({ role, count, tone }) => (
                    <div key={role}>
                      <Badge tone={tone}>{role}</Badge>
                      <span>
                        {count} {count === 1 ? "spot" : "spots"}
                      </span>
                    </div>
                  ))}
                </div>
                <p>
                  <strong>{STARTER_COUNT} starters</strong>
                  <span>+</span>
                  <strong>{BENCH_COUNT} bench</strong>
                  <span className="preview-lineup-future">After the draft</span>
                </p>
              </div>
              <div className="roster-notice">
                <Icon name="shield" size={15} />
                <span>
                  Exclusive picks. A recorded season.{" "}
                  <strong>One champion.</strong>
                </span>
              </div>
            </div>
            <div className="sample-note">
              Fictional names · Illustrative league identity, not private user
              data
            </div>
          </div>
        </section>

        <section
          className="product-note shell"
          aria-label="League setup details"
        >
          <div>
            <span className="note-number">01</span>
            <p>
              <strong>Start with your people</strong>
              <span>Private leagues for friends, not public leaderboards.</span>
            </p>
          </div>
          <div>
            <span className="note-number">02</span>
            <p>
              <strong>A clear first-season shape</strong>
              <span>
                6 managers. {SQUAD_SIZE} picks each. Your best XI every round.
              </span>
            </p>
          </div>
          <div>
            <span className="note-number">03</span>
            <p>
              <strong>Go the whole season</strong>
              <span>
                Historical matchups, auditable points and a top-four
                championship.
              </span>
            </p>
          </div>
        </section>

        <section id="how" className="how-section">
          <div className="shell how-content">
            <div className="how-intro">
              <p className="eyebrow">THE FIRST INNINGS</p>
              <h2>
                Your league starts
                <br />
                with an invitation.
              </h2>
              <p>
                Bring your cricket crew together, draft exclusive players and
                set a balanced XI. Replay a real MLC season with head-to-head
                rounds and every fantasy point explained.
              </p>
              <Link href="/sign-up?next=%2Fleagues%2Fnew" className="text-link">
                Get your league started <Icon name="arrowUpRight" size={15} />
              </Link>
            </div>
            <ol className="setup-steps">
              <li>
                <span>01</span>
                <div>
                  <strong>Create your account</strong>
                  <p>Choose a display name and secure sign-in.</p>
                </div>
                <Icon name="users" size={18} />
              </li>
              <li>
                <span>02</span>
                <div>
                  <strong>Make a private league</strong>
                  <p>Give your group a name and invite friends.</p>
                </div>
                <Icon name="lock" size={18} />
              </li>
              <li>
                <span>03</span>
                <div>
                  <strong>Draft. Set your XI. Compete.</strong>
                  <p>
                    Fifteen rounds in the draft room. Five league rounds. A
                    playoff champion.
                  </p>
                </div>
                <Icon name="trophy" size={18} />
              </li>
            </ol>
          </div>
        </section>
        <section className="closing-section shell">
          <div>
            <p className="eyebrow">YOUR FRIENDS. YOUR LEAGUE.</p>
            <h2>Make room for your people.</h2>
            <p>
              Create your league’s home and send the first invitation. Your
              group takes it from there.
            </p>
          </div>
          <Link href="/sign-up" className="button button-primary">
            Create your account <Icon name="arrowUpRight" size={16} />
          </Link>
        </section>
      </main>
      <footer className="marketing-footer shell">
        <Brand compact />
        <span>
          Original fantasy cricket · Free private leagues · No real-money
          contests
        </span>
        <Link href="/demo">
          Practice arena <Icon name="arrowUpRight" size={13} />
        </Link>
      </footer>
    </>
  );
}
