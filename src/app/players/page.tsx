/**
 * Players Page
 * Displays all players with search functionality
 */

"use client";

import { trpc } from "@/lib/trpc/Provider";

export default function PlayersPage() {
  const { data: players, isLoading } = trpc.player.getAll.useQuery();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-4xl font-bold">Players</h1>

        {isLoading ? (
          <div className="text-muted-foreground">Loading players...</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {players && players.length > 0 ? (
              players.map((player) => (
                <div
                  key={player.id}
                  className="rounded-lg border bg-card p-6 transition hover:shadow-lg"
                >
                  <h3 className="text-lg font-semibold">{player.name}</h3>
                  {player.position && (
                    <p className="text-sm text-muted-foreground">{player.position}</p>
                  )}
                  {player.location && (
                    <p className="text-sm text-muted-foreground">{player.location}</p>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                No players found. Add some players to get started!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
