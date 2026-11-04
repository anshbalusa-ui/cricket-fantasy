"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Icon, type IconName } from "@/components/ui/icon";
import "./navigation.css";

type NavigationLink = { href: string; label: string; icon: IconName };

const links: NavigationLink[] = [
  { href: "/dashboard", label: "Home", icon: "home" },
  { href: "/leagues", label: "Leagues", icon: "layers" },
  { href: "/players", label: "Players", icon: "users" },
  { href: "/account", label: "Account", icon: "settings" },
];

function isActive(pathname: string, href: string) {
  if (href === "/leagues" && pathname === "/join") return true;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavigationContent({ surface }: { surface: "sidebar" | "mobile" }) {
  const pathname = usePathname();
  const search = useSearchParams();
  const leagueId = pathname.match(
    /^\/leagues\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:\/|$)/i,
  )?.[1];
  const leagueContext = surface === "mobile" && leagueId;
  const currentTab = search.get("tab") ?? "home";
  const navigationLinks: NavigationLink[] = leagueContext
    ? [
        { href: `/leagues/${leagueId}`, label: "League", icon: "home" },
        {
          href: `/leagues/${leagueId}?tab=roster`,
          label: "My team",
          icon: "shirt",
        },
        {
          href: `/leagues/${leagueId}?tab=matchup`,
          label: "Matchup",
          icon: "swords",
        },
        {
          href: `/leagues/${leagueId}?tab=draft`,
          label: "Draft",
          icon: "layers",
        },
      ]
    : links;
  return (
    <nav
      className={`app-${surface}-nav`}
      aria-label={leagueContext ? "League shortcuts" : "Main navigation"}
    >
      {navigationLinks.map(({ href, label, icon }) => {
        const linkTab = href.includes("?tab=")
          ? href.split("?tab=")[1]
          : "home";
        const active = leagueContext
          ? linkTab ===
            (["roster", "matchup", "draft"].includes(currentTab)
              ? currentTab
              : "home")
          : isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
          >
            <Icon name={icon} size={surface === "mobile" ? 20 : 19} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function ApplicationNavigation({
  surface,
}: {
  surface: "sidebar" | "mobile";
}) {
  return (
    <Suspense fallback={null}>
      <NavigationContent surface={surface} />
    </Suspense>
  );
}
