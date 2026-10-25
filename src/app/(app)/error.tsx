"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { PageHeading, Panel } from "@/components/ui/primitives";

export default function ApplicationError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="app-page">
      <PageHeading
        eyebrow="TEMPORARY SETBACK"
        title="This page didn’t load."
        description="Your league and account information haven’t been changed. Try loading this view again."
      />
      <Panel>
        <div className="app-actions">
          <button
            type="button"
            className="button button-primary"
            onClick={() => reset()}
          >
            <Icon name="reset" size={17} /> Try again
          </button>
          <Link href="/dashboard" className="button button-secondary">
            Back to home
          </Link>
        </div>
      </Panel>
    </div>
  );
}
