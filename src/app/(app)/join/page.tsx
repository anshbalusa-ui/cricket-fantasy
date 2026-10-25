import Link from "next/link";
import { JoinLeagueForm } from "@/components/leagues/forms";
import { Icon } from "@/components/ui/icon";
import { PageHeading, Panel } from "@/components/ui/primitives";

type JoinPageProps = { searchParams: Promise<{ token?: string | string[] }> };
export default async function JoinPage({ searchParams }: JoinPageProps) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";
  return (
    <div className="app-page">
      <Link href="/leagues" className="app-back">
        <Icon name="arrowLeft" size={17} /> My leagues
      </Link>
      <PageHeading
        eyebrow="PRIVATE INVITATION"
        title="Join a league"
        description="Enter your invitation and pick a team name your league mates will recognize."
      />
      <Panel
        eyebrow="MEMBERSHIP"
        title="Accept an invitation"
        className="form-panel"
      >
        <div className="future-note">
          League details stay private until you successfully join. Invitation
          links are issued by a league commissioner.
        </div>
        <JoinLeagueForm token={token} />
      </Panel>
    </div>
  );
}
