"use client";

import { useActionState, useEffect, useState } from "react";
import { SubmitButton } from "@/components/forms/submit-button";
import {
  createLeague,
  createInvitation,
  joinLeague,
  leaveLeague,
  renameLeague,
  renameTeam,
  revokeInvitation,
  type LeagueActionState,
} from "@/lib/leagues/actions";

const initialState: LeagueActionState = {};
function ActionMessage({ state }: { state: LeagueActionState }) {
  if (state.error)
    return (
      <p className="notice notice-error" role="alert">
        {state.error}
      </p>
    );
  if (state.success)
    return (
      <p className="notice notice-success" role="status">
        {state.success}
      </p>
    );
  return null;
}

export function CreateLeagueForm({
  seasons,
}: {
  seasons: {
    id: string;
    name: string;
    year: number;
    competition: { name: string; slug: string };
  }[];
}) {
  const [state, action] = useActionState(createLeague, initialState);
  const [leagueName, setLeagueName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [seasonId, setSeasonId] = useState("");
  // Server-action validation failures must not reset the controlled season.
  return (
    <form
      action={action}
      className="app-form"
      onReset={(event) => event.preventDefault()}
    >
      <div className="app-field">
        <label htmlFor="leagueName">League name</label>
        <input
          id="leagueName"
          name="leagueName"
          value={leagueName}
          onChange={(event) => setLeagueName(event.currentTarget.value)}
          autoComplete="off"
          maxLength={60}
          required
          placeholder="Sunday Night Cricket"
        />
        <span className="app-help">
          Up to 60 characters. Choose a name your group will recognize.
        </span>
      </div>
      <div className="app-field">
        <label htmlFor="teamName">Your team name</label>
        <input
          id="teamName"
          name="teamName"
          value={teamName}
          onChange={(event) => setTeamName(event.currentTarget.value)}
          autoComplete="off"
          maxLength={40}
          required
          placeholder="The Yorkers"
        />
        <span className="app-help">
          Up to 40 characters. You can change this later in the lobby.
        </span>
      </div>
      <div className="app-field">
        <label htmlFor="seasonId">Competition season</label>
        <select
          id="seasonId"
          name="seasonId"
          required
          value={seasonId}
          onChange={(event) => setSeasonId(event.currentTarget.value)}
        >
          <option value="" disabled>
            Select a season
          </option>
          {seasons.map((season) => (
            <option key={season.id} value={season.id}>
              {season.competition.name} · {season.name} ({season.year})
            </option>
          ))}
        </select>
        <span className="app-help">
          Season catalogue and membership setup only. Fixtures, live scores and
          scoring are not available.
        </span>
      </div>
      <ActionMessage state={state} />
      <SubmitButton
        className="button button-primary"
        pendingLabel="Creating league…"
      >
        Create private league
      </SubmitButton>
    </form>
  );
}

export function JoinLeagueForm({ token }: { token: string }) {
  const [state, action] = useActionState(joinLeague, initialState);
  const [invitationToken, setInvitationToken] = useState(token);
  const [teamName, setTeamName] = useState("");
  return (
    <form action={action} className="app-form">
      <div className="app-field">
        <label htmlFor="token">Invitation token</label>
        <input
          id="token"
          name="token"
          autoComplete="off"
          spellCheck={false}
          value={invitationToken}
          onChange={(event) => setInvitationToken(event.currentTarget.value)}
          required
          pattern="[a-f0-9]{64}"
          maxLength={64}
          aria-describedby="token-help"
        />
        <span className="app-help" id="token-help">
          Use the private invitation link from a league commissioner. League
          details stay hidden until you join.
        </span>
      </div>
      <div className="app-field">
        <label htmlFor="teamName">Your team name</label>
        <input
          id="teamName"
          name="teamName"
          value={teamName}
          onChange={(event) => setTeamName(event.currentTarget.value)}
          autoComplete="off"
          maxLength={40}
          required
          placeholder="The Yorkers"
        />
      </div>
      <ActionMessage state={state} />
      <SubmitButton
        className="button button-primary"
        pendingLabel="Joining league…"
      >
        Join private league
      </SubmitButton>
    </form>
  );
}

export function RenameTeamForm({
  leagueId,
  currentName,
}: {
  leagueId: string;
  currentName: string;
}) {
  const [state, action] = useActionState(
    renameTeam.bind(null, leagueId),
    initialState,
  );
  const [teamName, setTeamName] = useState(currentName);
  return (
    <form action={action} className="app-form">
      <div className="app-field">
        <label htmlFor={`teamName-${leagueId}`}>Team name</label>
        <input
          id={`teamName-${leagueId}`}
          name="teamName"
          value={teamName}
          onChange={(event) => setTeamName(event.currentTarget.value)}
          maxLength={40}
          required
        />
      </div>
      <ActionMessage state={state} />
      <SubmitButton className="button button-secondary" pendingLabel="Saving…">
        Save team name
      </SubmitButton>
    </form>
  );
}

export function RenameLeagueForm({
  leagueId,
  currentName,
}: {
  leagueId: string;
  currentName: string;
}) {
  const [state, action] = useActionState(
    renameLeague.bind(null, leagueId),
    initialState,
  );
  const [leagueName, setLeagueName] = useState(currentName);
  return (
    <form action={action} className="app-form">
      <div className="app-field">
        <label htmlFor={`leagueName-${leagueId}`}>League name</label>
        <input
          id={`leagueName-${leagueId}`}
          name="leagueName"
          value={leagueName}
          onChange={(event) => setLeagueName(event.currentTarget.value)}
          maxLength={60}
          required
        />
      </div>
      <ActionMessage state={state} />
      <SubmitButton className="button button-secondary" pendingLabel="Saving…">
        Save league name
      </SubmitButton>
    </form>
  );
}

export function LeaveLeagueButton({ leagueId }: { leagueId: string }) {
  const [state, action] = useActionState(
    leaveLeague.bind(null, leagueId),
    initialState,
  );
  return (
    <form action={action} className="app-form">
      <ActionMessage state={state} />
      <SubmitButton className="button button-danger" pendingLabel="Leaving…">
        Leave this league
      </SubmitButton>
      <span className="app-help">
        Leaving is available to managers only while the league is in its lobby.
      </span>
    </form>
  );
}

export function InvitationControls({
  leagueId,
  invitation,
  capacityReached,
}: {
  leagueId: string;
  invitation: { id: string; expires_at: string } | null;
  capacityReached: boolean;
}) {
  const [createState, createAction] = useActionState(
    createInvitation.bind(null, leagueId),
    initialState,
  );
  const [revokeState, revokeAction] = useActionState(
    revokeInvitation.bind(null, leagueId, invitation?.id ?? ""),
    initialState,
  );
  const [sharedToken, setSharedToken] = useState<string | null>(null);
  const [revoked, setRevoked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [clipboardMessage, setClipboardMessage] = useState<string | null>(null);
  useEffect(() => {
    if (createState.token) {
      setSharedToken(createState.token);
      setCopied(false);
      setClipboardMessage(null);
    }
  }, [createState.token]);
  useEffect(() => {
    if (revokeState.success) {
      setRevoked(true);
      setSharedToken(null);
      setCopied(false);
      setClipboardMessage(null);
    }
  }, [revokeState.success]);
  useEffect(() => setRevoked(false), [invitation?.id]);
  const link =
    sharedToken && typeof window !== "undefined"
      ? `${window.location.origin}/join?token=${encodeURIComponent(sharedToken)}`
      : "";
  async function copyLink() {
    if (!link) return;
    if (!navigator.clipboard) {
      setClipboardMessage(
        "Clipboard access is unavailable. Select the link above and copy it manually.",
      );
      return;
    }
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setClipboardMessage(null);
    } catch {
      setClipboardMessage(
        "Could not copy automatically. Select the link above and copy it manually.",
      );
    }
  }
  const activeInvitation = invitation && !revoked ? invitation : null;
  return (
    <section className="app-card" aria-labelledby="invite-title">
      <p className="eyebrow">PRIVATE ACCESS</p>
      <h2 id="invite-title">Invite managers</h2>
      <p className="app-muted">
        Share a private link with people you trust. Links expire after seven
        days and can be revoked.
      </p>
      {activeInvitation && (
        <p className="app-help">
          Active invitation expires{" "}
          <time dateTime={activeInvitation.expires_at}>
            {new Date(activeInvitation.expires_at)
              .toISOString()
              .replace("T", " ")
              .slice(0, 16)}{" "}
            UTC
          </time>
          . Its secret is only available when created; revoke it to generate a
          replacement.
        </p>
      )}
      {sharedToken ? (
        <div className="app-form">
          <div className="app-field">
            <label htmlFor="invite-link">Shareable invitation link</label>
            <input
              id="invite-link"
              readOnly
              value={link}
              onFocus={(event) => event.currentTarget.select()}
            />
          </div>
          <button
            type="button"
            className="button button-secondary"
            onClick={copyLink}
            disabled={!link}
          >
            {copied ? "Copied" : "Copy invite link"}
          </button>
          {clipboardMessage && (
            <p className="app-help" role="status">
              {clipboardMessage}
            </p>
          )}
          <ActionMessage state={createState} />
        </div>
      ) : (
        !activeInvitation && (
          <form action={createAction} className="app-form">
            <ActionMessage state={{ error: createState.error }} />
            <SubmitButton
              className="button button-primary"
              pendingLabel="Generating…"
              disabled={capacityReached}
            >
              Generate invitation link
            </SubmitButton>
            {capacityReached && (
              <span className="app-help">
                The league is at capacity; no more managers can join.
              </span>
            )}
          </form>
        )
      )}
      {activeInvitation && (
        <form action={revokeAction} className="app-form invite-revoke">
          <SubmitButton
            className="button button-danger"
            pendingLabel="Revoking…"
          >
            Revoke active invitation
          </SubmitButton>
        </form>
      )}
      <ActionMessage state={revokeState} />
      {!sharedToken && !activeInvitation && (
        <p className="app-help">
          Generating an invitation does not reveal the league to anyone. They
          must join successfully before seeing league details.
        </p>
      )}
    </section>
  );
}
