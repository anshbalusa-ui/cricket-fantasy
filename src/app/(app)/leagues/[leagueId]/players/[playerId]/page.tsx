import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar, Badge, Stat } from "@/components/ui/primitives";
import { RoleBadge } from "@/components/fantasy/experience";
import { Icon } from "@/components/ui/icon";
import { MatchHistory } from "@/components/catalog/match-history";
import { getLeagueGame, getPlayerHistory } from "@/lib/gameplay/queries";
import "@/app/catalog.css";

export default async function PlayerHistoryPage({
  params,
}: {
  params: Promise<{ leagueId: string; playerId: string }>;
}) {
  const { leagueId, playerId } = await params;
  const [game, history] = await Promise.all([
    getLeagueGame(leagueId),
    getPlayerHistory(leagueId, playerId),
  ]);
  if (!game || !history) notFound();
  const player = game.players.find((item) => item.id === playerId);
  if (!player) notFound();
  const owner = game.teams.find((team) => team.id === player.ownerTeamId);
  return (
    <div className="app-page">
      <Link href={`/leagues/${leagueId}?tab=players`} className="app-back">
        <Icon name="arrowLeft" size={17} />
        League player pool
      </Link>
      <header className="catalog-player-hero">
        <Avatar name={player.name} seed={player.id} size="xl" />
        <div>
          <p className="eyebrow">
            {player.franchiseName} · {game.league.seasonName}
          </p>
          <h1>{player.name}</h1>
          <div className="catalog-player-badges">
            <RoleBadge role={player.role} />
            <Badge tone={owner ? "neutral" : "mint"}>
              {owner ? `Owned · ${owner.name}` : "Available in this league"}
            </Badge>
            <Badge tone="blue">Historical</Badge>
          </div>
        </div>
      </header>
      <div className="catalog-stats">
        <Stat
          label="FP / appearance"
          value={player.averagePoints.toFixed(1)}
          tone="mint"
        />
        <Stat label="Appearances" value={player.appearances} />
        <Stat label="Runs" value={player.runs} />
        <Stat label="Wickets" value={player.wickets} tone="blue" />
      </div>
      <MatchHistory
        appearances={history.appearances}
        scoringVersion={history.scoringVersion}
      />
      <aside
        className="catalog-attribution"
        aria-label="Player data provenance"
      >
        <p>Eligibility source: {player.roleSource}</p>
        <p>
          Match data by{" "}
          <a href="https://cricsheet.org/" target="_blank" rel="noreferrer">
            Cricsheet
          </a>
          , distributed under{" "}
          <a
            href="https://opendatacommons.org/licenses/by/1.0/"
            target="_blank"
            rel="noreferrer"
          >
            ODC Attribution
          </a>
          . Real recorded results, not a live feed or projection. Player
          ownership is exclusive within this fantasy league, not globally.
        </p>
      </aside>
    </div>
  );
}
