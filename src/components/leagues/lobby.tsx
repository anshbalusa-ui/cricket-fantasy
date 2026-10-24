import Link from "next/link";
import type { LeagueDetail } from "@/lib/leagues/queries";
import { InvitationControls, LeaveLeagueButton, RenameLeagueForm, RenameTeamForm } from "@/components/leagues/forms";

export function LeagueMembers({ detail }: { detail: LeagueDetail }) {
  const slots = Array.from({ length: detail.league.capacity }, (_, index) => detail.members[index] ?? null);
  return <section className="app-card" aria-labelledby="managers-heading">
    <div className="page-head" style={{ marginBottom: 18 }}><div><h2 id="managers-heading">Managers</h2><p>{detail.members.length} of {detail.league.capacity} spots filled</p></div><span className="status-pill status-lobby">{detail.league.status}</span></div>
    <div className="slot-list">{slots.map((member, index) => member ? <div className="member-slot" key={member.user_id}>
      <span className="member-avatar" aria-hidden="true">{member.display_name.slice(0, 1).toUpperCase()}</span>
      <span className="member-info"><span className="member-name">{member.display_name}{member.user_id === detail.currentUserId ? " (you)" : ""}</span><span className="member-team">{member.team_name}</span></span>
      <span className="member-role">{member.role === "commissioner" ? "Commissioner" : `Manager ${index + 1}`}</span>
    </div> : <div className="member-slot" key={`empty-${index}`}><span className="member-avatar" aria-hidden="true">+</span><span className="member-info"><span className="member-name">Open manager spot</span><span className="member-team">Invite someone to join</span></span><span className="member-role">{index + 1} / {detail.league.capacity}</span></div>)}</div>
  </section>;
}

export function LeagueLobby({ detail }: { detail: LeagueDetail }) {
  const { league, season, members, currentUserId, invitation } = detail;
  const isCommissioner = league.commissioner_user_id === currentUserId;
  const ownMember = members.find((member) => member.user_id === currentUserId);
  const isLobby = league.status === "lobby";
  return <>
    <Link href={`/leagues/${league.id}`} className="back-link">← League overview</Link>
    <div className="page-head"><div><span className="eyebrow">{season.name} · PRIVATE LEAGUE</span><h1>{league.name}</h1><p>League lobby · {members.length} of {league.capacity} managers</p></div><Link href={`/leagues/${league.id}`} className="app-button-secondary">Overview</Link></div>
    {isLobby ? <div className="lobby-layout"><LeagueMembers detail={detail} /><div className="app-grid">
      {isCommissioner && <>
        <section className="app-card"><h2>League settings</h2><RenameLeagueForm leagueId={league.id} currentName={league.name} /></section>
        <InvitationControls leagueId={league.id} invitation={invitation} capacityReached={members.length >= league.capacity} />
      </>}
      <section className="app-card"><h2>Your team</h2><p className="app-muted">This is how your team appears to everyone in the league.</p>{ownMember && <RenameTeamForm leagueId={league.id} currentName={ownMember.team_name} />}</section>
      {!isCommissioner && <section className="app-card"><h2>Leave league</h2><LeaveLeagueButton leagueId={league.id} /></section>}
    </div></div> : <div className="app-grid app-grid-two"><LeagueMembers detail={detail} /><section className="app-card"><h2>League status</h2><span className="status-pill">{league.status}</span><p className="app-muted">The lobby is closed for this league status. Membership and team roster are visible to current members.</p>{ownMember && <><hr className="divider" /><h3>Your team</h3><RenameTeamForm leagueId={league.id} currentName={ownMember.team_name} /></>}</section></div>}
    <p className="app-help" style={{ marginTop: 22 }}>The draft room and scoring experience are not implemented yet; league status does not imply an active draft or live scores.</p>
  </>;
}
