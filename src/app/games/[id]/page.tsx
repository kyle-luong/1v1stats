/**
 * Game Detail Page
 * Displays game information, YouTube embed, and player statistics
 */

"use client";

import { use } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { trpc } from "@/lib/trpc/Provider";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function GameDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: game, isLoading, error } = trpc.game.getById.useQuery({ id });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          {/* Video Embed Skeleton */}
          <div className="mb-8">
            <Skeleton className="aspect-video w-full rounded-lg" />
            <Skeleton className="mt-4 h-8 w-3/4" />
            <Skeleton className="mt-2 h-5 w-1/3" />
          </div>

          {/* Player Cards Skeleton */}
          {/* eslint-disable react/no-array-index-key */}
          <div className="mb-8 grid gap-6 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={`player-skeleton-${i}`} className="rounded-lg border bg-card p-6">
                <Skeleton className="mb-4 h-8 w-48" />
                <div className="mb-4 flex justify-center">
                  <Skeleton className="h-20 w-20" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))}
          </div>
          {/* eslint-enable react/no-array-index-key */}

          {/* Game Details Skeleton */}
          <div className="mb-8 rounded-lg border bg-card p-6">
            <Skeleton className="mb-4 h-7 w-40" />
            <div className="grid gap-4 md:grid-cols-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>

          {/* Stats Table Skeleton */}
          <div className="rounded-lg border bg-card p-6">
            <Skeleton className="mb-4 h-7 w-32" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
          <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold">Game Not Found</h1>
            <p className="text-muted-foreground">The game you are looking for does not exist.</p>
            <Link href="/videos" className="mt-4 inline-block text-primary hover:underline">
              Back to Videos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const player1Won = game.winnerId === game.player1Id;
  const hasDetailedStats = game.stats && game.stats.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* YouTube Embed */}
        {game.video && (
          <div className="mb-8">
            <div className="aspect-video overflow-hidden rounded-lg border bg-muted">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${game.video.youtubeId}`}
                title={game.video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
            <h1 className="mt-4 text-2xl font-bold">{game.video.title}</h1>
            <p className="text-muted-foreground">{game.video.channelName}</p>
          </div>
        )}

        {/* Game Info Section */}
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          {/* Player 1 Card */}
          <Link
            href={`/players/${game.player1.id}`}
            className="group overflow-hidden rounded-lg border bg-card transition hover:shadow-lg"
          >
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold">{game.player1.name}</h2>
                {player1Won && (
                  <span className="rounded bg-green-100 px-3 py-1 text-sm font-bold text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    WINNER
                  </span>
                )}
              </div>
              <div className="mb-4 text-center">
                <div className="text-6xl font-bold">{game.player1Score}</div>
                <div className="text-sm text-muted-foreground">Points</div>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                {game.player1.height && <p>Height: {game.player1.height}</p>}
                {game.player1.position && <p>Position: {game.player1.position}</p>}
                {game.player1.location && <p>Location: {game.player1.location}</p>}
              </div>
            </div>
          </Link>

          {/* Player 2 Card */}
          <Link
            href={`/players/${game.player2.id}`}
            className="group overflow-hidden rounded-lg border bg-card transition hover:shadow-lg"
          >
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold">{game.player2.name}</h2>
                {!player1Won && (
                  <span className="rounded bg-green-100 px-3 py-1 text-sm font-bold text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    WINNER
                  </span>
                )}
              </div>
              <div className="mb-4 text-center">
                <div className="text-6xl font-bold">{game.player2Score}</div>
                <div className="text-sm text-muted-foreground">Points</div>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                {game.player2.height && <p>Height: {game.player2.height}</p>}
                {game.player2.position && <p>Position: {game.player2.position}</p>}
                {game.player2.location && <p>Location: {game.player2.location}</p>}
              </div>
            </div>
          </Link>
        </div>

        {/* Game Details */}
        <div className="mb-8 rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-xl font-bold">Game Details</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="text-sm text-muted-foreground">Date</div>
              <div className="font-semibold">{formatDate(game.gameDate)}</div>
            </div>
            {game.location && (
              <div>
                <div className="text-sm text-muted-foreground">Location</div>
                <div className="font-semibold">{game.location}</div>
              </div>
            )}
            {game.ruleset && (
              <div>
                <div className="text-sm text-muted-foreground">Ruleset</div>
                <div className="font-semibold">{game.ruleset.name}</div>
              </div>
            )}
          </div>
          {game.notes && (
            <div className="mt-4">
              <div className="text-sm text-muted-foreground">Notes</div>
              <p className="mt-1">{game.notes}</p>
            </div>
          )}
        </div>

        {/* Stats Section */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-xl font-bold">Statistics</h2>
          {hasDetailedStats ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Player</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">PTS</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">FG</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">3PT</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">FT</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">REB</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">AST</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">STL</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">BLK</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">TO</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {game.stats.map((stat) => (
                    <tr key={stat.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">
                        <Link
                          href={`/players/${stat.playerId}`}
                          className="hover:text-primary hover:underline"
                        >
                          {stat.playerId === game.player1Id
                            ? game.player1.name
                            : game.player2.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold">{stat.points}</td>
                      <td className="px-4 py-3 text-center text-sm">
                        {stat.fieldGoalsMade}/{stat.fieldGoalsAttempted}
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        {stat.threePointersMade}/{stat.threePointersAttempted}
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        {stat.freeThrowsMade}/{stat.freeThrowsAttempted}
                      </td>
                      <td className="px-4 py-3 text-center">{stat.rebounds}</td>
                      <td className="px-4 py-3 text-center">{stat.assists}</td>
                      <td className="px-4 py-3 text-center">{stat.steals}</td>
                      <td className="px-4 py-3 text-center">{stat.blocks}</td>
                      <td className="px-4 py-3 text-center">{stat.turnovers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              Detailed stats coming in Phase 3
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
