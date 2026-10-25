"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

function revealTab(link: HTMLAnchorElement | null) {
  link?.scrollIntoView({
    block: "nearest",
    inline: "nearest",
    behavior: "instant",
  });
}

export function LeagueNavigation({
  leagueId,
  activeTab,
  sections,
}: {
  leagueId: string;
  activeTab: string;
  sections: readonly { key: string; label: string; upcoming: boolean }[];
}) {
  const navigation = useRef<HTMLElement>(null);

  useEffect(() => {
    revealTab(
      navigation.current?.querySelector('a[aria-current="page"]') ?? null,
    );
  }, [activeTab, leagueId]);

  return (
    <nav
      ref={navigation}
      className="league-tabs"
      aria-label="League sections"
      onFocusCapture={(event) => {
        if (event.target instanceof HTMLAnchorElement) revealTab(event.target);
      }}
    >
      {sections.map(({ key, label, upcoming }) => (
        <Link
          key={key}
          href={`/leagues/${leagueId}?tab=${key}`}
          aria-current={activeTab === key ? "page" : undefined}
          aria-label={upcoming ? `${label} (coming soon)` : label}
        >
          {label}
          {upcoming && <span className="tab-upcoming">Soon</span>}
        </Link>
      ))}
    </nav>
  );
}
