import type { ReactNode } from "react";
import { Avatar, PageHeading } from "@/components/ui/primitives";

export function LeagueHeading({
  leagueId,
  leagueName,
  seasonName,
  description,
  actions,
}: {
  leagueId: string;
  leagueName: string;
  seasonName: string;
  description: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="league-identity-header">
      <Avatar name={leagueName} seed={leagueId} size="lg" />
      <PageHeading
        eyebrow={`${seasonName} · PRIVATE LEAGUE`}
        title={leagueName}
        description={description}
        actions={actions}
      />
    </div>
  );
}
