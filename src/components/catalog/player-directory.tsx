"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, EmptyState } from "@/components/ui/primitives";
import { RoleBadge } from "@/components/fantasy/experience";
import { Icon } from "@/components/ui/icon";
import type { CatalogPlayer } from "@/lib/catalog/queries";

export function PlayerDirectory({
  players,
  seasonId,
  seasons,
  initialSearch = "",
}: {
  players: CatalogPlayer[];
  seasonId: string;
  seasons: { id: string; name: string }[];
  initialSearch?: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
  const [role, setRole] = useState("all");
  const [franchise, setFranchise] = useState("all");
  const [sort, setSort] = useState("average");
  const franchises = useMemo(
    () => [...new Set(players.map((player) => player.franchiseName))].sort(),
    [players],
  );
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return players
      .filter(
        (player) =>
          (role === "all" || player.role === role) &&
          (franchise === "all" || player.franchiseName === franchise) &&
          (!query ||
            `${player.name} ${player.franchiseName}`
              .toLocaleLowerCase()
              .includes(query)),
      )
      .sort((a, b) => {
        const value =
          sort === "runs"
            ? b.runs - a.runs
            : sort === "wickets"
              ? b.wickets - a.wickets
              : sort === "name"
                ? 0
                : b.averagePoints - a.averagePoints;
        return (
          value || a.name.localeCompare(b.name) || a.id.localeCompare(b.id)
        );
      });
  }, [players, search, role, franchise, sort]);
  return (
    <section className="catalog-panel" aria-label="Historical player pool">
      <div className="catalog-controls">
        <label className="catalog-search">
          <span>Find a player</span>
          <span className="catalog-search-input">
            <Icon name="search" size={18} />
            <input
              type="search"
              value={search}
              maxLength={80}
              placeholder="Player or franchise"
              onChange={(event) => setSearch(event.currentTarget.value)}
            />
          </span>
        </label>
        <label>
          <span>Role</span>
          <select
            value={role}
            onChange={(event) => setRole(event.currentTarget.value)}
          >
            <option value="all">All roles</option>
            <option value="BAT">Batters</option>
            <option value="BOWL">Bowlers</option>
            <option value="ALL">All-rounders</option>
            <option value="WK">Wicketkeepers</option>
          </select>
        </label>
        <label>
          <span>Franchise</span>
          <select
            value={franchise}
            onChange={(event) => setFranchise(event.currentTarget.value)}
          >
            <option value="all">All franchises</option>
            {franchises.map((name) => (
              <option value={name} key={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Sort by</span>
          <select
            value={sort}
            onChange={(event) => setSort(event.currentTarget.value)}
          >
            <option value="average">Historical FP / match</option>
            <option value="runs">Runs scored</option>
            <option value="wickets">Wickets taken</option>
            <option value="name">Player name</option>
          </select>
        </label>
        {seasons.length > 1 && (
          <label>
            <span>Season</span>
            <select
              value={seasonId}
              onChange={(event) =>
                router.push(
                  `/players?season=${encodeURIComponent(event.currentTarget.value)}`,
                )
              }
            >
              {seasons.map((season) => (
                <option value={season.id} key={season.id}>
                  {season.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="catalog-list-caption">
        <span role="status">
          {filtered.length} of {players.length} players
        </span>
        <span>Recorded appearances · not projections</span>
      </div>
      {filtered.length ? (
        <div className="catalog-table-wrap">
          <table className="catalog-table">
            <thead>
              <tr>
                <th scope="col">Player</th>
                <th scope="col" className="catalog-role-column">
                  Role
                </th>
                <th scope="col" className="catalog-extra-column">
                  Apps
                </th>
                <th scope="col" className="catalog-extra-column">
                  Runs
                </th>
                <th scope="col" className="catalog-extra-column">
                  Wickets
                </th>
                <th scope="col" className="catalog-number">
                  FP / match
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((player) => (
                <tr key={player.id}>
                  <td>
                    <Link
                      className="catalog-player-link"
                      href={`/players/${player.id}?season=${encodeURIComponent(seasonId)}&q=${encodeURIComponent(search)}`}
                    >
                      <Avatar name={player.name} seed={player.id} size="md" />
                      <span>
                        <strong>{player.name}</strong>
                        <small>
                          {player.franchiseCode} · {player.franchiseName}
                        </small>
                        <span className="catalog-mobile-role">
                          <RoleBadge role={player.role} />
                        </span>
                      </span>
                      <Icon name="chevronRight" size={16} />
                    </Link>
                  </td>
                  <td className="catalog-role-column">
                    <RoleBadge role={player.role} />
                  </td>
                  <td className="catalog-extra-column catalog-number">
                    {player.appearances}
                  </td>
                  <td className="catalog-extra-column catalog-number">
                    {player.runs}
                  </td>
                  <td className="catalog-extra-column catalog-number">
                    {player.wickets}
                  </td>
                  <td className="catalog-number catalog-average">
                    {player.averagePoints.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon="search"
          title="No players match."
          description="Try another name, role or franchise."
          action={
            <button
              className="button button-secondary"
              onClick={() => {
                setSearch("");
                setRole("all");
                setFranchise("all");
              }}
            >
              Clear filters
            </button>
          }
        />
      )}
    </section>
  );
}
