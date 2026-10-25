import Link from "next/link";
import { notFound } from "next/navigation";
import { LeagueMembers } from "@/components/leagues/lobby";
import { getLeagueDetail } from "@/lib/leagues/queries";

type LeaguePageProps = { params: Promise<{ leagueId: string }> };
export default async function LeaguePage({ params }: LeaguePageProps) {
  const { leagueId } = await params;
  const detail = await getLeagueDetail(leagueId);
  if (!detail) notFound();
  const { league, season } = detail;
  return <>
    <Link href="/leagues" className="back-link">← My leagues</Link>
    <div className="page-head"><div><span className="eyebrow">{season.name} · {season.year}</span><h1>{league.name}</h1><p>Private league · {detail.members.length} of {league.capacity} managers</p></div><Link href={`/leagues/${league.id}/lobby`} className="app-button">Open league lobby</Link></div>
    <div className="app-grid app-grid-two"><LeagueMembers detail={detail} /><section className="app-card"><h2>Season setup</h2><p className="app-muted">{season.name} is selected for this private league.</p><div className="future-note">Multiplayer drafting, player rosters, scoring, matchups, and live results are not implemented. This league currently supports membership and lobby management only.</div><p style={{ marginTop: 20 }}><Link href={`/leagues/${league.id}/lobby`} className="app-button-secondary">Manage lobby</Link></p></section></div>
  </>;
}
