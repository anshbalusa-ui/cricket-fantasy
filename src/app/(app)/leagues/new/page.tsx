import Link from "next/link";
import { CreateLeagueForm } from "@/components/leagues/forms";
import { getAvailableSeasons } from "@/lib/competitions/queries";
import { Icon } from "@/components/ui/icon";
import { PageHeading, Panel } from "@/components/ui/primitives";

export default async function NewLeaguePage() {
  const seasons = (await getAvailableSeasons()).filter(
    (season) => season.competition.slug === "mlc" && season.dataAvailable,
  );
  return (
    <div className="app-page">
      <Link href="/leagues" className="app-back">
        <Icon name="arrowLeft" size={17} /> My leagues
      </Link>
      <PageHeading
        eyebrow="CREATE A PRIVATE SPACE"
        title="New league"
        description="Six managers. Fifteen drafted players each. Choose your historical MLC season."
      />
      <Panel
        eyebrow="LEAGUE SETUP"
        title="A place for your cricket circle"
        className="form-panel"
      >
        <p className="app-muted">
          You’ll be the commissioner. After creating the league, generate an
          invite for your managers in the lobby.
        </p>
        {seasons.length ? (
          <CreateLeagueForm seasons={seasons} />
        ) : (
          <div className="app-alert" role="status">
            No verified MLC replay is available to select right now. A season
            needs its real player pool and historical match data before leagues
            can open.
          </div>
        )}
      </Panel>
    </div>
  );
}
