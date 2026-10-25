import Link from "next/link";
import { getMyLeagues } from "@/lib/leagues/queries";

export default async function LeaguesPage() {
  const leagues = await getMyLeagues();
  return <>
    <div className="page-head"><div><span className="eyebrow">PRIVATE LEAGUES</span><h1>My leagues</h1><p>Only leagues you’ve joined appear here.</p></div><Link className="app-button" href="/leagues/new">Create a league</Link></div>
    {leagues.length ? <section className="league-list" aria-label="Your leagues">{leagues.map((league) => <Link className="league-card-link" href={`/leagues/${league.id}`} key={league.id}><span><span className="league-card-title">{league.name}</span><span className="league-card-meta">{league.season.name} · {league.my_team_name} · {league.member_count}/{league.capacity} managers</span></span><span className={`status-pill ${league.status === "lobby" ? "status-lobby" : ""}`}>{league.status}</span></Link>)}</section> : <section className="app-card app-empty"><h2>You haven’t joined a league yet.</h2><p className="app-muted">Start your own private league or join using an invitation from a commissioner.</p><div className="app-grid app-grid-two" style={{ maxWidth: 480, margin: "22px auto 0" }}><Link href="/leagues/new" className="app-button">Create a league</Link><Link href="/join" className="app-button-secondary">Join a league</Link></div></section>}
  </>;
}
