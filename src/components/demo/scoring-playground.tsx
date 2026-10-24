"use client";

import { useState } from "react";
import { scorePlayerMatch, SCORING_VERSION } from "@/lib/fantasy/scoring";
import { ZERO_STATS } from "@/lib/fantasy/types";

function Counter({ label, value, onChange, max }: { label: string; value: number; onChange: (v: number) => void; max: number }) {
  return (
    <div className="stat-counter">
      <label>{label}</label>
      <div className="counter-control">
        <button type="button" aria-label={"Decrease " + label} disabled={value === 0} onClick={() => onChange(Math.max(0, value - 1))}>−</button>
        <output aria-label={label}>{value}</output>
        <button type="button" aria-label={"Increase " + label} disabled={value === max} onClick={() => onChange(Math.min(max, value + 1))}>+</button>
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
  const scored = scorePlayerMatch({
    ...ZERO_STATS, runs, fours, sixes, wickets, catches,
    ballsFaced: Math.max(1, runs),
  }, "ALL");

  return (
    <section className="demo-panel scoring-panel">
      <div className="demo-panel-head">
        <div><span className="section-kicker">SCORING ENGINE</span><h2>Every contribution counts.</h2><p>Change these sample numbers to see the published v0.1 scoring formula in action.</p></div>
        <span className="version-badge">{SCORING_VERSION}</span>
      </div>
      <div className="scoring-content">
        <div className="stats-control-grid">
          <Counter label="Runs" value={runs} onChange={setRuns} max={120} />
          <Counter label="Fours" value={fours} onChange={setFours} max={20} />
          <Counter label="Sixes" value={sixes} onChange={setSixes} max={15} />
          <Counter label="Wickets" value={wickets} onChange={setWickets} max={6} />
          <Counter label="Catches" value={catches} onChange={setCatches} max={6} />
        </div>
        <div className="total-card">
          <span>EXAMPLE FANTASY POINTS</span>
          <strong>{scored.total}</strong>
          <p>Batting: {scored.runs + scored.boundaries + scored.battingMilestone} · Bowling: {scored.wickets + scored.bowlingMilestone} · Fielding: {scored.fielding}</p>
          <small>Sample arithmetic only. This is not a valid-match statistics validator or a live feed.</small>
        </div>
      </div>
    </section>
  );
}
