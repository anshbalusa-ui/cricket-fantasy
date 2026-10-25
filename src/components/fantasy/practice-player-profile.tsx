"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import type { DemoPlayer } from "@/lib/demo/fixtures";
import { Avatar, Badge } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icon";
import { RoleBadge } from "./experience";

export function PracticePlayerProfile({
  player,
  rating,
  onClose,
  action,
}: {
  player: DemoPlayer | null;
  rating: number | undefined;
  onClose: () => void;
  action?: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (player && !element.open) element.showModal();
    if (!player && element.open) element.close();
  }, [player]);

  return (
    <dialog
      ref={dialog}
      className="fantasy-profile-dialog"
      aria-labelledby={titleId}
      onCancel={onClose}
      onClose={onClose}
    >
      {player && (
        <>
          <div className="fantasy-profile-top">
            <Badge tone="amber">Fictional practice</Badge>
            <button
              type="button"
              className="button button-ghost button-icon"
              aria-label="Close player profile"
              onClick={onClose}
            >
              <Icon name="close" />
            </button>
          </div>
          <header className="fantasy-profile-identity">
            <Avatar name={player.name} seed={player.id} size="xl" />
            <div>
              <p className="eyebrow">PLAYER PROFILE</p>
              <h2 id={titleId}>{player.name}</h2>
              <div className="fantasy-profile-team">
                <RoleBadge role={player.role} />
                <span>{player.team}</span>
              </div>
            </div>
          </header>
          <div className="fantasy-profile-rating">
            <div>
              <span>Practice draft rating</span>
              <strong>
                {rating ?? "—"}
                <small> / 100</small>
              </strong>
            </div>
            <p>
              A fictional demonstration rating, not verified performance or
              fantasy points.
            </p>
          </div>
          <section className="fantasy-profile-performance">
            <div>
              <h3>Performance</h3>
              <Badge>Not imported</Badge>
            </div>
            <dl>
              <div>
                <dt>Runs</dt>
                <dd>—</dd>
              </div>
              <div>
                <dt>Wickets</dt>
                <dd>—</dd>
              </div>
              <div>
                <dt>Fantasy points</dt>
                <dd>—</dd>
              </div>
            </dl>
            <p>No historical match records or live statistics are available.</p>
          </section>
          <div className="fantasy-profile-match">
            <Icon name="calendar" size={18} />
            <p>
              <strong>Match information unavailable</strong>
              <span>
                This player and franchise are fictional. No real fixture is
                attached.
              </span>
            </p>
          </div>
          <footer className="fantasy-profile-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={onClose}
            >
              Back to players
            </button>
            {action}
          </footer>
        </>
      )}
    </dialog>
  );
}
