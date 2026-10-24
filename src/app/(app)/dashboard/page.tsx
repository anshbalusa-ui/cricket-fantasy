import Link from "next/link";
import { getMyLeagues } from "@/lib/leagues/queries";

export default async function DashboardPage() {
  const leagues = await getMyLeagues();
  return <>
    <div className="page-head"><div><span className="eyebrow">YOUR CRICKET CIRCLE</span><h1>Dashboard</h1><p>Your private leagues and season setup.</p></div><Link className="app-button" href="/leagues/new">Create a league</Link></div>
    {leagues.length ? <section className="league-list" aria-label="Your leagues">{leagues.map((league) => <Link className="league-card-link" href={`/leagues/${league.id}`} key={league.id}><span><span className="league-card-title">{league.name}</span><span className="league-card-meta">{league.season.name} · Your team: {league.my_team_name} · {league.member_count}/{league.capacity} managers</span></span><span className={`status-pill ${league.status === "lobby" ? "status-lobby" : ""}`}>{league.status}</span></Link>)}</section> : <section className="app-card app-empty"><span className="eyebrow">A LEAGUE STARTS HERE</span><h2>Nothing on your fixture list yet.</h2><p className="app-muted">Create a private league or join one with a manager’s invitation link.</p><div className="app-grid app-grid-two" style={{ maxWidth: 480, margin: "22px auto 0" }}><Link href="/leagues/new" className="app-button">Create a league</Link><Link href="/join" className="app-button-secondary">Join with an invite</Link></div></section>}
    <p className="app-help" style={{ marginTop: 24 }}>M1 includes private league setup and its lobby. Drafting, scoring, fixtures, and live data are not available yet.</p>
  </>;
}
