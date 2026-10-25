import Link from "next/link";
import {
  Avatar,
  Badge,
  EmptyState,
  PageHeading,
  Panel,
} from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icon";
import { getMyLeagues } from "@/lib/leagues/queries";

export default async function LeaguesPage() {
  const leagues = await getMyLeagues();
  return (
    <div className="app-page">
      <PageHeading
        eyebrow="PRIVATE LEAGUES"
        title="My leagues"
        description="Only leagues you’ve joined appear here."
        actions={
          <span className="app-actions">
            <Link className="button button-secondary" href="/join">
              Join a league
            </Link>
            <Link className="button button-primary" href="/leagues/new">
              <Icon name="plus" size={17} /> Create league
            </Link>
          </span>
        }
      />
      <Panel
        eyebrow="YOUR MEMBERSHIPS"
        title={`${leagues.length} ${leagues.length === 1 ? "league" : "leagues"}`}
      >
        {leagues.length ? (
          <div className="app-league-grid">
            {leagues.map((league) => (
              <Link
                className="league-tile"
                href={`/leagues/${league.id}`}
                key={league.id}
              >
                <Avatar name={league.name} seed={league.id} size="lg" />
                <span className="league-tile-copy">
                  <strong>{league.name}</strong>
                  <small>Your team · {league.my_team_name}</small>
                  <span className="league-tile-meta">
                    {league.season.name} · {league.member_count}/
                    {league.capacity} managers
                  </span>
                </span>
                <Badge
                  tone={league.status === "lobby" ? "mint" : "neutral"}
                  dot
                >
                  {league.status}
                </Badge>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="layers"
            title="No leagues on your list yet"
            description="Create a private league for your group, or join one with a commissioner’s invitation link."
            action={
              <span className="app-actions">
                <Link className="button button-primary" href="/leagues/new">
                  Create a league
                </Link>
                <Link className="button button-secondary" href="/join">
                  Join with an invite
                </Link>
              </span>
            }
          />
        )}
      </Panel>
    </div>
  );
}
