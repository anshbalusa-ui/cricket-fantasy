import { notFound } from "next/navigation";
import { LeagueLobby } from "@/components/leagues/lobby";
import { getLeagueDetail } from "@/lib/leagues/queries";

type LobbyPageProps = { params: Promise<{ leagueId: string }> };
export default async function LobbyPage({ params }: LobbyPageProps) {
  const { leagueId } = await params;
  const detail = await getLeagueDetail(leagueId);
  if (!detail) notFound();
  return <LeagueLobby detail={detail} />;
}
