/**
 * Admin Dashboard
 * Overview of platform stats and quick links to admin tools
 */

"use client";

import { trpc } from "@/lib/trpc/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminDashboardPage() {
  const router = useRouter();
  const videoStats = trpc.video.getStats.useQuery();
  const players = trpc.player.getAll.useQuery();
  const games = trpc.game.getAll.useQuery();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Isostat Management</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md bg-destructive px-4 py-2 text-destructive-foreground hover:bg-destructive/90"
          >
            Logout
          </button>
        </div>

        {/* Stats Overview */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-1 text-sm text-muted-foreground">Total Videos</div>
            <div className="text-3xl font-bold">{videoStats.data?.total || 0}</div>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-1 text-sm text-muted-foreground">Pending Review</div>
            <div className="text-3xl font-bold text-yellow-600">
              {videoStats.data?.byStatus.pending || 0}
            </div>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-1 text-sm text-muted-foreground">Total Players</div>
            <div className="text-3xl font-bold">{players.data?.length || 0}</div>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-1 text-sm text-muted-foreground">Total Games</div>
            <div className="text-3xl font-bold">{games.data?.length || 0}</div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/admin/videos"
              className="rounded-lg border p-4 transition hover:bg-secondary"
            >
              <h3 className="mb-1 font-semibold">Video Moderation</h3>
              <p className="text-sm text-muted-foreground">Review and approve submitted videos</p>
              {videoStats.data && videoStats.data.byStatus.pending > 0 && (
                <div className="mt-2 inline-block rounded bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
                  {videoStats.data.byStatus.pending} pending
                </div>
              )}
            </Link>

            <Link
              href="/admin/players"
              className="rounded-lg border p-4 transition hover:bg-secondary"
            >
              <h3 className="mb-1 font-semibold">Player Management</h3>
              <p className="text-sm text-muted-foreground">Create and edit player profiles</p>
            </Link>

            <Link
              href="/admin/games"
              className="rounded-lg border p-4 transition hover:bg-secondary"
            >
              <h3 className="mb-1 font-semibold">Game Entry</h3>
              <p className="text-sm text-muted-foreground">
                Link videos to players and enter scores
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
