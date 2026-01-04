// src/app/donate/page.tsx
// Donate page for community contributions

import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";

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

            <p className="mb-8 text-muted-foreground">
              We&apos;re working on setting up donation options. Contributions
              will help fund server costs, API access, and future features like
              automated stats extraction.
            </p>

            <p className="text-sm text-muted-foreground">
              In the meantime, the best way to support Isostat is by{" "}
              <Link href="/submit" className="text-primary hover:underline">
                submitting game data
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
