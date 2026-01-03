/**
 * Not Found Page
 * Handles 404 errors when a requested page or resource doesn't exist
 * Provides helpful navigation links to guide users back to valid pages
 */

import Link from "next/link";
import { Navbar } from "@/components/Navbar";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      <Navbar />

      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          {/* Error Code */}
          <div className="mb-8">
            <h1 className="mb-4 text-8xl font-bold text-primary">404</h1>
            <h2 className="text-3xl font-bold md:text-4xl">
              Page not found
            </h2>
          </div>

          {/* Error Message */}
          <div className="mb-8 rounded-lg border bg-card p-6">
            <p className="text-lg text-muted-foreground">
              The page you're looking for doesn't exist or may have been moved.
              Check the URL for typos or head back to explore our content.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="rounded-lg bg-primary px-8 py-4 text-lg font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              Go Home
            </Link>
            <Link
              href="/players"
              className="rounded-lg border-2 border-primary bg-background px-8 py-4 text-lg font-medium text-primary transition hover:bg-secondary"
            >
              Browse Players
            </Link>
          </div>

          {/* Popular Links */}
          <div className="mt-12 border-t pt-8">
            <h3 className="mb-6 text-xl font-semibold">
              Popular destinations
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Link
                href="/videos"
                className="rounded-lg border bg-card p-6 transition hover:shadow-lg"
              >
                <h4 className="mb-2 font-semibold">Video Library</h4>
                <p className="text-sm text-muted-foreground">
                  Browse all cataloged 1v1 basketball videos
                </p>
              </Link>
              <Link
                href="/players"
                className="rounded-lg border bg-card p-6 transition hover:shadow-lg"
              >
                <h4 className="mb-2 font-semibold">Player Profiles</h4>
                <p className="text-sm text-muted-foreground">
                  Explore player stats and career highlights
                </p>
              </Link>
              <Link
                href="/submit"
                className="rounded-lg border bg-card p-6 transition hover:shadow-lg"
              >
                <h4 className="mb-2 font-semibold">Submit Video</h4>
                <p className="text-sm text-muted-foreground">
                  Contribute to the community by submitting videos
                </p>
              </Link>
              <Link
                href="/"
                className="rounded-lg border bg-card p-6 transition hover:shadow-lg"
              >
                <h4 className="mb-2 font-semibold">Recent Games</h4>
                <p className="text-sm text-muted-foreground">
                  Check out the latest analyzed games
                </p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
