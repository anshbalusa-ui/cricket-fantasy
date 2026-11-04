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
import { BENCH_COUNT, SQUAD_SIZE, STARTER_COUNT } from "@/lib/fantasy/lineup";

export default async function DashboardPage() {
  const [{ user }, leagues, seasons] = await Promise.all([
    getMyProfile("/dashboard"),
    getMyLeagues(),
    getAvailableSeasons(),
  ]);
  const season = seasons.find(
    (entry) => entry.competition.slug === "mlc" && entry.dataAvailable,
  );
  const openLeagues = leagues.filter(
    (league) =>
      league.commissioner_user_id === user.id &&
      league.status === "lobby" &&
      league.member_count < league.capacity,
  );
  const drafting = leagues.filter((league) => league.status === "drafting");
  const focusLeague =
    drafting[0] ??
    leagues.find((league) => league.status === "active") ??
    leagues.find((league) => league.status === "lobby") ??
    leagues[0];
  const focusTab =
    focusLeague?.status === "drafting" ||
    (focusLeague?.status === "lobby" &&
      focusLeague.member_count === focusLeague.capacity)
      ? "draft"
      : focusLeague?.status === "active"
        ? "roster"
        : focusLeague?.status === "completed"
          ? "standings"
          : "home";
  const focusTitle =
    focusLeague?.status === "drafting"
      ? "Your draft room is waiting."
      : focusLeague?.status === "active"
        ? "Set your XI. Back your picks."
        : focusLeague?.status === "completed"
          ? "The season has its story."
          : "Your league starts with your people.";
  const focusAction =
    focusTab === "draft"
      ? "Enter draft room"
      : focusTab === "roster"
        ? "Manage my team"
        : focusTab === "standings"
          ? "See the final standings"
          : "Open league";
  return (
    <div className="app-page">
      <PageHeading
        eyebrow="YOUR CRICKET CIRCLE"
        title="Home"
        description="Your teams, draft rooms and next round."
        actions={
          <Link className="button button-primary" href="/leagues/new">
            <Icon name="plus" size={17} /> Create league
          </Link>
        }
      />
      <section className="dashboard-intro">
        <div>
          <p className="eyebrow">
            {season?.name ?? "MAJOR LEAGUE CRICKET"} · HISTORICAL REPLAY
          </p>
          <h2>{focusTitle}</h2>
          <p>
            {focusLeague
              ? `${focusLeague.name} · ${focusLeague.my_team_name}. Your draft, roster and season results stay with your league.`
              : `Draft ${SQUAD_SIZE} real players, choose your starting XI and play your friends head-to-head through a recorded MLC season.`}
          </p>
        </div>
        <Link
          href={
            focusLeague
              ? `/leagues/${focusLeague.id}?tab=${focusTab}`
              : "/leagues/new"
          }
          className="button button-primary"
        >
          {focusLeague ? focusAction : "Create your first league"}
          <Icon name="arrowRight" size={16} />
        </Link>
      </section>
      <div className="dashboard-stats">
        <Stat label="Your leagues" value={leagues.length} tone="mint" />
        <Stat label="Drafts underway" value={drafting.length} tone="blue" />
        <Stat
          label="Your squad format"
          value={`${STARTER_COUNT} + ${BENCH_COUNT}`}
          hint={`${SQUAD_SIZE} exclusive draft picks`}
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
              {leagues.slice(0, 6).map((league) => (
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
                    tone={
                      league.status === "drafting"
                        ? "mint"
                        : league.status === "active"
                          ? "blue"
                          : league.status === "completed"
                            ? "amber"
                            : "neutral"
                    }
                    dot
                  >
                    {league.status === "active"
                      ? "Season open"
                      : league.status === "completed"
                        ? "Final"
                        : league.status}
                  </Badge>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="users"
              title="Your first league is waiting."
              description="Make a private room for your group, or join with a commissioner’s invitation."
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
        <Panel eyebrow="THE NEXT MOVE" title="Make it your season">
          <div className="dashboard-next">
            {openLeagues[0] && (
              <Link
                href={`/leagues/${openLeagues[0].id}/lobby#league-invitation`}
                className="action-row"
              >
                <span className="action-row-icon">
                  <Icon name="link" size={18} />
                </span>
                <span className="action-row-copy">
                  <strong>Bring your managers</strong>
                  <small>
                    {openLeagues[0].name} · create or share an invitation.
                  </small>
                </span>
                <Icon name="arrowRight" size={16} />
              </Link>
            )}
            <Link href="/players" className="action-row">
              <span className="action-row-icon">
                <Icon name="users" size={18} />
              </span>
              <span className="action-row-copy">
                <strong>Know the player pool</strong>
                <small>
                  Real historical runs, wickets and fantasy-point breakdowns.
                </small>
              </span>
              <Icon name="arrowRight" size={16} />
            </Link>
            <Link href="/practice" className="action-row">
              <span className="action-row-icon">
                <Icon name="shirt" size={18} />
              </span>
              <span className="action-row-copy">
                <strong>Learn the format</strong>
                <small>Fifteen picks, a starting XI and four reserves.</small>
              </span>
              <Icon name="arrowRight" size={16} />
            </Link>
          </div>
          <p className="app-help">
            Historical cricket, real league decisions. Rounds are locked and
            replayed explicitly; no live feed or projected scores are implied.
          </p>
        </Panel>
      </div>
    </div>
  );
}
