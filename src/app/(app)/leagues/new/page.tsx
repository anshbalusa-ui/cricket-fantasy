import Link from "next/link";
import { CreateLeagueForm } from "@/components/leagues/forms";
import { getAvailableSeasons } from "@/lib/competitions/queries";

export default async function NewLeaguePage() {
  const seasons = (await getAvailableSeasons()).filter((season) => season.competition.slug === "mlc");
  return <>
    <Link href="/leagues" className="back-link">← My leagues</Link>
    <div className="page-head"><div><span className="eyebrow">CREATE A PRIVATE SPACE</span><h1>New league</h1><p>Choose your season and give your group a home base.</p></div></div>
    <section className="app-card" style={{ maxWidth: 660 }}>
      {seasons.length ? <CreateLeagueForm seasons={seasons} /> : <div className="app-alert">There are no MLC seasons available to select right now. Try again later.</div>}
    </section>
  </>;
}
