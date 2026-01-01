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
        <h1 className="text-4xl font-bold mb-8">Players</h1>

        {isLoading ? (
          <div className="text-muted-foreground">Loading players...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {players && players.length > 0 ? (
              players.map((player) => (
                <div
                  key={player.id}
                  className="p-6 bg-card border rounded-lg hover:shadow-lg transition"
                >
                  <h3 className="font-semibold text-lg">{player.name}</h3>
                  {player.position && (
                    <p className="text-sm text-muted-foreground">{player.position}</p>
                  )}
                  {player.location && (
                    <p className="text-sm text-muted-foreground">{player.location}</p>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No players found. Add some players to get started!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
