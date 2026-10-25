import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { MatchupPreview, RosterPreview } from "@/components/fantasy/experience";
import { PageHeading } from "@/components/ui/primitives";

export default function PracticePage() {
  return (
    <div className="app-page">
      <PageHeading
        eyebrow="LINEUP GUIDE"
        title="Build your cricket identity."
        description="Eight starters. Two on the bench. Explore the planned format, then try a fictional practice draft."
        actions={
          <Link className="button button-primary" href="/demo">
            Try a practice draft <Icon name="arrowRight" size={16} />
          </Link>
        }
      />
      <div className="practice-grid">
        <RosterPreview teamName="Practice XI" compact />
        <MatchupPreview teamName="Practice XI" />
      </div>
      <p className="app-help">
        These are presentation previews only. They don’t save a roster, draft
        players, or create live cricket data.
      </p>
    </div>
  );
}
