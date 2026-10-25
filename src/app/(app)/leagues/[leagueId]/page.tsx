import Link from "next/link";
import { notFound } from "next/navigation";
import { LeagueMembers } from "@/components/leagues/lobby";
import { getLeagueDetail } from "@/lib/leagues/queries";
import { Badge, EmptyState, Panel } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icon";
import { MatchupPreview, RosterPreview } from "@/components/fantasy/experience";
import { LeagueHeading } from "@/components/leagues/heading";
import { LeagueNavigation } from "@/components/leagues/navigation";

const sections = [
  { key: "home", label: "Home", upcoming: false },
  { key: "roster", label: "Roster", upcoming: true },
  { key: "matchup", label: "Matchup", upcoming: true },
  { key: "standings", label: "Standings", upcoming: true },
  { key: "draft", label: "Draft", upcoming: true },
  { key: "managers", label: "Managers", upcoming: false },
] as const;
type Section = (typeof sections)[number]["key"];
type LeaguePageProps = {
  params: Promise<{ leagueId: string }>;
  searchParams: Promise<{ tab?: string | string[] }>;
};

export default async function LeaguePage({
  params,
  searchParams,
}: LeaguePageProps) {
  const [{ leagueId }, query] = await Promise.all([params, searchParams]);
  const detail = await getLeagueDetail(leagueId);
  if (!detail) notFound();
  const { league, season, members, currentUserId } = detail;
  const requested = typeof query.tab === "string" ? query.tab : "home";
  const activeTab: Section = sections.some(({ key }) => key === requested)
    ? (requested as Section)
    : "home";
  const ownMember = members.find(({ user_id }) => user_id === currentUserId);
  const canInvite =
    league.commissioner_user_id === currentUserId &&
    league.status === "lobby" &&
    members.length < league.capacity;
  const recentMembers = [...members]
    .sort((a, b) => b.joined_at.localeCompare(a.joined_at))
    .slice(0, 4);
  return (
    <div className="app-page">
      <LeagueHeading
        leagueId={league.id}
        leagueName={league.name}
        seasonName={season.name}
        description={
          <span className="league-hero">
            <span>{ownMember?.team_name ?? "Your team"}</span>
            <Badge tone={league.status === "lobby" ? "mint" : "neutral"} dot>
              {league.status}
            </Badge>
          </span>
        }
        actions={
          <Link
            href={`/leagues/${league.id}/lobby`}
            className="button button-secondary league-lobby-button"
            aria-label="League lobby and settings"
          >
            <Icon name="settings" size={18} />
            <span className="league-lobby-label">League lobby</span>
          </Link>
        }
      />
      <LeagueNavigation
        leagueId={league.id}
        activeTab={activeTab}
        sections={sections}
      />
      {activeTab === "home" && (
        <>
          <div className="dashboard-body">
            <Panel
              eyebrow="LEAGUE SETUP"
              title={
                members.length < league.capacity
                  ? "Fill the room"
                  : "The room is full"
              }
            >
              <p className="app-muted">
                Your league is taking shape. Meet your managers or fine-tune
                your team identity in the lobby.
              </p>
              <p className="app-help">
                Player drafting and scoring are coming soon.
              </p>
              <div className="setup-progress">
                <span>League capacity</span>
                <span
                  className="setup-track"
                  role="progressbar"
                  aria-label="League membership capacity"
                  aria-valuemin={0}
                  aria-valuemax={league.capacity}
                  aria-valuenow={members.length}
                >
                  <span
                    style={{
                      width: `${Math.min(100, (members.length / league.capacity) * 100)}%`,
                    }}
                  />
                </span>
                <span>
                  {members.length}/{league.capacity}
                </span>
              </div>
              <div className="next-steps">
                {canInvite && (
                  <Link
                    className="action-row"
                    href={`/leagues/${league.id}/lobby#league-invitation`}
                  >
                    <span className="action-row-icon">
                      <Icon name="link" size={18} />
                    </span>
                    <span className="action-row-copy">
                      <strong>Invite your group</strong>
                      <small>Generate or manage the private invite link.</small>
                    </span>
                    <Icon name="arrowRight" size={16} />
                  </Link>
                )}
                <Link
                  className="action-row"
                  href={`/leagues/${league.id}?tab=managers`}
                >
                  <span className="action-row-icon">
                    <Icon name="users" size={18} />
                  </span>
                  <span className="action-row-copy">
                    <strong>Meet the managers</strong>
                    <small>View actual members and teams.</small>
                  </span>
                  <Icon name="arrowRight" size={16} />
                </Link>
              </div>
            </Panel>
            <Panel eyebrow="RECENT MEMBERSHIP" title="League activity">
              <div className="activity-list">
                {recentMembers.map((member) => (
                  <div className="activity-item" key={member.user_id}>
                    <span className="activity-dot" />
                    <div>
                      <p>
                        <strong>{member.display_name}</strong> joined the league
                        {member.user_id === currentUserId ? " (you)" : ""}.
                      </p>
                      <time dateTime={member.joined_at}>
                        {new Date(member.joined_at).toLocaleString("en", {
                          dateStyle: "medium",
                          timeStyle: "short",
                          timeZone: "UTC",
                        })}{" "}
                        UTC
                      </time>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </>
      )}
      {activeTab === "managers" && (
        <div className="dashboard-body">
          <LeagueMembers detail={detail} />
          <Panel eyebrow="MEMBERSHIP" title="League roster">
            <p className="app-muted">
              Your league’s managers, team identities and roles.
            </p>
            <Link
              className="button button-secondary"
              href={`/leagues/${league.id}/lobby`}
            >
              Open lobby settings
            </Link>
          </Panel>
        </div>
      )}
      {activeTab === "roster" && (
        <RosterPreview teamName={ownMember?.team_name ?? "Your team"} />
      )}
      {activeTab === "matchup" && (
        <MatchupPreview teamName={ownMember?.team_name} />
      )}
      {activeTab === "standings" && (
        <Panel eyebrow="UPCOMING" title="Standings">
          <EmptyState
            icon="trophy"
            title="Standings aren’t available yet"
            description="This league has no scoring or match results yet. Standings will appear when real league scoring is supported."
            compact
          />
        </Panel>
      )}
      {activeTab === "draft" && (
        <Panel eyebrow="UPCOMING" title="Draft room">
          <EmptyState
            icon="timer"
            title="The draft room is coming later"
            description="This league currently supports membership and lobby management. No multiplayer draft is running or simulated."
            compact
          />
        </Panel>
      )}
    </div>
  );
}
