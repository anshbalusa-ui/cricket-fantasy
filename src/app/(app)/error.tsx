"use client";

export default function ApplicationError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="app-card"><span className="eyebrow">SOMETHING WENT WRONG</span><h1>We couldn’t load this page.</h1><p className="app-muted">{error.message || "The request failed unexpectedly."}</p><button type="button" className="app-button" onClick={() => reset()}>Try again</button></section>;
}
