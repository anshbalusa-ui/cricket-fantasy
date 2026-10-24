import Link from "next/link";

export default function ApplicationNotFound() {
  return <section className="app-card app-empty"><span className="eyebrow">PRIVATE LEAGUE</span><h1>League not found</h1><p className="app-muted">This league may not exist, or you may not have access to it.</p><p><Link href="/leagues" className="app-button-secondary">Back to my leagues</Link></p></section>;
}
