// src/app/feedback/page.tsx
// Feedback page for bug reports and feature suggestions

import { Navbar } from "@/components/layout/Navbar";

export default function FeedbackPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-4 text-center font-heading text-4xl font-semibold uppercase tracking-wide md:text-5xl">
            Feedback
          </h1>
          <p className="mb-8 text-center text-lg text-muted-foreground">
            Help us improve 1v1stats
          </p>

          <div className="rounded border bg-card p-8">
            <div className="mb-6">
              <span className="inline-block rounded bg-primary/10 px-3 py-1 font-heading text-sm uppercase tracking-wider text-primary">
                Coming Soon
              </span>
            </div>

            <p className="mb-6 text-muted-foreground">
              We&apos;re setting up a feedback system. In the meantime, you can
              reach out through these channels:
            </p>

            <div className="space-y-4">
              <div className="rounded border p-4">
                <h3 className="mb-2 font-heading text-sm font-medium uppercase tracking-wide">
                  Report a Bug
                </h3>
                <p className="text-sm text-muted-foreground">
                  Found something broken? Let us know so we can fix it.
                </p>
              </div>

              <div className="rounded border p-4">
                <h3 className="mb-2 font-heading text-sm font-medium uppercase tracking-wide">
                  Suggest a Feature
                </h3>
                <p className="text-sm text-muted-foreground">
                  Have an idea to make 1v1stats better? We&apos;d love to hear
                  it.
                </p>
              </div>

              <div className="rounded border p-4">
                <h3 className="mb-2 font-heading text-sm font-medium uppercase tracking-wide">
                  Data Corrections
                </h3>
                <p className="text-sm text-muted-foreground">
                  Notice incorrect stats or player info? Help us keep data
                  accurate.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
