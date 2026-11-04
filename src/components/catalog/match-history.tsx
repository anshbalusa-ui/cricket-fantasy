import { Icon } from "@/components/ui/icon";
import { Badge, Panel } from "@/components/ui/primitives";
import type {
  MatchPointBreakdown,
  PlayerMatchStats,
} from "@/lib/fantasy/types";

type ScoredAppearance = {
  matchId: string;
  date: string;
  opponent: string;
  stats: PlayerMatchStats;
  points: number;
  breakdown: MatchPointBreakdown;
  sourceUrl: string;
  sourceId?: string;
  venue?: string;
};
const pointLabels: Record<
  Exclude<keyof MatchPointBreakdown, "total">,
  string
> = {
  runs: "Batter runs",
  boundaries: "Boundary bonuses",
  battingMilestone: "Batting milestone",
  duck: "Duck adjustment",
  wickets: "Bowler wickets",
  bowlingMilestone: "Wicket-haul bonus",
  maidens: "Maiden overs",
  fielding: "Fielding",
};

export function MatchHistory({
  appearances,
  scoringVersion,
}: {
  appearances: ScoredAppearance[];
  scoringVersion: string;
}) {
  return (
    <Panel
      eyebrow="THE SCORING LEDGER"
      title="Match history"
      action={<Badge>{scoringVersion}</Badge>}
    >
      <p className="app-muted">
        Actual source appearances, including playing-XI appearances with no
        statistical contribution. Expand a match to inspect how its points were
        earned. Round scores average eligible appearances.
      </p>
      <div className="catalog-match-history">
        {appearances.map((appearance) => (
          <details key={appearance.matchId} className="catalog-match-entry">
            <summary>
              <span>
                <strong>v {appearance.opponent}</strong>
                <small>
                  {new Date(`${appearance.date}T12:00:00Z`).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      timeZone: "UTC",
                    },
                  )}{" "}
                  · {appearance.stats.runs} runs · {appearance.stats.wickets}{" "}
                  wickets
                </small>
              </span>
              <strong className="catalog-match-points">
                {appearance.points.toFixed(1)}
                <small>FP</small>
              </strong>
              <Icon name="chevronDown" size={17} />
            </summary>
            <div className="catalog-match-audit">
              <p className="app-help">
                {appearance.venue ? `${appearance.venue} · ` : ""}Historical,
                finalized
                {appearance.sourceId
                  ? ` · Source match ${appearance.sourceId}`
                  : ""}
              </p>
              <dl>
                {Object.entries(pointLabels).map(([key, label]) => (
                  <div key={key}>
                    <dt>{label}</dt>
                    <dd>
                      {appearance.breakdown[key as keyof typeof pointLabels]}
                    </dd>
                  </div>
                ))}
                <div className="catalog-breakdown-total">
                  <dt>Total fantasy points</dt>
                  <dd>{appearance.breakdown.total}</dd>
                </div>
              </dl>
              <p className="app-help">
                {appearance.stats.ballsFaced} balls faced ·{" "}
                {appearance.stats.fours} fours · {appearance.stats.sixes} sixes
                · {appearance.stats.catches} catches ·{" "}
                {appearance.stats.stumpings} stumpings ·{" "}
                {appearance.stats.maidens} maidens
              </p>
              <a
                className="text-link"
                href={appearance.sourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                Source archive
                <Icon name="arrowUpRight" size={14} />
              </a>
            </div>
          </details>
        ))}
      </div>
      {!appearances.length && (
        <p className="app-muted">No recorded appearances in this season.</p>
      )}
    </Panel>
  );
}
