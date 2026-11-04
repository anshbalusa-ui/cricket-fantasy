import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar, Badge, Stat } from "@/components/ui/primitives";
import { RoleBadge } from "@/components/fantasy/experience";
import { Icon } from "@/components/ui/icon";
import { getCatalogPlayer } from "@/lib/catalog/queries";
import { MatchHistory } from "@/components/catalog/match-history";
import "../../../catalog.css";

export default async function PlayerPage({
  params,
  searchParams,
}: {
  params: Promise<{ playerId: string }>;
  searchParams: Promise<{ season?: string; q?: string }>;
}) {
  const [{ playerId }, query] = await Promise.all([params, searchParams]);
  const profile = await getCatalogPlayer(playerId, query.season);
  if (!profile) notFound();
  const { player, season, appearances, source } = profile;
  const back = new URLSearchParams({ season: season.id });
  if (typeof query.q === "string") back.set("q", query.q.slice(0, 80));
  return (
    <div className="app-page">
      <Link href={`/players?${back}`} className="app-back">
        <Icon name="arrowLeft" size={17} /> Player pool
      </Link>
      <header className="catalog-player-hero">
        <Avatar name={player.name} seed={player.id} size="xl" />
        <div>
          <p className="eyebrow">
            {player.franchiseName} · {season.name}
          </p>
          <h1>{player.name}</h1>
          <div className="catalog-player-badges">
            <RoleBadge role={player.role} />
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
        appearances={appearances}
        scoringVersion={profile.scoringVersion}
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
          <a href={source.license_url} target="_blank" rel="noreferrer">
            ODC Attribution
          </a>
          . No live feed, predictions or player photographs are used.
        </p>
      </aside>
    </div>
  );
}
