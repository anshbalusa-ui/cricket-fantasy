"use client";

import { useActionState, useEffect, useState } from "react";
import { SubmitButton } from "@/components/forms/submit-button";
import { createLeague, createInvitation, joinLeague, leaveLeague, renameLeague, renameTeam, revokeInvitation, type LeagueActionState } from "@/lib/leagues/actions";

const initialState: LeagueActionState = {};
function ActionMessage({ state }: { state: LeagueActionState }) {
  if (state.error) return <p className="form-message" role="alert">{state.error}</p>;
  if (state.success) return <p className="form-success" role="status">{state.success}</p>;
  return null;
}

export function CreateLeagueForm({ seasons }: { seasons: { id: string; name: string; year: number; competition: { name: string; slug: string } }[] }) {
  const [state, action] = useActionState(createLeague, initialState);
  return <form action={action} className="app-form">
    <div className="app-field"><label htmlFor="leagueName">League name</label><input id="leagueName" name="leagueName" autoComplete="off" maxLength={60} required placeholder="Sunday Night Cricket" /><span className="app-help">Pick a name your group will recognize.</span></div>
    <div className="app-field"><label htmlFor="teamName">Your fantasy team name</label><input id="teamName" name="teamName" autoComplete="off" maxLength={40} required placeholder="The Yorkers" /></div>
    <div className="app-field"><label htmlFor="seasonId">Competition season</label><select id="seasonId" name="seasonId" required defaultValue=""><option value="" disabled>Select a season</option>{seasons.map((season) => <option key={season.id} value={season.id}>{season.competition.name} · {season.name}</option>)}</select><span className="app-help">MLC 2026 catalogue season setup. Fixtures and live scores are not part of this release.</span></div>
    <ActionMessage state={state} />
    <SubmitButton className="app-button" pendingLabel="Creating league…">Create private league</SubmitButton>
  </form>;
}

export function JoinLeagueForm({ token }: { token: string }) {
  const [state, action] = useActionState(joinLeague, initialState);
  return <form action={action} className="app-form">
    <div className="app-field"><label htmlFor="token">Invitation token</label><input id="token" name="token" autoComplete="off" spellCheck={false} defaultValue={token} required pattern="[a-f0-9]{64}" maxLength={64} aria-describedby="token-help" /><span className="app-help" id="token-help">Only an invitation link can identify the private league. League details stay hidden until you join.</span></div>
    <div className="app-field"><label htmlFor="teamName">Your fantasy team name</label><input id="teamName" name="teamName" autoComplete="off" maxLength={40} required placeholder="The Yorkers" /></div>
    <ActionMessage state={state} />
    <SubmitButton className="app-button" pendingLabel="Joining league…">Join private league</SubmitButton>
  </form>;
}

export function RenameTeamForm({ leagueId, currentName }: { leagueId: string; currentName: string }) {
  const [state, action] = useActionState(renameTeam.bind(null, leagueId), initialState);
  return <form action={action} className="app-form"><div className="app-field"><label htmlFor="teamName">Team name</label><input id="teamName" name="teamName" defaultValue={currentName} maxLength={40} required /></div><ActionMessage state={state} /><SubmitButton className="app-button-secondary" pendingLabel="Saving…">Save team name</SubmitButton></form>;
}

export function RenameLeagueForm({ leagueId, currentName }: { leagueId: string; currentName: string }) {
  const [state, action] = useActionState(renameLeague.bind(null, leagueId), initialState);
  return <form action={action} className="app-form"><div className="app-field"><label htmlFor="leagueName">League name</label><input id="leagueName" name="leagueName" defaultValue={currentName} maxLength={60} required /></div><ActionMessage state={state} /><SubmitButton className="app-button-secondary" pendingLabel="Saving…">Save league name</SubmitButton></form>;
}

export function LeaveLeagueButton({ leagueId }: { leagueId: string }) {
  const [state, action] = useActionState(leaveLeague.bind(null, leagueId), initialState);
  return <form action={action} className="app-form"><ActionMessage state={state} /><SubmitButton className="app-button-danger" pendingLabel="Leaving…">Leave this league</SubmitButton><span className="app-help">Leaving is available to managers only while the league is in its lobby.</span></form>;
}

export function InvitationControls({ leagueId, invitation, capacityReached }: { leagueId: string; invitation: { id: string; expires_at: string } | null; capacityReached: boolean }) {
  const [createState, createAction] = useActionState(createInvitation.bind(null, leagueId), initialState);
  const [revokeState, revokeAction] = useActionState(revokeInvitation.bind(null, leagueId, invitation?.id ?? ""), initialState);
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
  const link = sharedToken && typeof window !== "undefined" ? `${window.location.origin}/join?token=${encodeURIComponent(sharedToken)}` : "";
  async function copyLink() {
    if (!link) return;
    if (!navigator.clipboard) {
      setClipboardMessage("Clipboard access is unavailable. Select the link above and copy it manually.");
      return;
    }
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setClipboardMessage(null);
    } catch {
      setClipboardMessage("Could not copy automatically. Select the link above and copy it manually.");
    }
  }
  const activeInvitation = invitation && !revoked ? invitation : null;
  return <section className="app-card" aria-labelledby="invite-title">
    <h2 id="invite-title">Invite managers</h2>
    <p className="app-muted">Share a private link with people you trust. Links expire after seven days and can be revoked.</p>
    {activeInvitation && <p className="app-help">Active invitation expires <time dateTime={activeInvitation.expires_at}>{new Date(activeInvitation.expires_at).toISOString().replace("T", " ").slice(0, 16)} UTC</time>. Its secret is only available when created; revoke it to generate a replacement if you need to share a new link.</p>}
    {sharedToken ? <div className="app-form">
      <div className="app-field"><label htmlFor="invite-link">Shareable invitation link</label><input id="invite-link" readOnly value={link} onFocus={(event) => event.currentTarget.select()} /></div>
      <button type="button" className="app-button-secondary" onClick={copyLink} disabled={!link}>{copied ? "Copied" : "Copy invite link"}</button>
      {clipboardMessage && <p className="app-help" role="status">{clipboardMessage}</p>}
      <ActionMessage state={createState} />
    </div> : !activeInvitation && <form action={createAction} className="app-form"><ActionMessage state={{ error: createState.error }} /><SubmitButton className="app-button" pendingLabel="Generating…" disabled={capacityReached}>Generate invitation link</SubmitButton>{capacityReached && <span className="app-help">The league is at capacity; no more managers can join.</span>}</form>}
    {activeInvitation && <form action={revokeAction} className="app-form" style={{ marginTop: 12 }}><SubmitButton className="app-button-danger" pendingLabel="Revoking…">Revoke active invitation</SubmitButton></form>}
    <ActionMessage state={revokeState} />
    {!sharedToken && !activeInvitation && <p className="app-help">Generating an invitation does not reveal the league to anyone. They must join successfully before seeing league details.</p>}
  </section>;
}
