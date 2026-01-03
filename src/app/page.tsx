// src/app/page.tsx
// Home page with CraftedNBA-inspired design

"use client";

import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { trpc } from "@/lib/trpc/client";
import { formatDate } from "@/lib/utils";

export default function HomePage() {
  const completedVideos = trpc.video.getAll.useQuery({
    status: "COMPLETED" as const,
    limit: 100,
  });
  const players = trpc.player.getAll.useQuery();
  const recentGames = trpc.game.getAll.useQuery();

  const totalVideos = completedVideos.data?.length || 0;
  const totalPlayers = players.data?.length || 0;
  const totalGames = recentGames.data?.length || 0;
  const recentGamesList = recentGames.data?.slice(0, 6) || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="border-b bg-card py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mb-4 font-heading text-5xl font-semibold uppercase tracking-wide md:text-6xl lg:text-7xl">
              Isostat
            </h1>
            <p className="mb-2 font-heading text-xl uppercase tracking-wider text-primary md:text-2xl">
              1v1 Basketball Statistics
            </p>
            <p className="mb-10 text-lg text-muted-foreground">
              Community-driven analytics from YouTube
            </p>

            {/* Primary CTA Buttons - Games and Players */}
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/games"
                className="rounded bg-primary px-10 py-4 font-heading text-lg font-medium uppercase tracking-wider text-primary-foreground transition hover:bg-primary/90"
              >
                View Games
              </Link>
              <Link
                href="/players"
                className="rounded border-2 border-primary bg-transparent px-10 py-4 font-heading text-lg font-medium uppercase tracking-wider text-primary transition hover:bg-primary/10"
              >
                Browse Players
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Showcase */}
      <section className="border-b py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
            <div>
              <div className="mb-1 font-heading text-4xl font-semibold text-primary md:text-5xl">
                {totalGames}
              </div>
              <div className="font-heading text-sm uppercase tracking-wider text-muted-foreground">
                Games
              </div>
            </div>
            <div>
              <div className="mb-1 font-heading text-4xl font-semibold text-primary md:text-5xl">
                {totalPlayers}
              </div>
              <div className="font-heading text-sm uppercase tracking-wider text-muted-foreground">
                Players
              </div>
            </div>
            <div>
              <div className="mb-1 font-heading text-4xl font-semibold text-primary md:text-5xl">
                {totalVideos}
              </div>
              <div className="font-heading text-sm uppercase tracking-wider text-muted-foreground">
                Videos
              </div>
            </div>
            <div>
              <div className="mb-1 font-heading text-4xl font-semibold text-primary md:text-5xl">
                100%
              </div>
              <div className="font-heading text-sm uppercase tracking-wider text-muted-foreground">
                Community
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-12 text-center font-heading text-3xl font-semibold uppercase tracking-wide md:text-4xl">
              What We Offer
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded border bg-card p-8 transition hover:shadow-md">
                <h3 className="mb-3 font-heading text-lg font-medium uppercase tracking-wide">
                  Player Profiles
                </h3>
                <p className="text-muted-foreground">
                  Comprehensive statistics for every player across all their
                  games. Track points, assists, rebounds, and more.
                </p>
              </div>
              <div className="rounded border bg-card p-8 transition hover:shadow-md">
                <h3 className="mb-3 font-heading text-lg font-medium uppercase tracking-wide">
                  Game Archive
                </h3>
                <p className="text-muted-foreground">
                  Watch games from top channels like The Next Chapter and
                  Ballislife. Every game linked to full video footage.
                </p>
              </div>
              <div className="rounded border bg-card p-8 transition hover:shadow-md">
                <h3 className="mb-3 font-heading text-lg font-medium uppercase tracking-wide">
                  Leaderboards
                </h3>
                <p className="text-muted-foreground">
                  See who&apos;s dominating in points, assists, rebounds, and
                  advanced metrics. Compare players head-to-head.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Games Section */}
      {recentGamesList.length > 0 && (
        <section className="border-t bg-card/50 py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-6xl">
              <div className="mb-8 flex items-center justify-between">
                <h2 className="font-heading text-3xl font-semibold uppercase tracking-wide md:text-4xl">
                  Recent Games
                </h2>
                <Link
                  href="/games"
                  className="font-heading text-sm font-medium uppercase tracking-wider text-primary hover:underline"
                >
                  View All
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {recentGamesList.map((game) => (
                  <Link
                    key={game.id}
                    href={`/games/${game.id}`}
                    className="group overflow-hidden rounded border bg-card transition hover:shadow-md"
                  >
                    {game.video?.thumbnailUrl && (
                      <div className="relative aspect-video w-full overflow-hidden bg-muted">
                        <Image
                          src={game.video.thumbnailUrl}
                          alt={game.video.title}
                          fill
                          className="object-cover transition group-hover:scale-105"
                        />
                      </div>
                    )}

                    <div className="p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-semibold">{game.player1.name}</div>
                          <div className="font-heading text-2xl font-semibold text-primary">
                            {game.player1Score}
                          </div>
                        </div>
                        <div className="px-4 font-heading text-sm text-muted-foreground">
                          VS
                        </div>
                        <div className="flex-1 text-right">
                          <div className="font-semibold">{game.player2.name}</div>
                          <div className="font-heading text-2xl font-semibold text-primary">
                            {game.player2Score}
                          </div>
                        </div>
                      </div>

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
            </div>
          </div>
        </section>
      )}

      {/* Support Section - Secondary Donate CTA */}
      <section className="border-t py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 font-heading text-2xl font-semibold uppercase tracking-wide md:text-3xl">
              Support the Project
            </h2>
            <p className="mb-6 text-muted-foreground">
              Isostat is a community-driven project. Your contributions help us
              maintain and improve the platform.
            </p>
            <Link
              href="/donate"
              className="inline-block rounded border-2 border-primary bg-transparent px-8 py-3 font-heading text-sm font-medium uppercase tracking-wider text-primary transition hover:bg-primary/10"
            >
              Donate
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
              <div>
                <h3 className="mb-4 font-heading text-lg font-medium uppercase tracking-wide">
                  Isostat
                </h3>
                <p className="text-sm text-muted-foreground">
                  Community-driven basketball analytics from YouTube 1v1 videos.
                </p>
              </div>
              <div>
                <h3 className="mb-4 font-heading text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  Explore
                </h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link
                      href="/games"
                      className="text-foreground hover:text-primary"
                    >
                      Games
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/players"
                      className="text-foreground hover:text-primary"
                    >
                      Players
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/videos"
                      className="text-foreground hover:text-primary"
                    >
                      Videos
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="mb-4 font-heading text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  Contribute
                </h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link
                      href="/submit"
                      className="text-foreground hover:text-primary"
                    >
                      Submit Games
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/donate"
                      className="text-foreground hover:text-primary"
                    >
                      Donate
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="mb-4 font-heading text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  Legal
                </h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link
                      href="/privacy"
                      className="text-foreground hover:text-primary"
                    >
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/terms"
                      className="text-foreground hover:text-primary"
                    >
                      Terms of Service
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
              {new Date().getFullYear()} Isostat. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
