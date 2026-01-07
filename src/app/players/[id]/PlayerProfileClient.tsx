"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/layout/Navbar';
import { trpc } from '@/lib/trpc/client';
import { Instagram, Youtube, Twitter } from 'lucide-react';
import { calculateWinLoss, calculateTotalPoints, calculatePPG, calculateAge } from '@/lib/utils';
import { notFound } from 'next/navigation';

export default function PlayerProfileClient({ id }: { id: string }) {
  const { data: player, isLoading, error } = trpc.player.getById.useQuery({ id });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-64 rounded-xl bg-muted" />
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="h-96 rounded-xl bg-muted" />
              <div className="col-span-2 h-96 rounded-xl bg-muted" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !player) {
    notFound();
    return null;
  }

  const allGames = [...player.gamesAsPlayer1, ...player.gamesAsPlayer2].sort(
    (a, b) => new Date(b.gameDate).getTime() - new Date(a.gameDate).getTime()
  );

  const { wins } = calculateWinLoss(allGames, player.id);
  const totalPoints = calculateTotalPoints(allGames, player.id);
  const ppg = calculatePPG(totalPoints, allGames.length);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="mb-8 overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="relative h-32 bg-primary/10 sm:h-48">
            <div className="absolute -bottom-12 left-4 sm:left-8">
              <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-card bg-muted sm:h-32 sm:w-32">
                {player.imageUrl ? (
                  <Image
                    src={player.imageUrl}
                    alt={player.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-primary/20 text-3xl font-bold text-primary">
                    {player.name.charAt(0)}
                  </div>
                )}
              </div>
            </div>
            
            {/* Social Links */}
            <div className="absolute right-4 top-4 flex gap-2">
              {player.instagramHandle && (
                <a
                  href={`https://instagram.com/${player.instagramHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-background/80 p-2 text-foreground transition hover:bg-background hover:text-[#E1306C]"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {player.twitterHandle && (
                <a
                  href={`https://twitter.com/${player.twitterHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-background/80 p-2 text-foreground transition hover:bg-background hover:text-[#1DA1F2]"
                >
                  <Twitter className="h-5 w-5" />
                </a>
              )}
              {player.youtubeChannel && (
                <a
                  href={player.youtubeChannel}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-background/80 p-2 text-foreground transition hover:bg-background hover:text-[#FF0000]"
                >
                  <Youtube className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>

          <div className="mt-14 px-4 pb-6 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="font-heading text-3xl font-bold uppercase tracking-wide">
                  {player.name}
                </h1>
                {(player.fullName || player.location) && (
                  <div className="mt-1 flex flex-wrap gap-x-4 text-sm text-muted-foreground">
                    {player.fullName && <span>{player.fullName}</span>}
                    {player.location && (
                      <span className="flex items-center gap-1">
                        📍 {player.location}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="flex gap-6 rounded-lg border bg-muted/30 p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{allGames.length}</div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Games</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {allGames.length > 0 ? Math.round((wins / allGames.length) * 100) : 0}%
                  </div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Win Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{ppg}</div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">PPG</div>
                </div>
              </div>
            </div>

            {/* Bio & Details */}
            <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <div>
                  <h2 className="mb-3 font-heading text-lg font-semibold uppercase tracking-wider">
                    About
                  </h2>
                  <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
                    {player.bio || "No bio available."}
                  </p>
                </div>

                {/* Recent Games */}
                <div>
                  <h2 className="mb-4 font-heading text-lg font-semibold uppercase tracking-wider">
                    Recent Games
                  </h2>
                  <div className="space-y-3">
                    {allGames.length > 0 ? (
                      allGames.map((game) => {
                        const isPlayer1 = game.player1Id === player.id;
                        const opponent = isPlayer1 ? game.player2 : game.player1;
                        const playerScore = isPlayer1 ? game.player1Score : game.player2Score;
                        const opponentScore = isPlayer1 ? game.player2Score : game.player1Score;
                        const isWin = game.winnerId === player.id;

                        return (
                          <Link
                            key={game.id}
                            href={game.video?.url || '#'}
                            target="_blank"
                            className="flex items-center justify-between rounded-lg border p-3 transition hover:bg-muted"
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`flex h-6 w-6 items-center justify-center rounded text-xs font-bold ${
                                  isWin
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {isWin ? "W" : "L"}
                              </span>
                              <div className="text-sm">
                                <span className="text-muted-foreground">vs</span>{" "}
                                <span className="font-medium">{opponent.name}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="font-mono text-sm font-semibold">
                                {playerScore} - {opponentScore}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(game.gameDate).toLocaleDateString()}
                              </span>
                            </div>
                          </Link>
                        );
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground">No games recorded yet.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar Details */}
              <div className="rounded-lg border bg-card p-6">
                <h3 className="mb-4 font-heading text-sm font-semibold uppercase tracking-wider">
                  Player Details
                </h3>
                <dl className="space-y-4 text-sm">
                  {player.height && (
                    <div className="flex justify-between border-b pb-2">
                      <dt className="text-muted-foreground">Height</dt>
                      <dd className="font-medium">{player.height}</dd>
                    </div>
                  )}
                  {player.weight && (
                    <div className="flex justify-between border-b pb-2">
                      <dt className="text-muted-foreground">Weight</dt>
                      <dd className="font-medium">{player.weight}</dd>
                    </div>
                  )}
                  {player.birthDate && (
                    <div className="flex justify-between border-b pb-2">
                      <dt className="text-muted-foreground">Age</dt>
                      <dd className="font-medium">{calculateAge(player.birthDate)}</dd>
                    </div>
                  )}
                  {player.hometown && (
                    <div className="flex justify-between border-b pb-2">
                      <dt className="text-muted-foreground">Hometown</dt>
                      <dd className="font-medium">{player.hometown}</dd>
                    </div>
                  )}
                  <div className="flex justify-between pt-2">
                    <dt className="text-muted-foreground">Joined</dt>
                    <dd className="font-medium">
                      {new Date(player.createdAt).toLocaleDateString()}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
