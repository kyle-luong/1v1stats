/**
 * Admin Games Page
 * View, edit, and delete approved games
 */

"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import Link from "next/link";
import { PageHeader } from "@/components/common/PageHeader";

interface Game {
  id: string;
  player1Id: string;
  player2Id: string;
  player1Score: number;
  player2Score: number;
  winnerId: string;
  isOfficial: boolean;
  gameDate: Date;
  notes: string | null;
  player1: { id: string; name: string };
  player2: { id: string; name: string };
  video: { id: string; title: string; channelName: string } | null;
  ruleset: { id: string; name: string; scoringTarget: number } | null;
}

interface EditModalProps {
  game: Game;
  onClose: () => void;
  onSave: () => void;
}

function EditModal({ game, onClose, onSave }: EditModalProps) {
  const [player1Score, setPlayer1Score] = useState(game.player1Score.toString());
  const [player2Score, setPlayer2Score] = useState(game.player2Score.toString());
  const [isOfficial, setIsOfficial] = useState(game.isOfficial);
  const [notes, setNotes] = useState(game.notes ?? "");
  const [error, setError] = useState("");

  const utils = trpc.useUtils();
  const updateMutation = trpc.game.update.useMutation({
    onSuccess: () => {
      utils.game.getAll.invalidate();
      onSave();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const score1 = parseInt(player1Score, 10);
    const score2 = parseInt(player2Score, 10);

    if (Number.isNaN(score1) || Number.isNaN(score2)) {
      setError("Please enter valid scores");
      return;
    }

    if (score1 === score2) {
      setError("Game cannot end in a tie");
      return;
    }

    await updateMutation.mutateAsync({
      id: game.id,
      player1Score: score1,
      player2Score: score2,
      isOfficial,
      notes: notes || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Edit Game</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 hover:bg-secondary"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="mb-4 rounded bg-secondary/50 p-3 text-sm">
          <div className="font-medium">{game.video?.title || "No video"}</div>
          <div className="text-muted-foreground">{game.video?.channelName}</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="p1-score" className="mb-1 block text-sm font-medium">
                {game.player1.name}
              </label>
              <input
                id="p1-score"
                type="number"
                min="0"
                value={player1Score}
                onChange={(e) => setPlayer1Score(e.target.value)}
                className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="p2-score" className="mb-1 block text-sm font-medium">
                {game.player2.name}
              </label>
              <input
                id="p2-score"
                type="number"
                min="0"
                value={player2Score}
                onChange={(e) => setPlayer2Score(e.target.value)}
                className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="edit-official"
              type="checkbox"
              checked={isOfficial}
              onChange={(e) => setIsOfficial(e.target.checked)}
              className="h-4 w-4 rounded"
            />
            <label htmlFor="edit-official" className="text-sm">
              Official Game
            </label>
          </div>

          <div>
            <label htmlFor="edit-notes" className="mb-1 block text-sm font-medium">
              Notes (optional)
            </label>
            <textarea
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="flex w-full rounded border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          {error && (
            <div className="rounded bg-destructive/10 p-2 text-sm text-destructive">{error}</div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded border bg-secondary px-4 py-2 text-sm hover:bg-secondary/80"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex-1 rounded bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminGamesPage() {
  const [editGame, setEditGame] = useState<Game | null>(null);
  const games = trpc.game.getAll.useQuery();
  const utils = trpc.useUtils();

  const deleteMutation = trpc.game.delete.useMutation({
    onSuccess: () => {
      utils.game.getAll.invalidate();
      utils.video.getAll.invalidate();
    },
  });

  const handleDelete = async (game: Game, deleteVideo: boolean) => {
    const message = deleteVideo
      ? `PERMANENTLY DELETE game and video?\n\n${game.player1.name} vs ${game.player2.name}\n\nThis allows the same video to be re-submitted.`
      : `Remove game from site?\n\n${game.player1.name} vs ${game.player2.name}\n\nVideo stays in DB (prevents re-submission).`;

    // eslint-disable-next-line no-alert
    if (window.confirm(message)) {
      await deleteMutation.mutateAsync({ id: game.id, deleteVideo });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <PageHeader
            title="Games"
            subtitle="View, edit, and delete approved games"
            className="mb-0"
          />
          <Link
            href="/admin/submissions"
            className="shrink-0 rounded bg-primary px-6 py-3 font-heading text-sm font-medium uppercase tracking-wider text-primary-foreground transition hover:bg-primary/90"
          >
            Review Submissions
          </Link>
        </div>

        {/* Info Banner */}
        <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <p className="text-sm text-muted-foreground">
            Games are created by approving submissions in the{" "}
            <Link href="/admin/submissions" className="font-medium text-primary hover:underline">
              Submissions
            </Link>{" "}
            page.
          </p>
        </div>

        {/* Games List */}
        <section>
          <h2 className="mb-3 font-heading text-xs font-medium uppercase tracking-wider text-muted-foreground">
            All Games
          </h2>
          <div className="overflow-hidden rounded-lg border bg-card">
            {games.isLoading && (
              <div className="p-8 text-center text-muted-foreground">Loading games...</div>
            )}
            {!games.isLoading && games.data?.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                No games yet.{" "}
                <Link href="/admin/submissions" className="text-primary hover:underline">
                  Review submissions
                </Link>{" "}
                to approve games.
              </div>
            )}
            {!games.isLoading && games.data && games.data.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-secondary/30">
                    <tr>
                      <th className="p-4 text-left font-heading text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Video
                      </th>
                      <th className="p-4 text-left font-heading text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Players
                      </th>
                      <th className="p-4 text-left font-heading text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Score
                      </th>
                      <th className="p-4 text-left font-heading text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Details
                      </th>
                      <th className="p-4 text-left font-heading text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Date
                      </th>
                      <th className="p-4 text-right font-heading text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                <tbody>
                  {games.data?.map((game) => (
                    <tr key={game.id} className="border-t">
                      <td className="max-w-xs p-4">
                        <div className="truncate font-medium">{game.video?.title || "No video"}</div>
                        <div className="text-sm text-muted-foreground">
                          {game.video?.channelName}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={game.winnerId === game.player1Id ? "font-bold" : ""}
                          >
                            {game.player1.name}
                          </span>
                          <span className="text-muted-foreground">vs</span>
                          <span
                            className={game.winnerId === game.player2Id ? "font-bold" : ""}
                          >
                            {game.player2.name}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-mono text-lg">
                          {game.player1Score} - {game.player2Score}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1 text-xs">
                          {game.isOfficial && (
                            <span className="w-fit rounded bg-blue-100 px-2 py-0.5 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                              Official
                            </span>
                          )}
                          {game.notes && (
                            <span className="text-muted-foreground" title={game.notes}>
                              {game.notes.length > 30
                                ? `${game.notes.slice(0, 30)}...`
                                : game.notes}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          {new Date(game.gameDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/games/${game.id}`}
                            className="rounded bg-secondary px-3 py-1 text-sm hover:bg-secondary/80"
                          >
                            View
                          </Link>
                          <button
                            type="button"
                            onClick={() => setEditGame(game as Game)}
                            className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(game as Game, false)}
                            disabled={deleteMutation.isPending}
                            className="rounded bg-orange-600 px-3 py-1 text-sm text-white hover:bg-orange-700 disabled:opacity-50"
                            title="Remove game but keep video in DB (prevents re-submission)"
                          >
                            Remove
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(game as Game, true)}
                            disabled={deleteMutation.isPending}
                            className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700 disabled:opacity-50"
                            title="Delete game AND video from DB (allows re-submission)"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
      </div>

      {/* Edit Modal */}
      {editGame && (
        <EditModal
          game={editGame}
          onClose={() => setEditGame(null)}
          onSave={() => setEditGame(null)}
        />
      )}
    </div>
  );
}
