/**
 * Home Page
 * Landing page for the Isostat application
 */

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-6xl font-bold tracking-tight">
            Isostat
          </h1>
          <p className="text-xl text-muted-foreground">
            Track and analyze statistics from 1v1 basketball videos
          </p>

          <div className="flex gap-4 justify-center mt-12">
            <Link
              href="/players"
              className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition"
            >
              Browse Players
            </Link>
            <Link
              href="/videos"
              className="px-8 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition"
            >
              Watch Videos
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <div className="p-6 bg-card rounded-lg border">
              <h3 className="font-semibold mb-2">Player Profiles</h3>
              <p className="text-sm text-muted-foreground">
                Comprehensive statistics for every player across all their games
              </p>
            </div>
            <div className="p-6 bg-card rounded-lg border">
              <h3 className="font-semibold mb-2">Video Library</h3>
              <p className="text-sm text-muted-foreground">
                Watch games from top channels like The Next Chapter and Ballislife
              </p>
            </div>
            <div className="p-6 bg-card rounded-lg border">
              <h3 className="font-semibold mb-2">Leaderboards</h3>
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
