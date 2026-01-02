/**
 * Home Page
 * Landing page for the Isostat application
 */

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-4xl space-y-8 text-center">
          <h1 className="text-6xl font-bold tracking-tight">Isostat</h1>
          <p className="text-xl text-muted-foreground">
            Track and analyze statistics from 1v1 basketball videos
          </p>

          <div className="mt-12 flex justify-center gap-4">
            <Link
              href="/players"
              className="rounded-lg bg-primary px-8 py-3 font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              Browse Players
            </Link>
            <Link
              href="/videos"
              className="rounded-lg bg-secondary px-8 py-3 font-medium text-secondary-foreground transition hover:bg-secondary/80"
            >
              Watch Videos
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-lg border bg-card p-6">
              <h3 className="mb-2 font-semibold">Player Profiles</h3>
              <p className="text-sm text-muted-foreground">
                Comprehensive statistics for every player across all their games
              </p>
            </div>
            <div className="rounded-lg border bg-card p-6">
              <h3 className="mb-2 font-semibold">Video Library</h3>
              <p className="text-sm text-muted-foreground">
                Watch games from top channels like The Next Chapter and Ballislife
              </p>
            </div>
            <div className="rounded-lg border bg-card p-6">
              <h3 className="mb-2 font-semibold">Leaderboards</h3>
              <p className="text-sm text-muted-foreground">
                See who's dominating in points, assists, rebounds, and more
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
