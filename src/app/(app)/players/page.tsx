import Link from "next/link";
import { PlayerDirectory } from "@/components/catalog/player-directory";
import { Badge, EmptyState, PageHeading } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icon";
import { getPlayerCatalog } from "@/lib/catalog/queries";
import "../../catalog.css";

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string; q?: string }>;
}) {
  const query = await searchParams;
  const catalog = await getPlayerCatalog(query.season);
  return (
    <div className="app-page">
      <PageHeading
        eyebrow="THE PLAYER POOL"
        title="Players"
        description="Know your picks. Explore recorded cricket performances before you enter the draft."
        actions={
          <Link className="button button-secondary" href="/leagues">
            My leagues <Icon name="arrowRight" size={16} />
          </Link>
        }
      />
      {catalog ? (
        <>
          <div className="catalog-season-note">
            <span>
              <Badge tone="blue">Historical replay</Badge>{" "}
              <strong>{catalog.season.name}</strong>
            </span>
            <span>
              {catalog.players.length} players · {catalog.matchCount} source
              matches
            </span>
          </div>
          <PlayerDirectory
            players={catalog.players}
            seasonId={catalog.season.id}
            seasons={catalog.seasons}
            initialSearch={
              typeof query.q === "string" ? query.q.slice(0, 80) : ""
            }
          />
          <aside className="catalog-attribution" aria-label="Data provenance">
            <p>
              Match data:{" "}
              <a href="https://cricsheet.org/" target="_blank" rel="noreferrer">
                Cricsheet
              </a>{" "}
              ·{" "}
              <a
                href={catalog.source.license_url}
                target="_blank"
                rel="noreferrer"
              >
                Open Data Commons Attribution License
              </a>
              . Recorded historical statistics, not live scores or projections.
            </p>
            <p>{catalog.source.role_policy}</p>
          </aside>
        </>
      ) : (
        <EmptyState
          icon="users"
          title="No imported season available."
          description="The player pool appears after verified cricket data has been imported. No fictional players are used for private-league drafts."
          action={
            <Link className="button button-secondary" href="/leagues">
              Back to leagues
            </Link>
          }
        />
      )}
    </div>
  );
}
