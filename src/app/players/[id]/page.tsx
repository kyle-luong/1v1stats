/**
 * Player Profile Page
 * Displays detailed player information, career stats, and recent games
 */

"use client";

import { use } from "react";
import Link from "next/link";
import Image from "next/image";
import { trpc } from "@/lib/trpc/Provider";
import { calculateWinLoss, calculateTotalPoints, calculatePPG, formatDate } from "@/lib/utils";

export default function PlayerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: player, isLoading, error } = trpc.player.getById.useQuery({ id });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading player...</div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold">Player Not Found</h1>
          <p className="text-muted-foreground">The player you are looking for does not exist.</p>
          <Link href="/players" className="mt-4 inline-block text-primary hover:underline">
            Back to Players
          </Link>
        </div>
      </div>
    );
  }

  const allGames = [...player.gamesAsPlayer1, ...player.gamesAsPlayer2];
  const { wins, losses } = calculateWinLoss(allGames, player.id);
  const totalPoints = calculateTotalPoints(allGames, player.id);
  const gamesPlayed = allGames.length;
  const ppg = calculatePPG(totalPoints, gamesPlayed);

  // Sort games by date (most recent first)
  const recentGames = allGames
    .sort((a, b) => new Date(b.gameDate).getTime() - new Date(a.gameDate).getTime())
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-start">
          <div className="relative h-48 w-48 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
            {player.imageUrl ? (
              <Image
                src={player.imageUrl}
                alt={player.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="flex h-32 w-32 items-center justify-center rounded-full bg-primary/10 text-6xl font-bold text-primary">
                  {player.name.charAt(0)}
                </div>
              </div>
            )}
          </div>

          <div className="flex-1">
            <h1 className="mb-4 text-4xl font-bold">{player.name}</h1>

            <div className="mb-4 grid grid-cols-2 gap-x-8 gap-y-2 text-sm md:grid-cols-3">
              {player.height && (
                <div>
                  <span className="text-muted-foreground">Height:</span>
                  <span className="ml-2 font-semibold">{player.height}</span>
                </div>
              )}
              {player.position && (
                <div>
                  <span className="text-muted-foreground">Position:</span>
                  <span className="ml-2 font-semibold">{player.position}</span>
                </div>
              )}
              {player.location && (
                <div>
                  <span className="text-muted-foreground">Location:</span>
                  <span className="ml-2 font-semibold">{player.location}</span>
                </div>
              )}
            </div>

            {player.instagramHandle && (
              <a
                href={`https://instagram.com/${player.instagramHandle.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
                @{player.instagramHandle.replace("@", "")}
              </a>
            )}
          </div>
        </div>

        {/* Career Stats Section */}
        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-bold">Career Stats</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm text-muted-foreground">Games Played</div>
              <div className="text-3xl font-bold">{gamesPlayed}</div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm text-muted-foreground">Record</div>
              <div className="text-3xl font-bold">
                {wins}-{losses}
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm text-muted-foreground">Total Points</div>
              <div className="text-3xl font-bold">{totalPoints}</div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm text-muted-foreground">PPG</div>
              <div className="text-3xl font-bold">{ppg}</div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm text-muted-foreground">Win Rate</div>
              <div className="text-3xl font-bold">
                {gamesPlayed > 0 ? ((wins / gamesPlayed) * 100).toFixed(1) : "0.0"}%
              </div>
            </div>
          </div>
        </div>

        {/* Recent Games Section */}
        <div>
          <h2 className="mb-4 text-2xl font-bold">Recent Games</h2>
          {recentGames.length > 0 ? (
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Opponent</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Result</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Score</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentGames.map((game) => {
                    const isPlayer1 = game.player1Id === player.id;
                    const opponentId = isPlayer1 ? game.player2Id : game.player1Id;
                    const opponentName = isPlayer1 ? game.player2?.name : game.player1?.name;
                    const playerScore = isPlayer1 ? game.player1Score : game.player2Score;
                    const opponentScore = isPlayer1 ? game.player2Score : game.player1Score;
                    const won = game.winnerId === player.id;

                    return (
                      <tr key={game.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {formatDate(game.gameDate)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Link
                            href={`/players/${opponentId}`}
                            className="font-medium hover:text-primary hover:underline"
                          >
                            {opponentName || "Unknown"}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-block rounded px-2 py-1 text-xs font-bold ${
                              won
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            }`}
                          >
                            {won ? "W" : "L"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-semibold">
                          {playerScore}-{opponentScore}
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-semibold">
                          {playerScore}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
              No games yet
            </div>
          )}
        </div>

        <div className="mt-8">
          <p className="text-sm text-muted-foreground">
            Detailed stats coming in Phase 3
          </p>
        </div>
      </div>
    </div>
  );
}
