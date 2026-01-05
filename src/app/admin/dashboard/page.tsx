/**
 * Admin Dashboard
 * Overview of platform stats and quick links to admin tools
 */

"use client";

import { trpc } from "@/lib/trpc/client";
import { PageHeader } from "@/components/common/PageHeader";
import Link from "next/link";

export default function AdminDashboardPage() {
  const videoStats = trpc.video.getStats.useQuery();
  const players = trpc.player.getAll.useQuery();
  const games = trpc.game.getAll.useQuery();

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader title="Dashboard" subtitle="Overview of platform statistics" />

      {/* Stats Overview */}
      <section className="mb-10">
        <h2 className="mb-4 font-heading text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Statistics
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-1 font-heading text-xs uppercase tracking-wider text-muted-foreground">
              Total Submissions
            </div>
            <div className="font-heading text-3xl font-bold text-primary">
              {videoStats.data?.total || 0}
            </div>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-1 font-heading text-xs uppercase tracking-wider text-muted-foreground">
              Pending Approval
            </div>
            <div className="font-heading text-3xl font-bold text-yellow-600">
              {videoStats.data?.byStatus.pending || 0}
            </div>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-1 font-heading text-xs uppercase tracking-wider text-muted-foreground">
              Total Players
            </div>
            <div className="font-heading text-3xl font-bold text-primary">
              {players.data?.length || 0}
            </div>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-1 font-heading text-xs uppercase tracking-wider text-muted-foreground">
              Approved Games
            </div>
            <div className="font-heading text-3xl font-bold text-primary">
              {games.data?.length || 0}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section>
        <h2 className="mb-4 font-heading text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/admin/submissions"
            className="group rounded-lg border bg-card p-6 transition hover:border-primary hover:shadow-md"
          >
            <h3 className="mb-2 font-heading text-lg font-medium uppercase tracking-wide transition group-hover:text-primary">
              Submissions
            </h3>
            <p className="text-sm text-muted-foreground">
              Review, approve, or reject submissions
            </p>
            {videoStats.data && videoStats.data.byStatus.pending > 0 && (
              <div className="mt-3 inline-block rounded bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
                {videoStats.data.byStatus.pending} pending
              </div>
            )}
          </Link>

          <Link
            href="/admin/players"
            className="group rounded-lg border bg-card p-6 transition hover:border-primary hover:shadow-md"
          >
            <h3 className="mb-2 font-heading text-lg font-medium uppercase tracking-wide transition group-hover:text-primary">
              Players
            </h3>
            <p className="text-sm text-muted-foreground">Create and edit player profiles</p>
          </Link>

          <Link
            href="/admin/games"
            className="group rounded-lg border bg-card p-6 transition hover:border-primary hover:shadow-md"
          >
            <h3 className="mb-2 font-heading text-lg font-medium uppercase tracking-wide transition group-hover:text-primary">
              Games
            </h3>
            <p className="text-sm text-muted-foreground">View, edit, and delete games</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
