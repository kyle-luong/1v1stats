// src/app/games/page.tsx
// Games listing page showing all recorded 1v1 basketball games

"use client";

import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { trpc } from "@/lib/trpc/client";
import { formatDate } from "@/lib/utils";

export default function GamesPage() {
  const { data: games, isLoading, error } = trpc.game.getAll.useQuery();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-heading text-4xl font-semibold uppercase tracking-wide">
            Games
          </h1>
          <p className="mt-2 text-muted-foreground">
            Browse all recorded 1v1 basketball matchups
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-6 text-center">
            <h2 className="mb-2 text-lg font-semibold text-destructive">
              Failed to Load Games
            </h2>
            <p className="text-sm text-muted-foreground">
              There was an error loading games. Please try refreshing the page.
            </p>
          </div>
        )}

        {/* Using array index as key is safe here because skeleton loaders are static,
            never reorder, and have no state or user interaction. */}
        {/* eslint-disable react/no-array-index-key */}
        {isLoading && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={`game-skeleton-${i}`}
                className="animate-pulse overflow-hidden rounded-lg border bg-card"
              >
                <div className="aspect-video bg-muted" />
                <div className="p-4 space-y-3">
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}
        {/* eslint-enable react/no-array-index-key */}

        {!isLoading && !error && games && games.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {games.map((game) => (
              <Link
                key={game.id}
                href={`/games/${game.id}`}
                className="group overflow-hidden rounded-lg border bg-card transition hover:shadow-lg"
              >
                {game.video?.thumbnailUrl && (
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    <Image
                      src={game.video.thumbnailUrl}
                      alt={`${game.player1.name} vs ${game.player2.name}`}
                      fill
                      className="object-cover transition group-hover:scale-105"
                    />
                  </div>
                )}

                <div className="p-4">
                  {/* Matchup */}
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold">{game.player1.name}</div>
                      <div className="text-2xl font-bold text-primary">
                        {game.player1Score}
                      </div>
                    </div>
                    <div className="px-4 font-heading text-sm text-muted-foreground">
                      VS
                    </div>
                    <div className="flex-1 text-right">
                      <div className="font-semibold">{game.player2.name}</div>
                      <div className="text-2xl font-bold text-primary">
                        {game.player2Score}
                      </div>
                    </div>
                  </div>

                  {/* Meta info */}
                  {game.video && (
                    <div className="border-t pt-3 text-sm text-muted-foreground">
                      <div className="truncate">{game.video.channelName}</div>
                      <div>{formatDate(game.gameDate)}</div>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {!isLoading && !error && (!games || games.length === 0) && (
          <div className="py-12 text-center text-muted-foreground">
            No games recorded yet. Check back soon!
          </div>
        )}
      </div>
    </div>
  );
}
