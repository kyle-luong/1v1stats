/**
 * Error Page
 * Handles runtime errors and 500-level errors for the application
 * Displays user-friendly error message with recovery options
 */

"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Navbar } from "@/components/Navbar";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to console for debugging
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      <Navbar />

      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          {/* Error Code */}
          <div className="mb-8">
            <h1 className="mb-4 text-8xl font-bold text-primary">500</h1>
            <h2 className="text-3xl font-bold md:text-4xl">
              Something went wrong
            </h2>
          </div>

          {/* Error Message */}
          <div className="mb-8 rounded-lg border bg-card p-6">
            <p className="mb-4 text-lg text-muted-foreground">
              We encountered an unexpected error while processing your request.
              This has been logged and we'll look into it.
            </p>

            {/* Show error digest if available (helpful for debugging) */}
            {error.digest && (
              <p className="text-sm text-muted-foreground">
                Error ID: {error.digest}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={reset}
              className="rounded-lg bg-primary px-8 py-4 text-lg font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="rounded-lg border-2 border-primary bg-background px-8 py-4 text-lg font-medium text-primary transition hover:bg-secondary"
            >
              Go Home
            </Link>
          </div>

          {/* Additional Help Links */}
          <div className="mt-12 border-t pt-8">
            <p className="mb-4 text-sm text-muted-foreground">
              If the problem persists, you can:
            </p>
            <div className="flex flex-col gap-2 text-sm sm:flex-row sm:justify-center sm:gap-6">
              <Link
                href="/videos"
                className="text-primary hover:underline"
              >
                Browse Videos
              </Link>
              <Link
                href="/players"
                className="text-primary hover:underline"
              >
                View Players
              </Link>
              <Link
                href="/submit"
                className="text-primary hover:underline"
              >
                Submit a Video
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
