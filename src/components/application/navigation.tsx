"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import "./navigation.css";

const links = [
  { href: "/dashboard", label: "Home", icon: "home" as const },
  { href: "/leagues", label: "Leagues", icon: "layers" as const },
  { href: "/demo", label: "Practice", icon: "target" as const },
  { href: "/account", label: "Account", icon: "settings" as const },
];

function isActive(pathname: string, href: string) {
  if (href === "/leagues" && pathname === "/join") return true;
  if (href === "/demo" && pathname === "/practice") return true;
  return href === "/dashboard"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function ApplicationNavigation({
  surface,
}: {
  surface: "sidebar" | "mobile";
}) {
  const pathname = usePathname();
  return (
    <nav className={`app-${surface}-nav`} aria-label="Main navigation">
      {links.map(({ href, label, icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(pathname, href) ? "page" : undefined}
        >
          <Icon name={icon} size={surface === "mobile" ? 20 : 19} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
