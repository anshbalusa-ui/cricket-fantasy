import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

const features = [
  { icon: "01", title: "Your league. Your people.", copy: "Make a private league, invite your friends and build a season-long rivalry." },
  { icon: "02", title: "Players are yours to draft.", copy: "An exclusive snake draft means every pick matters. No identical rosters." },
  { icon: "03", title: "Win the matchup.", copy: "Manage your starters, follow fantasy rounds and chase a league championship." },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="hero shell">
          <div className="hero-copy">
            <div className="eyebrow"><span className="pulse-dot" /> THE NEXT ERA OF FANTASY CRICKET</div>
            <h1>THE GAME<br />IS BETTER<br /><span className="highlight">TOGETHER.</span></h1>
            <p className="hero-description">
              Build your squad. Draft against your friends. Turn every boundary, wicket,
              and catch into a season-long rivalry.
            </p>
            <div className="hero-actions">
              <Link href="/demo" className="button button-primary">Explore the prototype <span aria-hidden="true">↗</span></Link>
              <a href="#how" className="button button-text">See how it works <span aria-hidden="true">↓</span></a>
            </div>
            <p className="hero-disclaimer">Free private leagues • MLC first • IPL planned</p>
          </div>
          <div className="hero-art" aria-label="Illustrative fantasy cricket matchup preview">
            <div className="orb orb-one" />
            <div className="orb orb-two" />
            <div className="hero-match-card">
              <div className="card-topline"><span>ROUND 03 · SAMPLE</span><span className="status-pill">DEMO DATA</span></div>
              <div className="matchup-title">Head to head</div>
              <div className="score-row">
                <div className="fantasy-team"><span className="team-emblem emblem-lime">NB</span><strong>Night Owls</strong><span>4–1</span></div>
                <div className="score-display"><strong>134.5</strong><small>VS</small><strong>126.0</strong></div>
                <div className="fantasy-team"><span className="team-emblem emblem-violet">BC</span><strong>Boundary Club</strong><span>3–2</span></div>
              </div>
              <div className="progress-track" aria-hidden="true"><span /></div>
              <div className="card-bottom"><span>Projected matchup</span><span>Illustrative only</span></div>
            </div>
            <div className="floating-stat"><span className="floating-icon">✦</span><span><strong>+25 PTS</strong><small>Wicket taken</small></span></div>
            <div className="pitch-lines" aria-hidden="true" />
          </div>
        </section>

        <section className="metric-strip">
          <div className="shell metric-inner">
            <span><strong>01</strong> LEAGUE, YOUR FRIENDS</span>
            <span><strong>06</strong> MANAGERS IN THE MVP</span>
            <span><strong>100%</strong> FREE TO PLAY</span>
          </div>
        </section>

        <section id="features" className="section shell">
          <div className="section-heading">
            <span className="section-kicker">THE DIFFERENCE</span>
            <h2>Not just another<br /><span>points leaderboard.</span></h2>
            <p>Traditional fantasy sports energy, built around the game we love.</p>
          </div>
          <div className="feature-grid">
            {features.map((feature) => (
              <article className="feature-card" key={feature.icon}>
                <span className="feature-number">{feature.icon}</span>
                <h3>{feature.title}</h3>
                <p>{feature.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="how" className="section how-section">
          <div className="shell how-inner">
            <div>
              <span className="section-kicker">IT'S SIMPLE</span>
              <h2>Pick a league.<br />Make it yours.</h2>
              <p className="section-muted">Starting with Major League Cricket, built to expand to IPL and other competitions.</p>
            </div>
            <div className="steps">
              <div><span>01</span><p><strong>Create or join</strong> a private league with friends.</p></div>
              <div><span>02</span><p><strong>Draft exclusive players</strong> in a snake draft.</p></div>
              <div><span>03</span><p><strong>Set your lineup</strong> and go head-to-head.</p></div>
              <div><span>04</span><p><strong>Chase a championship</strong> through playoffs.</p></div>
            </div>
          </div>
        </section>

        <section className="section shell closing-section">
          <span className="section-kicker">BUILDING THE FIRST INNINGS</span>
          <h2>Every great rivalry<br />starts somewhere.</h2>
          <p>The first preview uses fictional managers and stats. Real accounts, draft rooms and live scoring are on the roadmap.</p>
          <Link href="/demo" className="button button-primary">Try the demo mechanics <span aria-hidden="true">↗</span></Link>
        </section>
      </main>
      <footer className="footer shell">
        <span>© 2026 Cricket Fantasy · Independent concept</span>
        <span>Not affiliated with MLC, IPL or any fantasy sports platform.</span>
      </footer>
    </>
  );
}
