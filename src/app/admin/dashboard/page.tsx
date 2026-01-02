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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Isostat Management</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
          >
            Logout
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-card border rounded-lg p-6">
            <div className="text-sm text-muted-foreground mb-1">Total Videos</div>
            <div className="text-3xl font-bold">
              {videoStats.data?.total || 0}
            </div>
          </div>
          <div className="bg-card border rounded-lg p-6">
            <div className="text-sm text-muted-foreground mb-1">Pending Review</div>
            <div className="text-3xl font-bold text-yellow-600">
              {videoStats.data?.byStatus.pending || 0}
            </div>
          </div>
          <div className="bg-card border rounded-lg p-6">
            <div className="text-sm text-muted-foreground mb-1">Total Players</div>
            <div className="text-3xl font-bold">
              {players.data?.length || 0}
            </div>
          </div>
          <div className="bg-card border rounded-lg p-6">
            <div className="text-sm text-muted-foreground mb-1">Total Games</div>
            <div className="text-3xl font-bold">
              {games.data?.length || 0}
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="/admin/videos"
              className="p-4 border rounded-lg hover:bg-secondary transition"
            >
              <h3 className="font-semibold mb-1">Video Moderation</h3>
              <p className="text-sm text-muted-foreground">
                Review and approve submitted videos
              </p>
              {videoStats.data && videoStats.data.byStatus.pending > 0 && (
                <div className="mt-2 inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                  {videoStats.data.byStatus.pending} pending
                </div>
              )}
            </Link>

            <Link
              href="/admin/players"
              className="p-4 border rounded-lg hover:bg-secondary transition"
            >
              <h3 className="font-semibold mb-1">Player Management</h3>
              <p className="text-sm text-muted-foreground">
                Create and edit player profiles
              </p>
            </Link>

            <Link
              href="/admin/games"
              className="p-4 border rounded-lg hover:bg-secondary transition"
            >
              <h3 className="font-semibold mb-1">Game Entry</h3>
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
