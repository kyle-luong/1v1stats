/**
 * Players Listing Page
 * Displays all players with search, stats, and filtering
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { trpc } from "@/lib/trpc/Provider";
import { calculateWinLoss, calculateTotalPoints, calculatePPG } from "@/lib/utils";

export default function PlayersPage() {
  const [search, setSearch] = useState("");
  const { data: players, isLoading } = trpc.player.getAll.useQuery({
    search: search || undefined,
    limit: 100,
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-4 text-4xl font-bold">Players</h1>

          <input
            type="text"
            placeholder="Search players..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
        </div>

        {isLoading && <div className="text-muted-foreground">Loading players...</div>}
        {!isLoading && players && players.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {players.map((player) => {
              const allGames = [...player.gamesAsPlayer1, ...player.gamesAsPlayer2];
              const { wins, losses } = calculateWinLoss(allGames, player.id);
              const totalPoints = calculateTotalPoints(allGames, player.id);
              const gamesPlayed = allGames.length;
              const ppg = calculatePPG(totalPoints, gamesPlayed);

              return (
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
                      {player.position && <p>{player.position}</p>}
                      {player.location && <p>{player.location}</p>}
                    </div>

                    {gamesPlayed > 0 ? (
                      <div className="space-y-2 border-t pt-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Record</span>
                          <span className="font-semibold">
                            {wins}-{losses}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Games</span>
                          <span className="font-semibold">{gamesPlayed}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total Points</span>
                          <span className="font-semibold">{totalPoints}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">PPG</span>
                          <span className="font-semibold">{ppg}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="border-t pt-3 text-xs text-muted-foreground">
                        No games yet
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
        {!isLoading && (!players || players.length === 0) && (
          <div className="py-12 text-center text-muted-foreground">
            {search && "No players found matching your search."}
            {!search && "No players found."}
          </div>
        )}
      </div>
    </div>
  );
}
