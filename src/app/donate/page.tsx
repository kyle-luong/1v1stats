// src/app/donate/page.tsx
// Donate page placeholder for community contributions

import { Navbar } from "@/components/Navbar";

export default function DonatePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="mb-4 font-heading text-4xl font-semibold uppercase tracking-wide md:text-5xl">
            Support Isostat
          </h1>
          <p className="mb-8 text-lg text-muted-foreground">
            Help us build the best 1v1 basketball statistics platform
          </p>

          <div className="rounded border bg-card p-8">
            <div className="mb-6">
              <span className="inline-block rounded bg-primary/10 px-3 py-1 font-heading text-sm uppercase tracking-wider text-primary">
                Coming Soon
              </span>
            </div>

            <h2 className="mb-4 font-heading text-xl font-medium uppercase tracking-wide">
              Donation Options
            </h2>
            <p className="mb-6 text-muted-foreground">
              We&apos;re working on setting up donation options. In the
              meantime, the best way to support Isostat is by contributing game
              data through our submit form.
            </p>

            <div className="space-y-4 text-left">
              <div className="rounded border p-4">
                <h3 className="mb-2 font-semibold">Submit Games</h3>
                <p className="text-sm text-muted-foreground">
                  Help grow our database by submitting 1v1 basketball game data
                  from YouTube videos.
                </p>
              </div>

              <div className="rounded border p-4">
                <h3 className="mb-2 font-semibold">Spread the Word</h3>
                <p className="text-sm text-muted-foreground">
                  Share Isostat with other basketball fans who might be
                  interested in 1v1 statistics.
                </p>
              </div>

              <div className="rounded border p-4">
                <h3 className="mb-2 font-semibold">Report Issues</h3>
                <p className="text-sm text-muted-foreground">
                  Found a bug or have a suggestion? Let us know so we can
                  improve the platform.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
