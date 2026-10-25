"use client";

import { useState } from "react";
import { scorePlayerMatch, SCORING_VERSION } from "@/lib/fantasy/scoring";
import { ZERO_STATS } from "@/lib/fantasy/types";
import { Panel, Badge } from "@/components/ui/primitives";

function Counter({
  label,
  value,
  onChange,
  max,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  max: number;
}) {
  return (
    <div className="stat-counter" role="group" aria-label={label}>
      <span className="counter-label">{label}</span>
      <div className="counter-control">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          disabled={value === 0}
          onClick={() => onChange(Math.max(0, value - 1))}
        >
          −
        </button>
        <output aria-label={label}>{value}</output>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          disabled={value === max}
          onClick={() => onChange(Math.min(max, value + 1))}
        >
          +
        </button>
      </div>
    </div>
  );
}

export function ScoringPlayground() {
  const [runs, setRuns] = useState(37);
  const [fours, setFours] = useState(4);
  const [sixes, setSixes] = useState(1);
  const [wickets, setWickets] = useState(2);
  const [catches, setCatches] = useState(1);
  const scored = scorePlayerMatch(
    {
      ...ZERO_STATS,
      runs,
      fours,
      sixes,
      wickets,
      catches,
      ballsFaced: Math.max(1, runs),
    },
    "ALL",
  );
  function reset() {
    setRuns(37);
    setFours(4);
    setSixes(1);
    setWickets(2);
    setCatches(1);
  }
  return (
    <Panel
      eyebrow="SCORING PLAYGROUND · FICTIONAL INPUT"
      title="See how a score adds up"
      action={
        <div className="demo-scoring-actions">
          <Badge tone="violet">{SCORING_VERSION}</Badge>
          <button
            type="button"
            className="button button-ghost button-small"
            onClick={reset}
          >
            Reset example
          </button>
        </div>
      }
      className="demo-scoring-panel"
    >
      <p className="demo-panel-description">
        Adjust the sample score line to see the existing scoring formula update.
        Example arithmetic only, not live stats.
      </p>
      <div className="scoring-content">
        <div className="stats-control-grid">
          <Counter label="Runs" value={runs} onChange={setRuns} max={120} />
          <Counter label="Fours" value={fours} onChange={setFours} max={20} />
          <Counter label="Sixes" value={sixes} onChange={setSixes} max={15} />
          <Counter
            label="Wickets"
            value={wickets}
            onChange={setWickets}
            max={6}
          />
          <Counter
            label="Catches"
            value={catches}
            onChange={setCatches}
            max={6}
          />
        </div>
        <div className="total-card">
          <span>EXAMPLE FANTASY POINTS</span>
          <strong aria-live="polite">{scored.total}</strong>
          <dl>
            <div>
              <dt>Runs</dt>
              <dd>{scored.runs}</dd>
            </div>
            <div>
              <dt>Boundary bonus</dt>
              <dd>{scored.boundaries}</dd>
            </div>
            <div>
              <dt>Batting milestone</dt>
              <dd>{scored.battingMilestone}</dd>
            </div>
            <div>
              <dt>Wickets + milestone</dt>
              <dd>{scored.wickets + scored.bowlingMilestone}</dd>
            </div>
            <div>
              <dt>Fielding</dt>
              <dd>{scored.fielding}</dd>
            </div>
          </dl>
          <small>
            mlc-v0.1 scoring policy. Values above are fictional input, not
            verified match data.
          </small>
        </div>
      </div>
    </Panel>
  );
}
