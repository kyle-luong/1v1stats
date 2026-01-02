/**
 * Admin Game Entry and Management
 * Interface for creating games from videos and viewing all games
 */

"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import Link from "next/link";
import GameEntryForm from "./GameEntryForm";

export default function AdminGamesPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const utils = trpc.useUtils();

  const games = trpc.game.getAll.useQuery();

  const handleGameCreated = () => {
    setShowCreateForm(false);
    utils.game.getAll.invalidate();
    utils.video.getVideosWithoutGames.invalidate();
    utils.video.getStats.invalidate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Game Management</h1>
            <p className="text-muted-foreground">Create and manage 1v1 games</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/dashboard"
              className="rounded-md bg-secondary px-4 py-2 text-secondary-foreground hover:bg-secondary/80"
            >
              Back to Dashboard
            </Link>
            <button
              type="button"
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
            >
              {showCreateForm ? "Cancel" : "Create New Game"}
            </button>
          </div>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="mb-6 rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-xl font-semibold">Create New Game</h2>
            <GameEntryForm onSuccess={handleGameCreated} />
          </div>
        )}

        {/* Games List */}
        <div className="overflow-hidden rounded-lg border bg-card">
          {games.isLoading && (
            <div className="p-8 text-center text-muted-foreground">Loading games...</div>
          )}
          {!games.isLoading && games.data?.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No games created yet. Click "Create New Game" to get started.
            </div>
          )}
          {!games.isLoading && games.data && games.data.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="p-4 text-left">Video</th>
                    <th className="p-4 text-left">Players</th>
                    <th className="p-4 text-left">Score</th>
                    <th className="p-4 text-left">Ruleset</th>
                    <th className="p-4 text-left">Details</th>
                    <th className="p-4 text-left">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {games.data?.map((game) => (
                    <tr key={game.id} className="border-t">
                      <td className="p-4">
                        <div className="font-medium">{game.video.title}</div>
                        <div className="text-sm text-muted-foreground">{game.video.channelName}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className={game.winnerId === game.player1Id ? "font-bold" : ""}>
                            {game.player1.name}
                          </span>
                          <span className="text-muted-foreground">vs</span>
                          <span className={game.winnerId === game.player2Id ? "font-bold" : ""}>
                            {game.player2.name}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-mono text-lg">
                          {game.player1Score} - {game.player2Score}
                        </div>
                      </td>
                      <td className="p-4">
                        {game.ruleset ? (
                          <div className="text-sm">
                            <div className="font-medium">{game.ruleset.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {game.ruleset.scoringTarget} pts
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">No ruleset</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1 text-xs">
                          {game.isOfficial && (
                            <span className="w-fit rounded bg-blue-100 px-2 py-0.5 text-blue-800">
                              Official
                            </span>
                          )}
                          {game.courtType !== "UNKNOWN" && (
                            <span className="w-fit rounded bg-gray-100 px-2 py-0.5 text-gray-800">
                              {game.courtType}
                            </span>
                          )}
                          {game.location && (
                            <span className="text-muted-foreground">{game.location}</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          {new Date(game.gameDate).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
