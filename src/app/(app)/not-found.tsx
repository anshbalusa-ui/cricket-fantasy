import Link from "next/link";
import { EmptyState } from "@/components/ui/primitives";

export default function ApplicationNotFound() {
  return (
    <section className="app-card app-empty">
      <p className="eyebrow">PRIVATE LEAGUE</p>
      <EmptyState
        icon="shield"
        title="This league isn’t available"
        description="It may not exist, or your account may not be a member. League details are only shown to current members."
        action={
          <span className="app-actions">
            <Link href="/leagues" className="button button-secondary">
              Back to my leagues
            </Link>
            <Link href="/dashboard" className="button button-ghost">
              Go home
            </Link>
          </span>
        }
      />
    </section>
  );
}
