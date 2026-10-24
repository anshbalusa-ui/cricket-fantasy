"use client";

import { useState } from "react";
import { managerAtSnakePick } from "@/lib/fantasy/draft";
import { demoManagers, demoPlayers } from "@/lib/demo/fixtures";

const PICK_ROUNDS = 3; // Compact demo only: real leagues draft 10 players per manager.
const PICK_LIMIT = demoManagers.length * PICK_ROUNDS;

export function DraftPlayground() {
  const [pickedIds, setPickedIds] = useState<string[]>([]);
  const pickNumber = pickedIds.length;
  const finished = pickNumber >= PICK_LIMIT;
  const managerIndex = finished ? null : managerAtSnakePick(pickNumber, demoManagers.length);
  const manager = managerIndex === null ? null : demoManagers[managerIndex];
  const draftRound = Math.floor(pickNumber / demoManagers.length) + 1;

  function pick(playerId: string) {
    if (finished || pickedIds.includes(playerId)) return;
    setPickedIds((prev) => [...prev, playerId]);
  }

  return (
    <section className="demo-panel draft-panel">
      <div className="demo-panel-head">
        <div>
          <span className="section-kicker">INTERACTIVE DEMO</span>
          <h2>Snake draft room</h2>
          <p>Six fictional managers. Three fast rounds. Exclusive picks and reversal each round.</p>
        </div>
        <button type="button" className="button button-outline button-small" onClick={() => setPickedIds([])}>Reset draft</button>
      </div>
      <div className="draft-current" aria-live="polite">
        <span className="draft-status">ON THE CLOCK</span>
        <strong>{finished ? "Draft complete" : manager?.name}</strong>
        <span>{finished ? "All 18 sample players drafted" : "Pick " + (pickNumber + 1) + " of " + PICK_LIMIT + " · Round " + draftRound}</span>
      </div>
      <div className="draft-grid">
        <div className="draft-player-list">
          <div className="draft-table-head"><span>PLAYER</span><span>ROLE</span><span>STATUS</span></div>
          {demoPlayers.map((player) => {
            const pickedIndex = pickedIds.indexOf(player.id);
            const taken = pickedIndex !== -1;
            const by = taken ? demoManagers[managerAtSnakePick(pickedIndex, demoManagers.length)] : null;
            return (
              <div className="draft-player-row" key={player.id}>
                <div className="draft-person"><span className="avatar">{player.name.split(" ").map((n) => n[0]).join("")}</span><span><strong>{player.name}</strong><small>{player.team}</small></span></div>
                <span className="role-label">{player.role}</span>
                <button type="button" className={taken ? "draft-picked" : "draft-pick"} disabled={taken || finished} onClick={() => pick(player.id)} aria-label={taken ? player.name + " drafted by " + by?.name : "Draft " + player.name}>
                  {taken ? by?.initials : "DRAFT +" }
                </button>
              </div>
            );
          })}
        </div>
        <aside className="draft-board">
          <h3>Draft order</h3>
          <p>Reverses each round</p>
          {demoManagers.map((entry, index) => {
            const count = pickedIds.filter((_, pickIndex) => managerAtSnakePick(pickIndex, demoManagers.length) === index).length;
            return (
              <div className={"draft-manager " + (managerIndex === index ? "active" : "")} key={entry.id}>
                <span className="mini-emblem">{entry.initials}</span><span className="draft-manager-name">{entry.name}</span>
                <span className="draft-manager-count">{count}/{PICK_ROUNDS}</span>
              </div>
            );
          })}
          <div className="draft-note">This is local browser state only. Production drafts will need authenticated, atomic server picks.</div>
        </aside>
      </div>
    </section>
  );
}
