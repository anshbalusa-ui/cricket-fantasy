import Link from "next/link";
import { JoinLeagueForm } from "@/components/leagues/forms";

type JoinPageProps = { searchParams: Promise<{ token?: string | string[] }> };
export default async function JoinPage({ searchParams }: JoinPageProps) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";
  return <>
    <Link href="/leagues" className="back-link">← My leagues</Link>
    <div className="page-head"><div><span className="eyebrow">PRIVATE INVITATION</span><h1>Join a league</h1><p>Use your invitation and choose the name of your fantasy team.</p></div></div>
    <section className="app-card" style={{ maxWidth: 620 }}><div className="future-note" style={{ marginBottom: 20 }}>League information remains private until the invitation is accepted and you become a member.</div><JoinLeagueForm token={token} /></section>
  </>;
}
