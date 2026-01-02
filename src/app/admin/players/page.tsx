/**
 * Admin Player Management
 * CRUD interface for managing player profiles
 */

"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import Link from "next/link";
import PlayerFormModal from "./PlayerFormModal";

export default function AdminPlayersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null);
  const utils = trpc.useUtils();

  const players = trpc.player.getAll.useQuery({
    search: searchTerm || undefined,
    limit: 100,
  });

  const deletePlayer = trpc.player.delete.useMutation({
    onSuccess: () => {
      utils.player.getAll.invalidate();
    },
  });

  const handleDelete = async (id: string, name: string) => {
    // eslint-disable-next-line no-alert
    const confirmed = window.confirm(
      `Are you sure you want to delete ${name}? This will also delete all associated games and stats.`
    );

    if (confirmed) {
      try {
        const result = await deletePlayer.mutateAsync({ id });
        // eslint-disable-next-line no-alert
        alert(
          `Successfully deleted ${name} and ${result.deletedGames} associated game(s).`
        );
      } catch (error) {
        // eslint-disable-next-line no-alert
        alert(`Failed to delete player: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Player Management</h1>
            <p className="text-muted-foreground">Create and manage player profiles</p>
          </div>
          <Link
            href="/admin/dashboard"
            className="rounded-md bg-secondary px-4 py-2 text-secondary-foreground hover:bg-secondary/80"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Search and Create */}
        <div className="mb-6 flex gap-4">
          <input
            type="text"
            placeholder="Search players by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 rounded-md border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-md bg-primary px-6 py-2 text-primary-foreground hover:bg-primary/90"
          >
            Create New Player
          </button>
        </div>

        {/* Players Table */}
        <div className="overflow-hidden rounded-lg border bg-card">
          {players.isLoading && (
            <div className="p-8 text-center text-muted-foreground">Loading players...</div>
          )}
          {!players.isLoading && players.data?.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No players found. Create your first player to get started!
            </div>
          )}
          {!players.isLoading && players.data && players.data.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="p-4 text-left">Name</th>
                    <th className="p-4 text-left">Aliases</th>
                    <th className="p-4 text-left">Height</th>
                    <th className="p-4 text-left">Position</th>
                    <th className="p-4 text-left">Location</th>
                    <th className="p-4 text-left">Games</th>
                    <th className="p-4 text-left">Instagram</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {players.data.map((player) => {
                    const totalGames = player.gamesAsPlayer1.length + player.gamesAsPlayer2.length;
                    const wins =
                      player.gamesAsPlayer1.filter((game) => game.winnerId === player.id).length +
                      player.gamesAsPlayer2.filter((game) => game.winnerId === player.id).length;
                    const losses = totalGames - wins;

                    return (
                      <tr key={player.id} className="border-t hover:bg-secondary/20">
                        <td className="p-4">
                          <div className="font-semibold">{player.name}</div>
                        </td>
                        <td className="p-4">
                          {player.aliases.length > 0 ? (
                            <div className="text-sm text-muted-foreground">
                              {player.aliases.join(", ")}
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground/50">—</div>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="text-sm">
                            {player.height || <span className="text-muted-foreground/50">—</span>}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm">
                            {player.position || <span className="text-muted-foreground/50">—</span>}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm">
                            {player.location || <span className="text-muted-foreground/50">—</span>}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm">
                            {totalGames > 0 ? (
                              <span>
                                {totalGames} ({wins}-{losses})
                              </span>
                            ) : (
                              <span className="text-muted-foreground/50">0</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          {player.instagramHandle ? (
                            <a
                              href={`https://instagram.com/${player.instagramHandle.replace("@", "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline"
                            >
                              @{player.instagramHandle.replace("@", "")}
                            </a>
                          ) : (
                            <span className="text-sm text-muted-foreground/50">—</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingPlayer(player.id)}
                              className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(player.id, player.name)}
                              disabled={deletePlayer.isPending}
                              className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700 disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <PlayerFormModal
          mode="create"
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            utils.player.getAll.invalidate();
          }}
        />
      )}

      {/* Edit Modal */}
      {editingPlayer && (
        <PlayerFormModal
          mode="edit"
          playerId={editingPlayer}
          onClose={() => setEditingPlayer(null)}
          onSuccess={() => {
            setEditingPlayer(null);
            utils.player.getAll.invalidate();
          }}
        />
      )}
    </div>
  );
}
