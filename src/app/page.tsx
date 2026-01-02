/**
 * Home Page
 * Landing page for the Isostat application with hero section and stats showcase
 */

"use client";

import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { trpc } from "@/lib/trpc/client";
import { formatDate } from "@/lib/utils";

export default function HomePage() {
  const videoStats = trpc.video.getStats.useQuery();
  const players = trpc.player.getAll.useQuery();
  const recentGames = trpc.game.getAll.useQuery();

  const totalVideos = videoStats.data?.total || 0;
  const totalPlayers = players.data?.length || 0;
  const recentGamesList = recentGames.data?.slice(0, 5) || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      <Navbar />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-6 text-5xl font-bold tracking-tight md:text-6xl lg:text-7xl">
            Isostat
          </h1>
          <p className="mb-4 text-xl text-muted-foreground md:text-2xl">
            1v1 Basketball Statistics
          </p>
          <p className="mb-8 text-lg text-muted-foreground">
            Community-driven analytics from YouTube
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/submit"
              className="rounded-lg bg-primary px-8 py-4 text-lg font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              Submit a Video
            </Link>
            <Link
              href="/players"
              className="rounded-lg border-2 border-primary bg-background px-8 py-4 text-lg font-medium text-primary transition hover:bg-secondary"
            >
              Browse Players
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Showcase */}
      <section className="border-y bg-card/50 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
            <div>
              <div className="mb-2 text-4xl font-bold text-primary md:text-5xl">
                {totalVideos}
              </div>
              <div className="text-sm text-muted-foreground md:text-base">
                Videos Cataloged
              </div>
            </div>
            <div>
              <div className="mb-2 text-4xl font-bold text-primary md:text-5xl">
                {totalPlayers}
              </div>
              <div className="text-sm text-muted-foreground md:text-base">
                Players Tracked
              </div>
            </div>
            <div>
              <div className="mb-2 text-4xl font-bold text-primary md:text-5xl">
                {recentGamesList.length}
              </div>
              <div className="text-sm text-muted-foreground md:text-base">
                Games Analyzed
              </div>
            </div>
            <div>
              <div className="mb-2 text-4xl font-bold text-primary md:text-5xl">100%</div>
              <div className="text-sm text-muted-foreground md:text-base">
                Community Driven
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold md:text-4xl">
            What We Offer
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="rounded-lg border bg-card p-8 transition hover:shadow-lg">
              <div className="mb-4 text-4xl">📊</div>
              <h3 className="mb-3 text-xl font-semibold">Player Profiles</h3>
              <p className="text-muted-foreground">
                Comprehensive statistics for every player across all their games.
                Track points, assists, rebounds, and more.
              </p>
            </div>
            <div className="rounded-lg border bg-card p-8 transition hover:shadow-lg">
              <div className="mb-4 text-4xl">🎥</div>
              <h3 className="mb-3 text-xl font-semibold">Video Library</h3>
              <p className="text-muted-foreground">
                Watch games from top channels like The Next Chapter and Ballislife.
                Every game linked to full video footage.
              </p>
            </div>
            <div className="rounded-lg border bg-card p-8 transition hover:shadow-lg">
              <div className="mb-4 text-4xl">🏆</div>
              <h3 className="mb-3 text-xl font-semibold">Leaderboards</h3>
              <p className="text-muted-foreground">
                See who's dominating in points, assists, rebounds, and advanced
                metrics. Compare players head-to-head.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Games Section */}
      {recentGamesList.length > 0 && (
        <section className="border-t bg-card/30 py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-6xl">
              <div className="mb-8 flex items-center justify-between">
                <h2 className="text-3xl font-bold md:text-4xl">Recent Games</h2>
                <Link
                  href="/videos"
                  className="text-sm font-medium text-primary hover:underline md:text-base"
                >
                  View All →
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {recentGamesList.map((game) => (
                  <div
                    key={game.id}
                    className="overflow-hidden rounded-lg border bg-card transition hover:shadow-lg"
                  >
                    {/* Thumbnail */}
                    {game.video?.thumbnailUrl && (
                      <div className="relative aspect-video w-full overflow-hidden bg-muted">
                        <Image
                          src={game.video.thumbnailUrl}
                          alt={game.video.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}

                    {/* Game Info */}
                    <div className="p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-semibold">{game.player1.name}</div>
                          <div className="text-2xl font-bold text-primary">
                            {game.player1Score}
                          </div>
                        </div>
                        <div className="px-4 text-muted-foreground">vs</div>
                        <div className="flex-1 text-right">
                          <div className="font-semibold">{game.player2.name}</div>
                          <div className="text-2xl font-bold text-primary">
                            {game.player2Score}
                          </div>
                        </div>
                      </div>

                      {game.video && (
                        <>
                          <div className="mb-2 truncate text-sm text-muted-foreground">
                            {game.video.title}
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{game.video.channelName}</span>
                            <span>{formatDate(game.gameDate)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t bg-card py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
              <div>
                <h3 className="mb-4 text-lg font-semibold">Isostat</h3>
                <p className="text-sm text-muted-foreground">
                  Community-driven basketball analytics from YouTube 1v1 videos.
                </p>
              </div>
              <div>
                <h3 className="mb-4 text-lg font-semibold">Explore</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/players" className="text-muted-foreground hover:text-foreground">
                      Players
                    </Link>
                  </li>
                  <li>
                    <Link href="/videos" className="text-muted-foreground hover:text-foreground">
                      Videos
                    </Link>
                  </li>
                  <li>
                    <Link href="/leaderboard" className="text-muted-foreground hover:text-foreground">
                      Leaderboard
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="mb-4 text-lg font-semibold">Contribute</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/submit" className="text-muted-foreground hover:text-foreground">
                      Submit Video
                    </Link>
                  </li>
                  <li>
                    <Link href="/about" className="text-muted-foreground hover:text-foreground">
                      About
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="mb-4 text-lg font-semibold">Legal</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/privacy" className="text-muted-foreground hover:text-foreground">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms" className="text-muted-foreground hover:text-foreground">
                      Terms of Service
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
              © {new Date().getFullYear()} Isostat. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
