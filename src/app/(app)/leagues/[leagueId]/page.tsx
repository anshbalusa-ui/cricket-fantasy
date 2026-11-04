import Link from "next/link";
import { notFound } from "next/navigation";
import { getLeagueDetail } from "@/lib/leagues/queries";
import { getLeagueGame } from "@/lib/gameplay/queries";
import { getSeasonWindows } from "@/lib/catalog/queries";
import { LeagueWorkspace } from "@/components/gameplay/workspace";
import { Badge } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icon";
import { LeagueHeading } from "@/components/leagues/heading";
import { LeagueNavigation } from "@/components/leagues/navigation";

const sections = [
  { key: "home", label: "Home" },
  { key: "roster", label: "Roster" },
  { key: "matchup", label: "Matchup" },
  { key: "standings", label: "Standings" },
  { key: "draft", label: "Draft" },
  { key: "managers", label: "Managers" },
  { key: "players", label: "Players" },
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
  const [detail, game] = await Promise.all([
    getLeagueDetail(leagueId),
    getLeagueGame(leagueId),
  ]);
  if (!detail || !game) notFound();
  const calendar = await getSeasonWindows(game.league.seasonId);
  const { league, season, members, currentUserId } = detail;
  const requested = typeof query.tab === "string" ? query.tab : "home";
  const activeTab: Section = sections.some(({ key }) => key === requested)
    ? (requested as Section)
    : "home";
  const ownMember = members.find(({ user_id }) => user_id === currentUserId);
  return (
    <div className="app-page">
      <LeagueHeading
        leagueId={league.id}
        leagueName={league.name}
        seasonName={season.name}
        description={
          <span className="league-hero">
            <span>{ownMember?.team_name ?? "Your team"}</span>
            <Badge tone="mint">Historical replay</Badge>
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
      <LeagueWorkspace
        key={league.id}
        initial={game}
        tab={activeTab}
        calendar={calendar}
      />
    </div>
  );
}
