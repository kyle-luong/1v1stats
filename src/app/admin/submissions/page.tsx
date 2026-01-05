/**
 * Admin Submissions Page
 * Review, approve, reject, and manage user submissions
 */

"use client";

import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc/client";
import { VideoStatus } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { extractYoutubeId, isValidYoutubeUrl } from "@/lib/youtube";
import { PageHeader } from "@/components/common/PageHeader";

// ============================================================================
// Admin Direct Submit Modal
// ============================================================================

interface AdminSubmitModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function AdminSubmitModal({ onClose, onSuccess }: AdminSubmitModalProps) {
  const utils = trpc.useUtils();

  // URL and metadata
  const [url, setUrl] = useState("");
  const [youtubeId, setYoutubeId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [channelName, setChannelName] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [uploadedAt, setUploadedAt] = useState<Date | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [metadataFetched, setMetadataFetched] = useState(false);

  // Player selection
  const [player1Id, setPlayer1Id] = useState("");
  const [player2Id, setPlayer2Id] = useState("");
  const [player1Search, setPlayer1Search] = useState("");
  const [player2Search, setPlayer2Search] = useState("");
  const [player1Score, setPlayer1Score] = useState("");
  const [player2Score, setPlayer2Score] = useState("");
  const [isOfficial, setIsOfficial] = useState(false);
  const [error, setError] = useState("");

  const players = trpc.player.getAll.useQuery({ limit: 1000 });

  const adminSubmit = trpc.video.adminSubmit.useMutation({
    onSuccess: () => {
      utils.video.getAll.invalidate();
      utils.video.getStats.invalidate();
      utils.game.getAll.invalidate();
      onSuccess();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  // Fetch metadata when URL is valid
  const fetchMetadata = useCallback(
    async (videoId: string) => {
      setIsFetchingMetadata(true);
      setError("");
      try {
        const data = await utils.video.getYoutubeMetadata.fetch({ videoId });
        setTitle(data.title);
        setChannelName(data.channelName);
        setThumbnailUrl(data.thumbnailUrl);
        setUploadedAt(
          data.uploadedAt instanceof Date ? data.uploadedAt : new Date(data.uploadedAt)
        );
        setDuration(data.duration);
        setMetadataFetched(true);
      } catch (err) {
        setError(
          `Could not fetch video info: ${err instanceof Error ? err.message : "Unknown error"}`
        );
        setMetadataFetched(false);
      } finally {
        setIsFetchingMetadata(false);
      }
    },
    [utils.video.getYoutubeMetadata]
  );

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    if (isValidYoutubeUrl(newUrl)) {
      const id = extractYoutubeId(newUrl);
      if (id && id !== youtubeId) {
        setYoutubeId(id);
        setMetadataFetched(false);
        setError("");
        fetchMetadata(id);
      }
    } else {
      setYoutubeId(null);
      setMetadataFetched(false);
    }
  };

  const filterPlayers = (search: string) => {
    if (!players.data || !search.trim()) return players.data || [];
    const lower = search.toLowerCase();
    return players.data.filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        p.aliases?.some((a) => a.toLowerCase().includes(lower))
    );
  };

  const player1Options = filterPlayers(player1Search);
  const player2Options = filterPlayers(player2Search);
  const selectedPlayer1 = players.data?.find((p) => p.id === player1Id);
  const selectedPlayer2 = players.data?.find((p) => p.id === player2Id);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!youtubeId || !metadataFetched) {
      setError("Please enter a valid YouTube URL");
      return;
    }

    if (!player1Id || !player2Id) {
      setError("Please select both players");
      return;
    }

    if (player1Id === player2Id) {
      setError("Players must be different");
      return;
    }

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

    await adminSubmit.mutateAsync({
      url,
      youtubeId,
      title,
      channelName,
      thumbnailUrl: thumbnailUrl || undefined,
      uploadedAt: uploadedAt || undefined,
      duration: duration || undefined,
      player1Id,
      player2Id,
      player1Score: score1,
      player2Score: score2,
      isOfficial,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-card p-6">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold">Add Game</h2>
            <p className="text-sm text-muted-foreground">
              Submit a game directly (instant approval)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded p-1 hover:bg-secondary"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section: Video */}
          <div className="space-y-4">
            <h3 className="border-b pb-2 text-lg font-semibold">Video</h3>
            <div className="space-y-2">
              <label htmlFor="admin-url" className="text-sm font-medium">
                YouTube URL *
              </label>
              <input
                id="admin-url"
                type="url"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm"
              />
              {isFetchingMetadata && (
                <p className="text-sm text-muted-foreground">Fetching video info...</p>
              )}
            </div>

            {/* Video Preview */}
            {metadataFetched && thumbnailUrl && (
              <div className="flex gap-4 rounded border bg-secondary/30 p-4">
                <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded">
                  <Image src={thumbnailUrl} alt={title} fill className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-2 font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground">{channelName}</p>
                  {uploadedAt && (
                    <p className="text-xs text-muted-foreground">
                      Uploaded {uploadedAt.toLocaleDateString()}
                    </p>
                  )}
                  {duration && (
                    <p className="text-xs text-muted-foreground">
                      Duration: {formatDuration(duration)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section: Game Details */}
          <div className="space-y-4">
            <h3 className="border-b pb-2 text-lg font-semibold">Game Details</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="admin-p1-search" className="text-sm font-medium">
                  Player 1 *
                </label>
                <input
                  id="admin-p1-search"
                  type="text"
                  value={player1Search}
                  onChange={(e) => {
                    setPlayer1Search(e.target.value);
                    setPlayer1Id("");
                  }}
                  placeholder="Search players..."
                  className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm"
                />
                {player1Search && !player1Id && (
                  <div className="max-h-40 overflow-y-auto rounded border bg-background">
                    {player1Options.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        No players found.{" "}
                        <Link href="/admin/players" className="text-primary hover:underline">
                          Create new
                        </Link>
                      </div>
                    ) : (
                      player1Options.slice(0, 10).map((player) => (
                        <button
                          key={player.id}
                          type="button"
                          onClick={() => {
                            setPlayer1Id(player.id);
                            setPlayer1Search(player.name);
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-secondary"
                        >
                          {player.name}
                        </button>
                      ))
                    )}
                  </div>
                )}
                {selectedPlayer1 && (
                  <div className="rounded bg-green-100 px-3 py-2 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-200">
                    ✓ {selectedPlayer1.name}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="admin-p1-score" className="text-sm font-medium">
                  Score *
                </label>
                <input
                  id="admin-p1-score"
                  type="number"
                  min="0"
                  value={player1Score}
                  onChange={(e) => setPlayer1Score(e.target.value)}
                  placeholder="0"
                  className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="-my-2 flex items-center justify-center">
              <span className="font-heading text-sm font-bold text-muted-foreground">VS</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="admin-p2-search" className="text-sm font-medium">
                  Player 2 *
                </label>
                <input
                  id="admin-p2-search"
                  type="text"
                  value={player2Search}
                  onChange={(e) => {
                    setPlayer2Search(e.target.value);
                    setPlayer2Id("");
                  }}
                  placeholder="Search players..."
                  className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm"
                />
                {player2Search && !player2Id && (
                  <div className="max-h-40 overflow-y-auto rounded border bg-background">
                    {player2Options.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        No players found.{" "}
                        <Link href="/admin/players" className="text-primary hover:underline">
                          Create new
                        </Link>
                      </div>
                    ) : (
                      player2Options.slice(0, 10).map((player) => (
                        <button
                          key={player.id}
                          type="button"
                          onClick={() => {
                            setPlayer2Id(player.id);
                            setPlayer2Search(player.name);
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-secondary"
                        >
                          {player.name}
                        </button>
                      ))
                    )}
                  </div>
                )}
                {selectedPlayer2 && (
                  <div className="rounded bg-green-100 px-3 py-2 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-200">
                    ✓ {selectedPlayer2.name}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="admin-p2-score" className="text-sm font-medium">
                  Score *
                </label>
                <input
                  id="admin-p2-score"
                  type="number"
                  min="0"
                  value={player2Score}
                  onChange={(e) => setPlayer2Score(e.target.value)}
                  placeholder="0"
                  className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>

            {/* Official Toggle */}
            <div className="flex items-center gap-3 pt-2">
              <input
                id="admin-official"
                type="checkbox"
                checked={isOfficial}
                onChange={(e) => setIsOfficial(e.target.checked)}
                className="h-4 w-4 rounded"
              />
              <label htmlFor="admin-official" className="text-sm font-medium">
                Official Game
              </label>
              <span className="text-xs text-muted-foreground">(competitive match)</span>
            </div>
          </div>

          {error && (
            <div className="rounded bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded border bg-secondary px-4 py-2 font-medium hover:bg-secondary/80"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={adminSubmit.isPending || !metadataFetched || !player1Id || !player2Id}
              className="flex-1 rounded bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {adminSubmit.isPending ? "Adding..." : "Add Game"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// Types
// ============================================================================

interface Submission {
  id: string;
  youtubeId: string;
  url: string;
  title: string;
  channelName: string;
  thumbnailUrl: string | null;
  status: VideoStatus;
  createdAt: Date;
  submitterEmail: string | null;
  submitterNote: string | null;
  submittedPlayer1Name: string | null;
  submittedPlayer2Name: string | null;
  submittedPlayer1Score: number | null;
  submittedPlayer2Score: number | null;
  game: {
    id: string;
    player1: { id: string; name: string };
    player2: { id: string; name: string };
  } | null;
}

interface ApprovalModalProps {
  submission: Submission;
  onClose: () => void;
  onApprove: () => void;
}

function ApprovalModal({ submission, onClose, onApprove }: ApprovalModalProps) {
  const utils = trpc.useUtils();
  const [player1Id, setPlayer1Id] = useState("");
  const [player2Id, setPlayer2Id] = useState("");
  const [player1Score, setPlayer1Score] = useState(
    submission.submittedPlayer1Score?.toString() ?? ""
  );
  const [player2Score, setPlayer2Score] = useState(
    submission.submittedPlayer2Score?.toString() ?? ""
  );
  const [player1Search, setPlayer1Search] = useState(submission.submittedPlayer1Name ?? "");
  const [player2Search, setPlayer2Search] = useState(submission.submittedPlayer2Name ?? "");
  const [isOfficial, setIsOfficial] = useState(false);
  const [error, setError] = useState("");

  // Query all players for matching
  const players = trpc.player.getAll.useQuery({ limit: 1000 });

  const approveWithGame = trpc.video.approveWithGame.useMutation({
    onSuccess: () => {
      utils.video.getAll.invalidate();
      utils.video.getStats.invalidate();
      onApprove();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  // Filter players based on search
  const filterPlayers = (search: string) => {
    if (!players.data || !search.trim()) return players.data || [];
    const lower = search.toLowerCase();
    return players.data.filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        p.aliases?.some((a) => a.toLowerCase().includes(lower))
    );
  };

  const player1Options = filterPlayers(player1Search);
  const player2Options = filterPlayers(player2Search);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!player1Id || !player2Id) {
      setError("Please select both players");
      return;
    }

    if (player1Id === player2Id) {
      setError("Players must be different");
      return;
    }

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

    await approveWithGame.mutateAsync({
      videoId: submission.id,
      player1Id,
      player2Id,
      player1Score: score1,
      player2Score: score2,
      isOfficial,
    });
  };

  const selectedPlayer1 = players.data?.find((p) => p.id === player1Id);
  const selectedPlayer2 = players.data?.find((p) => p.id === player2Id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-card p-6">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold">Approve Game</h2>
            <p className="text-sm text-muted-foreground">Match players and confirm the score</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded p-1 hover:bg-secondary"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Video Preview */}
        <div className="mb-6 flex gap-4 rounded border bg-secondary/30 p-4">
          {submission.thumbnailUrl && (
            <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded">
              <Image
                src={submission.thumbnailUrl}
                alt={submission.title}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 font-semibold">{submission.title}</h3>
            <p className="text-sm text-muted-foreground">{submission.channelName}</p>
            <a
              href={submission.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-xs text-primary hover:underline"
            >
              Watch on YouTube
            </a>
          </div>
        </div>

        {/* Submitted Info */}
        <div className="mb-6 rounded border bg-yellow-50 p-4 dark:bg-yellow-900/20">
          <h4 className="mb-2 text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Submitted by user:
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Player 1:</span>{" "}
              <strong>{submission.submittedPlayer1Name || "Not provided"}</strong>
              {" - "}
              <strong>{submission.submittedPlayer1Score ?? "?"}</strong>
            </div>
            <div>
              <span className="text-muted-foreground">Player 2:</span>{" "}
              <strong>{submission.submittedPlayer2Name || "Not provided"}</strong>
              {" - "}
              <strong>{submission.submittedPlayer2Score ?? "?"}</strong>
            </div>
          </div>
          {submission.submitterNote && (
            <p className="mt-2 text-xs text-muted-foreground">Note: "{submission.submitterNote}"</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Player 1 Matching */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="player1-search" className="text-sm font-medium">
                Player 1 (match to official player)
              </label>
              <input
                id="player1-search"
                type="text"
                value={player1Search}
                onChange={(e) => {
                  setPlayer1Search(e.target.value);
                  setPlayer1Id("");
                }}
                placeholder="Search players..."
                className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {player1Search && !player1Id && (
                <div className="max-h-40 overflow-y-auto rounded border bg-background">
                  {player1Options.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      No players found.{" "}
                      <Link href="/admin/players" className="text-primary hover:underline">
                        Create new player
                      </Link>
                    </div>
                  ) : (
                    player1Options.slice(0, 10).map((player) => (
                      <button
                        key={player.id}
                        type="button"
                        onClick={() => {
                          setPlayer1Id(player.id);
                          setPlayer1Search(player.name);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-secondary"
                      >
                        {player.name}
                        {player.aliases && player.aliases.length > 0 && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({player.aliases.join(", ")})
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
              {selectedPlayer1 && (
                <div className="flex items-center gap-2 rounded bg-green-100 px-3 py-2 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-200">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Matched: {selectedPlayer1.name}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="player1-score" className="text-sm font-medium">
                Player 1 Score
              </label>
              <input
                id="player1-score"
                type="number"
                min="0"
                value={player1Score}
                onChange={(e) => setPlayer1Score(e.target.value)}
                required
                className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          <div className="-my-2 flex items-center justify-center">
            <span className="font-heading text-sm font-bold text-muted-foreground">VS</span>
          </div>

          {/* Player 2 Matching */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="player2-search" className="text-sm font-medium">
                Player 2 (match to official player)
              </label>
              <input
                id="player2-search"
                type="text"
                value={player2Search}
                onChange={(e) => {
                  setPlayer2Search(e.target.value);
                  setPlayer2Id("");
                }}
                placeholder="Search players..."
                className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {player2Search && !player2Id && (
                <div className="max-h-40 overflow-y-auto rounded border bg-background">
                  {player2Options.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      No players found.{" "}
                      <Link href="/admin/players" className="text-primary hover:underline">
                        Create new player
                      </Link>
                    </div>
                  ) : (
                    player2Options.slice(0, 10).map((player) => (
                      <button
                        key={player.id}
                        type="button"
                        onClick={() => {
                          setPlayer2Id(player.id);
                          setPlayer2Search(player.name);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-secondary"
                      >
                        {player.name}
                        {player.aliases && player.aliases.length > 0 && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({player.aliases.join(", ")})
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
              {selectedPlayer2 && (
                <div className="flex items-center gap-2 rounded bg-green-100 px-3 py-2 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-200">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Matched: {selectedPlayer2.name}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="player2-score" className="text-sm font-medium">
                Player 2 Score
              </label>
              <input
                id="player2-score"
                type="number"
                min="0"
                value={player2Score}
                onChange={(e) => setPlayer2Score(e.target.value)}
                required
                className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          {/* Official Game Toggle */}
          <div className="flex items-center gap-3">
            <input
              id="is-official"
              type="checkbox"
              checked={isOfficial}
              onChange={(e) => setIsOfficial(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="is-official" className="text-sm font-medium">
              Official Game
            </label>
            <span className="text-xs text-muted-foreground">
              (competitive match, not casual pickup)
            </span>
          </div>

          {error && (
            <div className="rounded bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded border bg-secondary px-4 py-2 font-medium text-secondary-foreground hover:bg-secondary/80"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={approveWithGame.isPending || !player1Id || !player2Id}
              className="flex-1 rounded bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {approveWithGame.isPending ? "Approving..." : "Approve & Publish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminSubmissionsPage() {
  const [statusFilter, setStatusFilter] = useState<VideoStatus | "ALL">("PENDING");
  const [approvalSubmission, setApprovalSubmission] = useState<Submission | null>(null);
  const [showAdminSubmit, setShowAdminSubmit] = useState(false);
  const utils = trpc.useUtils();

  const submissions = trpc.video.getAll.useQuery({
    status: statusFilter === "ALL" ? undefined : statusFilter,
  });

  const rejectMutation = trpc.video.reject.useMutation({
    onSuccess: () => {
      utils.video.getAll.invalidate();
      utils.video.getStats.invalidate();
    },
  });

  const deleteMutation = trpc.video.delete.useMutation({
    onSuccess: () => {
      utils.video.getAll.invalidate();
      utils.video.getStats.invalidate();
    },
  });

  const reopenMutation = trpc.video.reopen.useMutation({
    onSuccess: () => {
      utils.video.getAll.invalidate();
      utils.video.getStats.invalidate();
    },
  });

  const handleReject = async (id: string) => {
    // eslint-disable-next-line no-alert -- confirmation before destructive action
    const confirmed = window.confirm(
      "Reject this submission?\n\nIt will be marked as rejected but stay in the database."
    );
    if (confirmed) {
      await rejectMutation.mutateAsync({ id });
    }
  };

  const handleDelete = async (id: string, title: string) => {
    // eslint-disable-next-line no-alert -- confirmation before destructive action
    const confirmed = window.confirm(
      `PERMANENTLY DELETE this submission?\n\n"${title}"\n\nThis removes it from the database entirely and allows re-submission.`
    );
    if (confirmed) {
      await deleteMutation.mutateAsync({ id });
    }
  };

  const handleReopen = async (id: string) => {
    // eslint-disable-next-line no-alert
    if (window.confirm("Move this submission back to pending for review?")) {
      await reopenMutation.mutateAsync({ id });
    }
  };

  const getStatusBadge = (status: VideoStatus) => {
    const colors = {
      PENDING: "bg-yellow-100 text-yellow-800",
      PROCESSING: "bg-blue-100 text-blue-800",
      COMPLETED: "bg-green-100 text-green-800",
      FAILED: "bg-red-100 text-red-800",
    };
    return colors[status];
  };

  const getStatusLabel = (status: VideoStatus | "ALL") => {
    const labels = {
      ALL: "All",
      PENDING: "Pending",
      PROCESSING: "Processing",
      COMPLETED: "Approved",
      FAILED: "Rejected",
    };
    return labels[status];
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <PageHeader
            title="Submissions"
            subtitle="Review and manage user submissions"
            className="mb-0"
          />
          <button
            type="button"
            onClick={() => setShowAdminSubmit(true)}
            className="shrink-0 rounded bg-primary px-6 py-3 font-heading text-sm font-medium uppercase tracking-wider text-primary-foreground transition hover:bg-primary/90"
          >
            + Add Game
          </button>
        </div>

        {/* Filter */}
        <section className="mb-6">
          <h2 className="mb-3 font-heading text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Filter by Status
          </h2>
          <div className="flex flex-wrap gap-2">
            {(["ALL", "PENDING", "COMPLETED", "FAILED"] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`rounded px-4 py-2 font-heading text-sm uppercase tracking-wide transition ${
                  statusFilter === status
                    ? "bg-primary text-primary-foreground"
                    : "border bg-card text-muted-foreground hover:border-primary hover:text-foreground"
                }`}
              >
                {getStatusLabel(status)}
              </button>
            ))}
          </div>
        </section>

        {/* Submissions List */}
        <div className="space-y-4">
          {submissions.isLoading && (
            <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
              Loading...
            </div>
          )}
          {!submissions.isLoading && submissions.data?.length === 0 && (
            <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
              No submissions found
            </div>
          )}
          {!submissions.isLoading &&
            submissions.data &&
            submissions.data.map((submission) => (
              <div key={submission.id} className="overflow-hidden rounded-lg border bg-card">
                <div className="flex gap-4 p-4">
                  {/* Thumbnail */}
                  {submission.thumbnailUrl && (
                    <div className="relative aspect-video w-48 shrink-0 overflow-hidden rounded">
                      <Image
                        src={submission.thumbnailUrl}
                        alt={submission.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  {/* Submission Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="line-clamp-1 font-semibold">{submission.title}</h3>
                        <p className="text-sm text-muted-foreground">{submission.channelName}</p>
                      </div>
                      <span
                        className={`shrink-0 rounded px-2 py-1 text-xs ${getStatusBadge(submission.status)}`}
                      >
                        {getStatusLabel(submission.status)}
                      </span>
                    </div>

                    {/* Submitted Game Info */}
                    {(submission.submittedPlayer1Name || submission.submittedPlayer2Name) && (
                      <div className="mt-3 rounded bg-secondary/50 p-3">
                        <p className="text-sm">
                          <span className="font-medium">
                            {submission.submittedPlayer1Name || "?"}
                          </span>
                          <span className="mx-2 font-bold">
                            {submission.submittedPlayer1Score ?? "?"} -{" "}
                            {submission.submittedPlayer2Score ?? "?"}
                          </span>
                          <span className="font-medium">
                            {submission.submittedPlayer2Name || "?"}
                          </span>
                        </p>
                      </div>
                    )}

                    {/* Approved Game Info */}
                    {submission.game && (
                      <div className="mt-3 rounded bg-green-100 p-3 dark:bg-green-900/30">
                        <p className="text-sm text-green-800 dark:text-green-200">
                          <span className="font-medium">{submission.game.player1.name}</span>
                          <span className="mx-2">vs</span>
                          <span className="font-medium">{submission.game.player2.name}</span>
                          <span className="ml-2 text-xs">(approved)</span>
                        </p>
                      </div>
                    )}

                    {/* Submission Meta */}
                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span>Submitted {new Date(submission.createdAt).toLocaleDateString()}</span>
                      {submission.submitterEmail && <span>{submission.submitterEmail}</span>}
                    </div>
                    {submission.submitterNote && (
                      <p className="mt-1 text-xs italic text-muted-foreground">
                        "{submission.submitterNote}"
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 flex-col gap-2">
                    <a
                      href={submission.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded bg-secondary px-4 py-2 text-center text-sm text-secondary-foreground hover:bg-secondary/80"
                    >
                      Watch
                    </a>

                    {/* PENDING: Approve, Reject, Delete */}
                    {submission.status === VideoStatus.PENDING && (
                      <>
                        <button
                          type="button"
                          onClick={() => setApprovalSubmission(submission as unknown as Submission)}
                          className="rounded bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(submission.id)}
                          disabled={rejectMutation.isPending}
                          className="rounded bg-orange-600 px-4 py-2 text-sm text-white hover:bg-orange-700 disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(submission.id, submission.title)}
                          disabled={deleteMutation.isPending}
                          className="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </>
                    )}

                    {/* COMPLETED: Manage Game */}
                    {submission.status === VideoStatus.COMPLETED && submission.game && (
                      <Link
                        href="/admin/games"
                        className="rounded bg-blue-600 px-4 py-2 text-center text-sm text-white hover:bg-blue-700"
                      >
                        Manage Game
                      </Link>
                    )}

                    {/* FAILED: Re-open, Delete */}
                    {submission.status === VideoStatus.FAILED && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleReopen(submission.id)}
                          disabled={reopenMutation.isPending}
                          className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          Re-open
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(submission.id, submission.title)}
                          disabled={deleteMutation.isPending}
                          className="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Approval Modal */}
      {approvalSubmission && (
        <ApprovalModal
          submission={approvalSubmission}
          onClose={() => setApprovalSubmission(null)}
          onApprove={() => setApprovalSubmission(null)}
        />
      )}

      {/* Admin Submit Modal */}
      {showAdminSubmit && (
        <AdminSubmitModal
          onClose={() => setShowAdminSubmit(false)}
          onSuccess={() => setShowAdminSubmit(false)}
        />
      )}
    </div>
  );
}
