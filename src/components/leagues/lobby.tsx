import Link from "next/link";
import type { LeagueDetail } from "@/lib/leagues/queries";
import { Avatar, Badge, Panel } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icon";
import {
  InvitationControls,
  LeaveLeagueButton,
  RenameLeagueForm,
  RenameTeamForm,
} from "@/components/leagues/forms";

export function LeagueMembers({ detail }: { detail: LeagueDetail }) {
  const slots = Array.from(
    { length: detail.league.capacity },
    (_, index) => detail.members[index] ?? null,
  );
  return (
    <Panel
      eyebrow="LEAGUE ROSTER"
      title="Managers"
      action={
        <Badge tone="blue">
          {detail.members.length}/{detail.league.capacity} spots
        </Badge>
      }
    >
      <div className="slot-list">
        {slots.map((member, index) =>
          member ? (
            <div className="member-slot" key={member.user_id}>
              <Avatar
                name={member.display_name}
                seed={member.user_id}
                size="md"
              />
              <span className="member-info">
                <span className="member-name">
                  {member.display_name}
                  {member.user_id === detail.currentUserId ? " (you)" : ""}
                </span>
                <span className="member-team">{member.team_name}</span>
              </span>
              <Badge
                tone={member.role === "commissioner" ? "amber" : "neutral"}
              >
                {member.role === "commissioner"
                  ? "Commissioner"
                  : `Manager ${index}`}
              </Badge>
            </div>
          ) : (
            <div className="member-slot" key={`empty-${index}`}>
              <span className="member-avatar" aria-hidden="true">
                +
              </span>
              <span className="member-info">
                <span className="member-name">Open manager spot</span>
                <span className="member-team">Invite someone to join</span>
              </span>
              <span className="member-role">
                {index + 1} / {detail.league.capacity}
              </span>
            </div>
          ),
        )}
      </div>
    </Panel>
  );
}

export function LeagueLobby({ detail }: { detail: LeagueDetail }) {
  const { league, season, members, currentUserId, invitation } = detail;
  const isCommissioner = league.commissioner_user_id === currentUserId;
  const ownMember = members.find((member) => member.user_id === currentUserId);
  const isLobby = league.status === "lobby";
  return (
    <div className="app-page">
      <Link href={`/leagues/${league.id}`} className="app-back">
        <Icon name="arrowLeft" size={17} /> League home
      </Link>
      <header className="page-heading">
        <div>
          <p className="eyebrow">
            {season.name} · {season.year} · PRIVATE LEAGUE
          </p>
          <h1>{league.name}</h1>
          <p className="page-description">
            League lobby · {members.length} of {league.capacity} managers
          </p>
        </div>
        <div className="page-actions">
          <Link
            href={`/leagues/${league.id}`}
            className="button button-secondary"
          >
            League home
          </Link>
        </div>
      </header>
      {isLobby ? (
        <div className="lobby-layout">
          <LeagueMembers detail={detail} />
          <div className="form-stack">
            {isCommissioner && (
              <Panel eyebrow="COMMISSIONER" title="League settings">
                <RenameLeagueForm
                  leagueId={league.id}
                  currentName={league.name}
                />
              </Panel>
            )}
            {isCommissioner && (
              <InvitationControls
                leagueId={league.id}
                invitation={invitation}
                capacityReached={members.length >= league.capacity}
              />
            )}
            <Panel
              eyebrow="YOUR TEAM"
              title={ownMember?.team_name ?? "Team identity"}
            >
              <p className="app-muted">
                This is how your team appears to everyone in the league.
              </p>
              {ownMember && (
                <RenameTeamForm
                  leagueId={league.id}
                  currentName={ownMember.team_name}
                />
              )}
            </Panel>
            {!isCommissioner && (
              <Panel eyebrow="MEMBERSHIP" title="Leave league">
                <LeaveLeagueButton leagueId={league.id} />
              </Panel>
            )}
          </div>
        </div>
      ) : (
        <div className="app-grid app-grid-two">
          <LeagueMembers detail={detail} />
          <Panel eyebrow="LEAGUE STATUS" title={league.status}>
            <p className="app-muted">
              The lobby is closed for this league status. Membership and team
              roster are visible to current members.
            </p>
            {ownMember && (
              <>
                <hr className="divider" />
                <h3>Your team</h3>
                <RenameTeamForm
                  leagueId={league.id}
                  currentName={ownMember.team_name}
                />
              </>
            )}
          </Panel>
        </div>
      )}
      <div className="future-note">
        <strong>Draft and scoring are upcoming.</strong> League status does not
        imply an active draft or live scores. No results are simulated.
      </div>
    </div>
  );
}
