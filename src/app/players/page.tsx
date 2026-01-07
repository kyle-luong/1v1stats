/**
 * Players Listing Page
 * Displays all players with grid/table toggle, search, and sortable stats
 */

"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/layout/Navbar";
import { trpc } from "@/lib/trpc/Provider";
import { calculateWinLoss, calculateTotalPoints, calculatePPG } from "@/lib/utils";
import { Grid3X3, List } from "lucide-react";

type ViewMode = "grid" | "table";
type SortField = "name" | "games" | "winPct" | "totalPoints" | "ppg";
type SortDirection = "asc" | "desc";

export default function PlayersPage() {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const { data: players, isLoading, error } = trpc.player.getAll.useQuery({
    search: search || undefined,
    limit: 100,
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection(field === "name" ? "asc" : "desc");
    }
  };

  const sortedPlayers = useMemo(() => {
    if (!players) return [];

    const playersWithStats = players.map((player) => {
      const allGames = [...player.gamesAsPlayer1, ...player.gamesAsPlayer2];
      const { wins, losses } = calculateWinLoss(allGames, player.id);
      const totalPoints = calculateTotalPoints(allGames, player.id);
      const gamesPlayed = allGames.length;
      const ppg = calculatePPG(totalPoints, gamesPlayed);
      const winPct = gamesPlayed > 0 ? (wins / gamesPlayed) * 100 : 0;

      return {
        ...player,
        wins,
        losses,
        totalPoints,
        gamesPlayed,
        ppg,
        winPct,
      };
    });

    return playersWithStats.sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;

      switch (sortField) {
        case "name":
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case "games":
          aVal = a.gamesPlayed;
          bVal = b.gamesPlayed;
          break;
        case "winPct":
          aVal = a.winPct;
          bVal = b.winPct;
          break;
        case "totalPoints":
          aVal = a.totalPoints;
          bVal = b.totalPoints;
          break;
        case "ppg":
          aVal = a.ppg;
          bVal = b.ppg;
          break;
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [players, sortField, sortDirection]);

  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mb-2 font-heading text-4xl font-semibold uppercase tracking-wide">Players</h1>
            <p className="text-muted-foreground">Browse all registered players</p>
          </div>

          {/* View Toggle */}
          <div className="flex gap-2 rounded-lg border bg-muted p-1">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-2 rounded px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === "grid" ? "bg-background shadow-sm" : "hover:bg-background/50"
              }`}
            >
              <Grid3X3 className="h-4 w-4" />
              Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-2 rounded px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === "table" ? "bg-background shadow-sm" : "hover:bg-background/50"
              }`}
            >
              <List className="h-4 w-4" />
              Table
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search players..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md rounded-lg border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-6 text-center">
            <h2 className="mb-2 text-lg font-semibold text-destructive">Failed to Load Players</h2>
            <p className="text-sm text-muted-foreground">
              There was an error loading players. Please try refreshing the page.
            </p>
          </div>
        )}

        {/* eslint-disable react/no-array-index-key */}
        {isLoading && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={`player-skeleton-${i}`} className="animate-pulse rounded-lg border bg-card">
                <div className="aspect-square bg-muted" />
                <div className="space-y-2 p-4">
                  <div className="h-6 rounded bg-muted" />
                  <div className="h-4 w-3/4 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        )}
        {/* eslint-enable react/no-array-index-key */}

        {!isLoading && !error && sortedPlayers.length > 0 && (
          <>
            {/* Grid View */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {sortedPlayers.map((player) => (
                  <Link
                    key={player.id}
                    href={`/players/${player.id}`}
                    className="group overflow-hidden rounded-lg border bg-card transition hover:shadow-lg"
                  >
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      {player.imageUrl ? (
                        <Image
                          src={player.imageUrl}
                          alt={player.name}
                          fill
                          className="object-cover transition group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-4xl font-bold text-primary">
                            {player.name.charAt(0)}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="mb-1 text-lg font-semibold">{player.name}</h3>

                      <div className="mb-3 space-y-1 text-sm text-muted-foreground">
                        {player.height && <p>{player.height}</p>}
                        {player.location && <p>{player.location}</p>}
                      </div>

                      {player.gamesPlayed > 0 ? (
                        <div className="space-y-2 border-t pt-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Record</span>
                            <span className="font-semibold">
                              {player.wins}-{player.losses}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Games</span>
                            <span className="font-semibold">{player.gamesPlayed}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Points</span>
                            <span className="font-semibold">{player.totalPoints}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">PPG</span>
                            <span className="font-semibold">{player.ppg}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="border-t pt-3 text-xs text-muted-foreground">No games yet</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Table View */}
            {viewMode === "table" && (
              <div className="overflow-x-auto rounded-lg border bg-card">
                <table className="w-full">
                  <thead className="border-b bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <button
                          type="button"
                          onClick={() => handleSort("name")}
                          className="font-heading text-xs font-medium uppercase tracking-wider hover:text-primary"
                        >
                          Player <SortIndicator field="name" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleSort("games")}
                          className="font-heading text-xs font-medium uppercase tracking-wider hover:text-primary"
                        >
                          Games <SortIndicator field="games" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleSort("winPct")}
                          className="font-heading text-xs font-medium uppercase tracking-wider hover:text-primary"
                        >
                          Win % <SortIndicator field="winPct" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleSort("totalPoints")}
                          className="font-heading text-xs font-medium uppercase tracking-wider hover:text-primary"
                        >
                          Points <SortIndicator field="totalPoints" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleSort("ppg")}
                          className="font-heading text-xs font-medium uppercase tracking-wider hover:text-primary"
                        >
                          PPG <SortIndicator field="ppg" />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {sortedPlayers.map((player, index) => (
                      <tr key={player.id} className="transition hover:bg-muted/50">
                        <td className="px-4 py-3">
                          <Link
                            href={`/players/${player.id}`}
                            className="flex items-center gap-3 hover:text-primary"
                          >
                            <span className="w-8 text-center font-mono text-sm text-muted-foreground">
                              {index + 1}
                            </span>
                            {player.imageUrl ? (
                              <div className="relative h-10 w-10 overflow-hidden rounded-full">
                                <Image src={player.imageUrl} alt={player.name} fill className="object-cover" />
                              </div>
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                                {player.name.charAt(0)}
                              </div>
                            )}
                            <span className="font-medium">{player.name}</span>
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-center">{player.gamesPlayed}</td>
                        <td className="px-4 py-3 text-center">
                          {player.gamesPlayed > 0 ? `${player.winPct.toFixed(1)}%` : "-"}
                        </td>
                        <td className="px-4 py-3 text-center font-semibold">{player.totalPoints}</td>
                        <td className="px-4 py-3 text-center font-semibold">{player.ppg}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {!isLoading && !error && sortedPlayers.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            {search && "No players found matching your search."}
            {!search && "No players found."}
          </div>
        )}
      </div>
    </div>
  );
}
