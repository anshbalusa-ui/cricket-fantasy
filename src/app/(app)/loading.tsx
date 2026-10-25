import { Panel } from "@/components/ui/primitives";

export default function ApplicationLoading() {
  return (
    <div className="loading-layout" aria-live="polite" aria-busy="true">
      <span className="eyebrow">YOUR CRICKET CIRCLE</span>
      <Panel>
        <div className="skeleton loading-title" />
        <div className="skeleton loading-copy" />
        <div className="loading-cards">
          <div className="skeleton loading-card" />
          <div className="skeleton loading-card" />
        </div>
        <span className="sr-only">Loading your private league data…</span>
      </Panel>
    </div>
  );
}
