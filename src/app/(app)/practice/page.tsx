import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { LineupFormatGuide } from "@/components/fantasy/experience";
import { PageHeading, Panel } from "@/components/ui/primitives";

export default function PracticePage() {
  return (
    <div className="app-page">
      <PageHeading
        eyebrow="HOW TO PLAY"
        title="Draft fifteen. Field eleven."
        description="Four reserves. One private league. A whole season of head-to-head cricket."
        actions={
          <Link className="button button-primary" href="/leagues">
            My leagues <Icon name="arrowRight" size={16} />
          </Link>
        }
      />
      <div className="practice-grid">
        <LineupFormatGuide />
        <Panel
          eyebrow="FROM DRAFT TO CHAMPION"
          title="Your season, step by step"
        >
          <ol className="rules-steps">
            <li>
              <strong>Bring six managers.</strong>
              <p>
                Create a private league and share its invitation link. Only
                members can see your league.
              </p>
            </li>
            <li>
              <strong>Draft fifteen players each.</strong>
              <p>
                The pick order reverses every round. Each real player can belong
                to only one team inside your league. A server clock and
                automatic selections keep the room moving.
              </p>
            </li>
            <li>
              <strong>Choose a balanced XI.</strong>
              <p>
                Field two batters, two bowlers, two all-rounders, one
                wicketkeeper and four flex players. Your other four players sit
                on the bench.
              </p>
            </li>
            <li>
              <strong>Lock and replay a round.</strong>
              <p>
                In historical mode, the commissioner explicitly locks the
                current round. Your XI scores from recorded cricket matches; a
                player’s points are averaged across eligible appearances, not
                multiplied by extra fixtures.
              </p>
            </li>
            <li>
              <strong>Win the head-to-head.</strong>
              <p>
                Play five regular-season rounds. The top four advance to
                semifinals and a final. A tied playoff goes to the higher
                regular-season seed.
              </p>
            </li>
          </ol>
          <p className="app-help">
            This is a historical replay, not a live feed. Player match histories
            show the original source and every fantasy-point component.
          </p>
          <Link className="text-link" href="/players">
            Explore the real player pool <Icon name="arrowRight" size={15} />
          </Link>
        </Panel>
      </div>
      <p className="app-help">
        Want a short lesson first? The{" "}
        <Link className="text-link" href="/demo">
          fictional three-round practice draft
        </Link>{" "}
        is a separate browser-only tutorial, not your persisted league.
      </p>
    </div>
  );
}
