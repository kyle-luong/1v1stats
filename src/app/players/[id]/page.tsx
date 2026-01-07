/**
 * Player Profile Page
 * Displays detailed player information, career stats, and recent games
 * Wikipedia-style comprehensive player profiles
 */

import type { Metadata } from 'next';
import { use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/server/db';
import { Navbar } from '@/components/layout/Navbar';
import { trpc } from '@/lib/trpc/Provider';
import { calculateWinLoss, calculateTotalPoints, calculatePPG, formatDate, calculateAge } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  
  try {
    const player = await db.player.findUnique({
      where: { id },
      include: {
        gamesAsPlayer1: true,
        gamesAsPlayer2: true,
      },
    });

    if (!player) {
      return {
        title: 'Player Not Found - 1v1stats',
        description: 'The player you are looking for does not exist.',
      };
    }

    const allGames = [...player.gamesAsPlayer1, ...player.gamesAsPlayer2];
    const { wins, losses } = calculateWinLoss(allGames, player.id);
    const totalPoints = calculateTotalPoints(allGames, player.id);
    const gamesPlayed = allGames.length;
    const ppg = calculatePPG(totalPoints, gamesPlayed);

    const description = `${player.name} - ${wins}-${losses} record, ${totalPoints} total points, ${ppg} PPG. View complete 1v1 basketball stats, career highlights, and game history.`;
    
    return {
      title: `${player.name} - 1v1 Basketball Stats & Profile`,
      description,
      openGraph: {
        title: `${player.name} | 1v1stats`,
        description,
        type: 'profile',
        images: player.imageUrl ? [{ url: player.imageUrl, alt: player.name }] : [],
      },
      twitter: {
        card: 'summary',
        title: `${player.name} | 1v1stats`,
        description,
        images: player.imageUrl ? [player.imageUrl] : [],
      },
    };
  } catch (error) {
    return {
      title: 'Player Profile - 1v1stats',
      description: 'View player statistics and game history',
    };
  }
}



export default function PlayerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: player, isLoading, error } = trpc.player.getById.useQuery({ id });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          {/* Header Skeleton */}
          <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-start">
            <Skeleton className="h-48 w-48 flex-shrink-0 rounded-lg" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-10 w-64" />
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-32" />
              </div>
            </div>
          </div>

          {/* Stats Cards Skeleton */}
          {/* eslint-disable react/no-array-index-key */}
          <div className="mb-8">
            <Skeleton className="mb-4 h-8 w-40" />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
              {[...Array(5)].map((_, i) => (
                <div key={`stat-skeleton-${i}`} className="rounded-lg border bg-card p-4">
                  <Skeleton className="mb-2 h-4 w-20" />
                  <Skeleton className="h-9 w-16" />
                </div>
              ))}
            </div>
          </div>
          {/* eslint-enable react/no-array-index-key */}

          {/* Games Table Skeleton */}
          {/* eslint-disable react/no-array-index-key */}
          <div>
            <Skeleton className="mb-4 h-8 w-48" />
            <div className="overflow-hidden rounded-lg border">
              <div className="bg-muted p-4">
                <div className="flex gap-4">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
              <div className="divide-y">
                {[...Array(5)].map((_, i) => (
                  <div key={`game-skeleton-${i}`} className="flex gap-4 p-4">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-12" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* eslint-enable react/no-array-index-key */}
        </div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
          <div className="text-center">
            <h1 className="mb-2 text-2xl font-bold">Player Not Found</h1>
            <p className="text-muted-foreground">The player you are looking for does not exist.</p>
            <Link href="/players" className="mt-4 inline-block text-primary hover:underline">
              Back to Players
            </Link>
          </div>
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

  const hasSocialLinks =
    player.instagramHandle ||
    player.twitterHandle ||
    player.youtubeChannel ||
    player.tiktokHandle;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-start">
          <div className="relative h-48 w-48 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
            {player.imageUrl ? (
              <Image src={player.imageUrl} alt={player.name} fill className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="flex h-32 w-32 items-center justify-center rounded-full bg-primary/10 text-6xl font-bold text-primary">
                  {player.name.charAt(0)}
                </div>
              </div>
            )}
          </div>

          <div className="flex-1">
            {/* Name */}
            <h1 className="mb-1 text-4xl font-bold">{player.name}</h1>
            {player.fullName && player.fullName !== player.name && (
              <p className="mb-2 text-lg text-muted-foreground">{player.fullName}</p>
            )}

            {/* Aliases */}
            {player.aliases && player.aliases.length > 0 && (
              <p className="mb-4 text-sm text-muted-foreground">
                Also known as: {player.aliases.join(", ")}
              </p>
            )}

            {/* Quick Info Grid */}
            <div className="mb-4 grid grid-cols-2 gap-x-8 gap-y-2 text-sm md:grid-cols-3">
              {player.height && (
                <div>
                  <span className="text-muted-foreground">Height:</span>
                  <span className="ml-2 font-semibold">{player.height}</span>
                </div>
              )}
              {player.weight && (
                <div>
                  <span className="text-muted-foreground">Weight:</span>
                  <span className="ml-2 font-semibold">{player.weight}</span>
                </div>
              )}
              {player.birthDate && (
                <div>
                  <span className="text-muted-foreground">Age:</span>
                  <span className="ml-2 font-semibold">{calculateAge(player.birthDate)}</span>
                </div>
              )}
              {player.hometown && (
                <div>
                  <span className="text-muted-foreground">From:</span>
                  <span className="ml-2 font-semibold">{player.hometown}</span>
                </div>
              )}
              {player.location && (
                <div>
                  <span className="text-muted-foreground">Based in:</span>
                  <span className="ml-2 font-semibold">{player.location}</span>
                </div>
              )}
            </div>

            {/* Social Links */}
            {hasSocialLinks && (
              <div className="flex flex-wrap gap-4">
                {player.instagramHandle && (
                  <a
                    href={`https://instagram.com/${player.instagramHandle.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                    Instagram
                  </a>
                )}
                {player.twitterHandle && (
                  <a
                    href={`https://twitter.com/${player.twitterHandle.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    Twitter
                  </a>
                )}
                {player.youtubeChannel && (() => {
                  let youtubeUrl = player.youtubeChannel;
                  if (youtubeUrl.startsWith("http")) {
                    // Full URL with protocol - use as-is
                  } else if (youtubeUrl.startsWith("youtube.com") || youtubeUrl.startsWith("www.youtube.com")) {
                    // URL without protocol - add https
                    youtubeUrl = `https://${youtubeUrl}`;
                  } else {
                    // Just a channel name - construct full URL
                    youtubeUrl = `https://youtube.com/@${youtubeUrl}`;
                  }
                  return (
                    <a
                      href={youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
                    >
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                      YouTube
                    </a>
                  );
                })()}
                {player.tiktokHandle && (
                  <a
                    href={`https://tiktok.com/@${player.tiktokHandle.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                    </svg>
                    TikTok
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bio Section */}
        {player.bio && (
          <div className="mb-8">
            <h2 className="mb-3 text-2xl font-bold">About</h2>
            <div className="rounded-lg border bg-card p-4">
              <p className="whitespace-pre-wrap text-muted-foreground">{player.bio}</p>
            </div>
          </div>
        )}

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
      </div>
    </div>
  );
}
