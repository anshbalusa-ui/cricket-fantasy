import "./demo.css";
import Link from "next/link";
import { Brand, Badge, PageHeading } from "@/components/ui/primitives";
import { DraftPlayground } from "@/components/demo/draft-playground";
import { ScoringPlayground } from "@/components/demo/scoring-playground";
import { ApplicationNavigation } from "@/components/application/navigation";

export const metadata = {
  title: "Practice arena | Cricket Fantasy",
  description:
    "Explore a fictional local snake draft and the cricket fantasy scoring rules.",
};

export default function DemoPage() {
  return (
    <div className="demo-shell">
      <a href="#practice-content" className="skip-link">
        Skip to practice
      </a>
      <header className="demo-topbar">
        <Brand compact />
        <nav aria-label="Practice arena navigation">
          <a href="#draft">Draft</a>
          <a href="#scoring">Scoring</a>
          <Link href="/dashboard">Your leagues</Link>
        </nav>
        <Badge tone="amber" dot>
          FICTIONAL · LOCAL
        </Badge>
      </header>
      <main id="practice-content" className="demo-content">
        <PageHeading
          eyebrow="PRACTICE ARENA"
          title="The practice room."
          description="Try a snake draft and explore cricket fantasy scoring. Your real leagues stay untouched."
        />
        <div className="demo-disclaimer">
          <strong>Fictional players &amp; ratings.</strong>
          <span>Local picks reset when you refresh.</span>
        </div>
        <div id="draft">
          <DraftPlayground />
        </div>
        <div id="scoring">
          <ScoringPlayground />
        </div>
        <footer className="demo-footer">
          <span>Cricket Fantasy · Practice arena</span>
          <span>Fictional demonstration data · No live feed</span>
        </footer>
      </main>
      <ApplicationNavigation surface="mobile" />
    </div>
  );
}
