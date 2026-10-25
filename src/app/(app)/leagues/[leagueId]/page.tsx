import Link from "next/link";
import { notFound } from "next/navigation";
import { LeagueMembers } from "@/components/leagues/lobby";
import { getLeagueDetail } from "@/lib/leagues/queries";
import {
  Avatar,
  Badge,
  EmptyState,
  PageHeading,
  Panel,
  Stat,
} from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icon";
import { MatchupPreview, RosterPreview } from "@/components/fantasy/experience";

const sections = [
  { key: "home", label: "Home" },
  { key: "roster", label: "Roster" },
  { key: "matchup", label: "Matchup" },
  { key: "standings", label: "Standings" },
  { key: "draft", label: "Draft" },
  { key: "managers", label: "Managers" },
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
  const isCommissioner = league.commissioner_user_id === currentUserId;
  const recentMembers = [...members]
    .sort((a, b) => b.joined_at.localeCompare(a.joined_at))
    .slice(0, 4);
  return (
    <div className="app-page">
      <Link href="/leagues" className="app-back">
        <Icon name="arrowLeft" size={17} /> My leagues
      </Link>
      <PageHeading
        eyebrow={`${season.name} · ${season.year} · PRIVATE LEAGUE`}
        title={league.name}
        description={
          <span className="league-hero">
            <Avatar name={league.name} seed={league.id} size="md" />
            <span>
              {ownMember?.team_name} · {members.length} of {league.capacity}{" "}
              managers
            </span>
            <Badge tone={league.status === "lobby" ? "mint" : "neutral"} dot>
              {league.status}
            </Badge>
          </span>
        }
        actions={
          <Link
            href={`/leagues/${league.id}/lobby`}
            className="button button-secondary"
          >
            <Icon name="settings" size={16} /> League lobby
          </Link>
        }
      />
      <nav className="league-tabs" aria-label="League sections">
        {sections.map(({ key, label }) => (
          <Link
            key={key}
            href={`/leagues/${league.id}?tab=${key}`}
            aria-current={activeTab === key ? "page" : undefined}
          >
            {label}
            {["roster", "matchup", "standings", "draft"].includes(key) && (
              <span className="tab-upcoming">Soon</span>
            )}
          </Link>
        ))}
      </nav>
      {activeTab === "home" && (
        <>
          <div className="dashboard-stats">
            <Stat
              label="Managers"
              value={`${members.length}/${league.capacity}`}
              tone="blue"
            />
            <Stat
              label="Season"
              value={season.year}
              hint={season.name}
              tone="amber"
            />
            <Stat
              label="League status"
              value={league.status}
              tone={league.status === "lobby" ? "mint" : "neutral"}
            />
          </div>
          <div className="dashboard-body">
            <Panel eyebrow="LEAGUE SETUP" title="Getting ready">
              <p className="app-muted">
                Your league membership is set. Drafting, rosters, scoring and
                fixtures are upcoming; no results are being shown.
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
                {isCommissioner && (
                  <Link
                    className="action-row"
                    href={`/leagues/${league.id}/lobby`}
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
              <p className="app-help">
                This timeline reflects persisted membership only.
              </p>
            </Panel>
          </div>
        </>
      )}
      {activeTab === "managers" && (
        <div className="dashboard-body">
          <LeagueMembers detail={detail} />
          <Panel eyebrow="MEMBERSHIP" title="League roster">
            <p className="app-muted">
              Manager names, team identities and roles come from this league’s
              persisted memberships.
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
