import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { DraftPlayground } from "@/components/demo/draft-playground";
import { ScoringPlayground } from "@/components/demo/scoring-playground";

export const metadata = {
  title: "Prototype | Cricket Fantasy",
  description: "Try a fictional snake draft and explore the cricket fantasy scoring rules.",
};

export default function DemoPage() {
  return (
    <>
      <SiteHeader />
      <main className="shell demo-main">
        <div className="demo-intro">
          <Link href="/" className="back-link">← Back home</Link>
          <div className="eyebrow"><span className="pulse-dot" /> EARLY PRODUCT PROTOTYPE</div>
          <h1>WELCOME TO<br /><span className="highlight">DRAFT NIGHT.</span></h1>
          <p>A hands-on preview of how a cricket fantasy league could work. The players, teams and matchup values here are fictional; nothing connects to live MLC data or user accounts.</p>
        </div>
        <div className="demo-banner"><strong>Prototype, not a live game.</strong> This page demonstrates client-side draft order and scoring rules. Picks reset on refresh and are not saved.</div>
        <DraftPlayground />
        <ScoringPlayground />
        <section className="demo-outro">
          <span className="section-kicker">WHAT COMES NEXT</span>
          <h2>From preview to a real league.</h2>
          <p>Real accounts and private league lobbies are available with Supabase configured. Multiplayer drafting, MLC player data, matchups, and season replay are the next milestones.</p>
          <a className="button button-outline" href="https://github.com/anshbalusa-ui/cricket-fantasy" target="_blank" rel="noopener noreferrer">View project on GitHub ↗</a>
        </section>
      </main>
      <footer className="footer shell"><span>© 2026 Cricket Fantasy</span><span>Demo data is fictional · Free-to-play concept</span></footer>
    </>
  );
}
