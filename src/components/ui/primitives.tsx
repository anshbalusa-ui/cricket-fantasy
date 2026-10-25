import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "./icon";

export type Tone = "neutral" | "mint" | "blue" | "amber" | "violet" | "red";

export function Brand({
  href = "/",
  compact = false,
}: {
  href?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`brand${compact ? " brand-compact" : ""}`}
      aria-label="Cricket Fantasy home"
    >
      <span className="brand-symbol" aria-hidden="true">
        <svg viewBox="0 0 32 32" fill="none">
          <path
            d="M10 10v15m6-15v15m6-15v15M8 7h7m2 0h7"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <circle cx="24" cy="5" r="2.2" fill="currentColor" />
        </svg>
      </span>
      {!compact && (
        <span className="brand-wordmark">
          cricket<span>fantasy</span>
        </span>
      )}
    </Link>
  );
}

export function Avatar({
  name,
  seed = name,
  size = "md",
  tone,
  decorative = true,
}: {
  name: string;
  seed?: string;
  size?: "sm" | "md" | "lg" | "xl";
  tone?: Tone;
  decorative?: boolean;
}) {
  let hash = 0;
  for (let index = 0; index < seed.length; index++)
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  const tones: Tone[] = ["mint", "blue", "amber", "violet", "red"];
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => Array.from(word)[0] ?? "")
      .join("")
      .toUpperCase() || "CF";
  return (
    <span
      className={`avatar avatar-${size} tone-${tone ?? tones[hash % tones.length]}`}
      aria-hidden={decorative || undefined}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : name}
    >
      {initials}
    </span>
  );
}

export function Badge({
  children,
  tone = "neutral",
  dot = false,
}: {
  children: ReactNode;
  tone?: Tone;
  dot?: boolean;
}) {
  return (
    <span className={`badge badge-${tone}`}>
      {dot && <span className="badge-dot" aria-hidden="true" />}
      {children}
    </span>
  );
}

export function Panel({
  title,
  eyebrow,
  action,
  children,
  className = "",
}: {
  title?: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      {(title || eyebrow || action) && (
        <header className="panel-heading">
          <div>
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            {title && <h2>{title}</h2>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function PageHeading({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

export function EmptyState({
  icon = "trophy",
  title,
  description,
  action,
  compact = false,
}: {
  icon?: IconName;
  title: string;
  description: ReactNode;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={`empty-state${compact ? " empty-state-compact" : ""}`}>
      <span className="empty-state-icon">
        <Icon name={icon} size={26} />
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
      {action && <div className="empty-state-actions">{action}</div>}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: Tone;
}) {
  return (
    <dl className={`stat stat-${tone}`}>
      <dt>{label}</dt>
      <dd>
        {value}
        {hint && <span className="stat-hint">{hint}</span>}
      </dd>
    </dl>
  );
}
