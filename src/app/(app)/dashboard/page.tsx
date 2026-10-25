import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import {
  Avatar,
  Badge,
  EmptyState,
  PageHeading,
  Panel,
  Stat,
} from "@/components/ui/primitives";
import { getMyProfile } from "@/lib/users/queries";
import { getMyLeagues } from "@/lib/leagues/queries";
import { getAvailableSeasons } from "@/lib/competitions/queries";

export default async function DashboardPage() {
  const [{ user }, leagues, availableSeasons] = await Promise.all([
    getMyProfile("/dashboard"),
    getMyLeagues(),
    getAvailableSeasons(),
  ]);
  const mlcSeason = availableSeasons
    .filter((season) => season.competition.slug === "mlc")
    .sort((a, b) => b.year - a.year)[0];
  const commissionerLeagues = leagues.filter(
    (league) => league.commissioner_user_id === user.id,
  );
  const managerCount = leagues.reduce(
    (total, league) => total + league.member_count,
    0,
  );
  const openCommissionerLeagues = commissionerLeagues.filter(
    (league) => league.member_count < league.capacity,
  );
  const inviteLeague = openCommissionerLeagues[0];
  return (
    <div className="app-page">
      <PageHeading
        eyebrow="YOUR CRICKET CIRCLE"
        title="Home"
        description="Your private leagues and season setup."
        actions={
          <Link className="button button-primary" href="/leagues/new">
            <Icon name="plus" size={17} /> Create league
          </Link>
        }
      />
      <section className="dashboard-intro">
        <div>
          <p className="eyebrow">
            {mlcSeason
              ? `${mlcSeason.competition.name} · ${mlcSeason.name} (${mlcSeason.year}) · ${mlcSeason.status}`
              : "MAJOR LEAGUE CRICKET · SEASON CATALOGUE"}
          </p>
          <h2>Your league starts with your people.</h2>
          <p>
            The season catalogue provides metadata only. Fixtures, live scores
            and scoring aren’t available.
          </p>
        </div>
        <Link href="/leagues" className="button button-secondary">
          Explore my leagues <Icon name="arrowRight" size={16} />
        </Link>
      </section>
      <div className="dashboard-stats">
        <Stat label="Private leagues" value={leagues.length} tone="mint" />
        <Stat label="Manager seats" value={managerCount} tone="blue" />
        <Stat
          label="Leagues with open spots"
          value={openCommissionerLeagues.length}
          hint={
            openCommissionerLeagues.length
              ? "Commissioner invite available"
              : "No open commissioner spots"
          }
          tone="amber"
        />
      </div>
      <div className="dashboard-body">
        <Panel
          eyebrow="YOUR LEAGUES"
          title="The league room"
          action={
            <Link className="text-link" href="/leagues">
              View all
            </Link>
          }
        >
          {leagues.length ? (
            <div className="dashboard-leagues">
              {leagues.slice(0, 4).map((league) => (
                <Link
                  className="league-tile"
                  href={`/leagues/${league.id}`}
                  key={league.id}
                >
                  <Avatar name={league.name} seed={league.id} size="lg" />
                  <span className="league-tile-copy">
                    <strong>{league.name}</strong>
                    <small>{league.my_team_name}</small>
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
              icon="users"
              title="Your first league is waiting."
              description="Create a private space for your group or join with a commissioner’s invitation."
              action={
                <span className="app-actions">
                  <Link className="button button-primary" href="/leagues/new">
                    Create league
                  </Link>
                  <Link className="button button-secondary" href="/join">
                    Join with invite
                  </Link>
                </span>
              }
              compact
            />
          )}
        </Panel>
        <Panel eyebrow="UP NEXT" title="A couple of good moves">
          <div className="dashboard-next">
            {inviteLeague && (
              <Link
                href={`/leagues/${inviteLeague.id}/lobby`}
                className="action-row"
              >
                <span className="action-row-icon">
                  <Icon name="link" size={18} />
                </span>
                <span className="action-row-copy">
                  <strong>Fill your league</strong>
                  <small>
                    {inviteLeague.name} · generate or share an invitation.
                  </small>
                </span>
                <Icon name="arrowRight" size={16} />
              </Link>
            )}
            <Link href="/demo" className="action-row">
              <span className="action-row-icon">
                <Icon name="target" size={18} />
              </span>
              <span className="action-row-copy">
                <strong>Try a practice draft</strong>
                <small>Fictional players. Real snake-order mechanics.</small>
              </span>
              <Icon name="arrowRight" size={16} />
            </Link>
            <Link href="/practice" className="action-row">
              <span className="action-row-icon">
                <Icon name="shirt" size={18} />
              </span>
              <span className="action-row-copy">
                <strong>Learn the lineup</strong>
                <small>Explore the planned starter and bench format.</small>
              </span>
              <Icon name="arrowRight" size={16} />
            </Link>
          </div>
          <p className="app-help">
            Drafting, scoring, schedules and live results aren’t available yet.
            No scores or standings are shown until they’re real.
          </p>
        </Panel>
      </div>
    </div>
  );
}
