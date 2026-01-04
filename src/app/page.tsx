// src/app/page.tsx
// Home page with CraftedNBA-inspired design

"use client";

import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/layout/Navbar";
import { BasketballCourt } from "@/components/common/BasketballCourt";
import { trpc } from "@/lib/trpc/client";
import { formatDate } from "@/lib/utils";

export default function HomePage() {
  // Use optimized count queries instead of fetching all records
  const videoCount = trpc.video.getPublicCount.useQuery();
  const playerCount = trpc.player.getCount.useQuery();
  const gameCount = trpc.game.getCount.useQuery();
  const recentGames = trpc.game.getRecent.useQuery({ limit: 6 });

  const totalVideos = videoCount.data ?? 0;
  const totalPlayers = playerCount.data ?? 0;
  const totalGames = gameCount.data ?? 0;
  const recentGamesList = recentGames.data ?? [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section - Full viewport height */}
      <section className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center border-b bg-card px-4">
        {/* Basketball court lines background - half-court floor */}
        <div className="pointer-events-none absolute inset-0 flex items-start justify-center overflow-hidden opacity-[0.06]">
          <BasketballCourt className="mt-12 h-[135%] w-auto text-primary" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl text-center">
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

          {/* Featured games preview */}
          <div className="mt-16">
            <p className="mb-4 font-heading text-xs uppercase tracking-widest text-muted-foreground">
              {recentGamesList.length > 0 ? "Recent Matchups" : "Sample Matchups"}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {recentGamesList.length > 0 ? (
                recentGamesList.slice(0, 3).map((game) => (
                  <Link
                    key={game.id}
                    href={`/games/${game.id}`}
                    className="flex items-center gap-2 rounded border bg-background px-4 py-2 text-sm transition hover:border-primary"
                  >
                    <span className="font-medium">{game.player1.name}</span>
                    <span className="font-heading text-primary">
                      {game.player1Score}-{game.player2Score}
                    </span>
                    <span className="font-medium">{game.player2.name}</span>
                  </Link>
                ))
              ) : (
                <>
                  <div className="flex items-center gap-2 rounded border bg-background px-4 py-2 text-sm">
                    <span className="font-medium">Cash</span>
                    <span className="font-heading text-primary">21-18</span>
                    <span className="font-medium">Hezi</span>
                  </div>
                  <div className="flex items-center gap-2 rounded border bg-background px-4 py-2 text-sm">
                    <span className="font-medium">Bone Collector</span>
                    <span className="font-heading text-primary">30-27</span>
                    <span className="font-medium">The Professor</span>
                  </div>
                  <div className="flex items-center gap-2 rounded border bg-background px-4 py-2 text-sm">
                    <span className="font-medium">Slim Reaper</span>
                    <span className="font-heading text-primary">21-15</span>
                    <span className="font-medium">White Iverson</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute inset-x-0 bottom-8 flex justify-center animate-bounce text-muted-foreground">
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </section>

      {/* Stats Showcase */}
      <section className="border-b py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 gap-4 text-center md:gap-8">
            <div>
              <div className="mb-1 font-heading text-3xl font-bold text-primary sm:text-4xl md:text-5xl">
                {totalGames}
              </div>
              <div className="font-heading text-sm uppercase tracking-wider text-muted-foreground">
                Games
              </div>
            </div>
            <div>
              <div className="mb-1 font-heading text-3xl font-bold text-primary sm:text-4xl md:text-5xl">
                {totalPlayers}
              </div>
              <div className="font-heading text-sm uppercase tracking-wider text-muted-foreground">
                Players
              </div>
            </div>
            <div>
              <div className="mb-1 font-heading text-3xl font-bold text-primary sm:text-4xl md:text-5xl">
                {totalVideos}
              </div>
              <div className="font-heading text-sm uppercase tracking-wider text-muted-foreground">
                Videos
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
              <div className="rounded border bg-card p-8">
                <h3 className="mb-3 font-heading text-lg font-medium uppercase tracking-wide">
                  Player Profiles
                </h3>
                <p className="text-muted-foreground">
                  Comprehensive statistics for every player across all their
                  games. Track points, assists, rebounds, and more.
                </p>
              </div>
              <div className="rounded border bg-card p-8">
                <h3 className="mb-3 font-heading text-lg font-medium uppercase tracking-wide">
                  Game Archive
                </h3>
                <p className="text-muted-foreground">
                  Browse detailed game statistics and watch footage from top
                  channels. Every matchup with full box scores.
                </p>
              </div>
              <div className="rounded border bg-card p-8">
                <div className="mb-3 flex items-center gap-2">
                  <h3 className="font-heading text-lg font-medium uppercase tracking-wide">
                    Leaderboards
                  </h3>
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    Soon
                  </span>
                </div>
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

      {/* Get Involved */}
      <section className="border-t py-14">
        <div className="container mx-auto px-4">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-8">
            <h2 className="font-heading text-lg font-medium uppercase tracking-wider text-muted-foreground">
              Get Involved
            </h2>
            <div className="flex flex-wrap justify-center gap-8 md:gap-12">
              <Link
                href="/submit"
                className="group flex flex-col items-center gap-2"
              >
                <span className="font-heading text-base font-medium uppercase tracking-wider text-foreground transition group-hover:text-primary">
                  Submit Games
                </span>
                <span className="text-sm text-muted-foreground">
                  Add game data
                </span>
              </Link>
              <Link
                href="/donate"
                className="group flex flex-col items-center gap-2"
              >
                <span className="font-heading text-base font-medium uppercase tracking-wider text-foreground transition group-hover:text-primary">
                  Donate
                </span>
                <span className="text-sm text-muted-foreground">
                  Support the project
                </span>
              </Link>
              <Link
                href="/feedback"
                className="group flex flex-col items-center gap-2"
              >
                <span className="font-heading text-base font-medium uppercase tracking-wider text-foreground transition group-hover:text-primary">
                  Feedback
                </span>
                <span className="text-sm text-muted-foreground">
                  Report issues
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap - Vertical timeline */}
      <section className="border-t bg-card/50 py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-xl">
            <h2 className="mb-10 text-center font-heading text-2xl font-semibold uppercase tracking-wide">
              Roadmap
            </h2>
            <div className="relative border-l-2 border-border pl-8">
              <div className="relative mb-8">
                <div className="absolute -left-[41px] flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                  <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                </div>
                <span className="mb-1 block font-heading text-xs uppercase tracking-wider text-primary">
                  Now
                </span>
                <span className="text-foreground">
                  Core game and player statistics
                </span>
              </div>
              <div className="relative mb-8">
                <div className="absolute -left-[41px] flex h-5 w-5 items-center justify-center rounded-full border-2 border-primary bg-card">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                </div>
                <span className="mb-1 block font-heading text-xs uppercase tracking-wider text-primary">
                  Next
                </span>
                <span className="text-foreground">
                  Sortable leaderboards and player rankings
                </span>
              </div>
              <div className="relative">
                <div className="absolute -left-[41px] flex h-5 w-5 items-center justify-center rounded-full border-2 border-muted-foreground bg-card" />
                <span className="mb-1 block font-heading text-xs uppercase tracking-wider text-muted-foreground">
                  Later
                </span>
                <span className="text-muted-foreground">
                  Head-to-head comparisons and advanced analytics
                </span>
              </div>
            </div>
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
                  <li>
                    <Link
                      href="/feedback"
                      className="text-foreground hover:text-primary"
                    >
                      Feedback
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
