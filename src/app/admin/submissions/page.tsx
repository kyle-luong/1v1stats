/**
 * Admin Submissions Page
 * Review, approve, categorize, and manage video submissions
 * Handles both user-submitted and scraped videos
 */

"use client";

import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc/client";
import { VideoStatus, VideoCategory } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { extractYoutubeId, isValidYoutubeUrl } from "@/lib/youtube";
import { PageHeader } from "@/components/common/PageHeader";

// Category display names
const CATEGORY_LABELS: Record<VideoCategory, string> = {
  UNCATEGORIZED: "Uncategorized",
  ONE_V_ONE: "1v1",
  SPAR: "Spar/Practice",
  TWO_V_TWO: "2v2",
  THREE_V_THREE: "3v3",
  FIVE_V_FIVE: "5v5",
  TAG_TEAM: "Tag Team",
  REACTION: "Reaction",
  MISC: "Misc",
};

// ============================================================================
// Admin Direct Submit Modal
// ============================================================================

interface AdminSubmitModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function AdminSubmitModal({ onClose, onSuccess }: AdminSubmitModalProps) {
  const utils = trpc.useUtils();

  const [url, setUrl] = useState("");
  const [youtubeId, setYoutubeId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [channelName, setChannelName] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [uploadedAt, setUploadedAt] = useState<Date | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [metadataFetched, setMetadataFetched] = useState(false);

  const [category, setCategory] = useState<VideoCategory>(VideoCategory.ONE_V_ONE);
  const [isCompetitive, setIsCompetitive] = useState(true);
  const [player1Id, setPlayer1Id] = useState("");
  const [player2Id, setPlayer2Id] = useState("");
  const [player1Search, setPlayer1Search] = useState("");
  const [player2Search, setPlayer2Search] = useState("");
  const [player1Score, setPlayer1Score] = useState("");
  const [player2Score, setPlayer2Score] = useState("");
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

    if (category === VideoCategory.ONE_V_ONE) {
      if (!player1Id || !player2Id) {
        setError("Please select both players for 1v1");
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
        category,
        isCompetitive,
        player1Id,
        player2Id,
        player1Score: score1,
        player2Score: score2,
      });
    } else {
      await adminSubmit.mutateAsync({
        url,
        youtubeId,
        title,
        channelName,
        thumbnailUrl: thumbnailUrl || undefined,
        uploadedAt: uploadedAt || undefined,
        duration: duration || undefined,
        category,
        isCompetitive: false,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-card p-6">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold">Add Video</h2>
            <p className="text-sm text-muted-foreground">
              Submit a video directly (instant approval)
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
          {/* Video URL */}
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

          {/* Category Selection */}
          <div className="space-y-4">
            <h3 className="border-b pb-2 text-lg font-semibold">Category</h3>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(CATEGORY_LABELS)
                .filter(([key]) => key !== "UNCATEGORIZED")
                .map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategory(key as VideoCategory)}
                    className={`rounded px-3 py-2 text-sm font-medium transition ${
                      category === key
                        ? "bg-primary text-primary-foreground"
                        : "border bg-background hover:bg-secondary"
                    }`}
                  >
                    {label}
                  </button>
                ))}
            </div>
          </div>

          {/* Game Details (1v1 only) */}
          {category === VideoCategory.ONE_V_ONE && (
            <div className="space-y-4">
              <h3 className="border-b pb-2 text-lg font-semibold">Game Details</h3>

              <div className="flex items-center gap-3">
                <input
                  id="admin-competitive"
                  type="checkbox"
                  checked={isCompetitive}
                  onChange={(e) => setIsCompetitive(e.target.checked)}
                  className="h-4 w-4 rounded"
                />
                <label htmlFor="admin-competitive" className="text-sm font-medium">
                  Competitive Game
                </label>
                <span className="text-xs text-muted-foreground">(affects player stats)</span>
              </div>

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
                      Selected: {selectedPlayer1.name}
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
                      Selected: {selectedPlayer2.name}
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
            </div>
          )}

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
              disabled={adminSubmit.isPending || !metadataFetched}
              className="flex-1 rounded bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {adminSubmit.isPending ? "Adding..." : "Add Video"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// Approval Modal for PENDING submissions
// ============================================================================

interface ApprovalModalProps {
  submission: {
    id: string;
    youtubeId: string;
    url: string;
    title: string;
    channelName: string;
    thumbnailUrl: string | null;
    submittedCategory: VideoCategory | null;
    submittedIsCompetitive: boolean | null;
    submittedPlayer1Name: string | null;
    submittedPlayer2Name: string | null;
    submittedPlayer1Score: number | null;
    submittedPlayer2Score: number | null;
    submitterNote: string | null;
  };
  onClose: () => void;
  onApprove: () => void;
}

function ApprovalModal({ submission, onClose, onApprove }: ApprovalModalProps) {
  const utils = trpc.useUtils();
  const [category, setCategory] = useState<VideoCategory>(
    submission.submittedCategory || VideoCategory.ONE_V_ONE
  );
  const [isCompetitive, setIsCompetitive] = useState(submission.submittedIsCompetitive ?? true);
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
  const [error, setError] = useState("");

  const players = trpc.player.getAll.useQuery({ limit: 1000 });

  const approveWithGame = trpc.video.approveWithGame.useMutation({
    onSuccess: () => {
      utils.video.getAll.invalidate();
      utils.video.getStats.invalidate();
      utils.game.getAll.invalidate();
      onApprove();
    },
    onError: (err) => setError(err.message),
  });

  const categorize = trpc.video.categorize.useMutation({
    onSuccess: () => {
      utils.video.getAll.invalidate();
      utils.video.getStats.invalidate();
      onApprove();
    },
    onError: (err) => setError(err.message),
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (category === VideoCategory.ONE_V_ONE) {
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
        category,
        isCompetitive,
        player1Id,
        player2Id,
        player1Score: score1,
        player2Score: score2,
      });
    } else {
      await categorize.mutateAsync({
        videoId: submission.id,
        category,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-card p-6">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold">Approve Video</h2>
            <p className="text-sm text-muted-foreground">Categorize and approve this submission</p>
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

        {/* User Submitted Info */}
        {(submission.submittedPlayer1Name || submission.submitterNote) && (
          <div className="mb-6 rounded border bg-yellow-50 p-4 dark:bg-yellow-900/20">
            <h4 className="mb-2 text-sm font-medium text-yellow-800 dark:text-yellow-200">
              User submitted:
            </h4>
            {submission.submittedCategory && (
              <p className="text-sm">
                Category: <strong>{CATEGORY_LABELS[submission.submittedCategory]}</strong>
              </p>
            )}
            {submission.submittedPlayer1Name && (
              <p className="text-sm">
                {submission.submittedPlayer1Name} ({submission.submittedPlayer1Score ?? "?"}) vs{" "}
                {submission.submittedPlayer2Name} ({submission.submittedPlayer2Score ?? "?"})
              </p>
            )}
            {submission.submitterNote && (
              <p className="mt-2 text-xs text-muted-foreground">
                Note: "{submission.submitterNote}"
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Selection */}
          <div className="space-y-4">
            <h3 className="border-b pb-2 text-lg font-semibold">Category</h3>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(CATEGORY_LABELS)
                .filter(([key]) => key !== "UNCATEGORIZED")
                .map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategory(key as VideoCategory)}
                    className={`rounded px-3 py-2 text-sm font-medium transition ${
                      category === key
                        ? "bg-primary text-primary-foreground"
                        : "border bg-background hover:bg-secondary"
                    }`}
                  >
                    {label}
                  </button>
                ))}
            </div>
          </div>

          {/* Game Details (1v1 only) */}
          {category === VideoCategory.ONE_V_ONE && (
            <div className="space-y-4">
              <h3 className="border-b pb-2 text-lg font-semibold">Game Details</h3>

              <div className="flex items-center gap-3">
                <input
                  id="approval-competitive"
                  type="checkbox"
                  checked={isCompetitive}
                  onChange={(e) => setIsCompetitive(e.target.checked)}
                  className="h-4 w-4 rounded"
                />
                <label htmlFor="approval-competitive" className="text-sm font-medium">
                  Competitive Game
                </label>
                <span className="text-xs text-muted-foreground">(affects player stats)</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="approval-p1-search" className="text-sm font-medium">
                    Player 1
                  </label>
                  <input
                    id="approval-p1-search"
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
                          No players.{" "}
                          <Link href="/admin/players" className="text-primary hover:underline">
                            Create
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
                    <div className="rounded bg-green-100 px-3 py-2 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-200">
                      Matched: {selectedPlayer1.name}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label htmlFor="approval-p1-score" className="text-sm font-medium">
                    Score
                  </label>
                  <input
                    id="approval-p1-score"
                    type="number"
                    min="0"
                    value={player1Score}
                    onChange={(e) => setPlayer1Score(e.target.value)}
                    required
                    className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="-my-2 flex items-center justify-center">
                <span className="font-heading text-sm font-bold text-muted-foreground">VS</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="approval-p2-search" className="text-sm font-medium">
                    Player 2
                  </label>
                  <input
                    id="approval-p2-search"
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
                          No players.{" "}
                          <Link href="/admin/players" className="text-primary hover:underline">
                            Create
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
                    <div className="rounded bg-green-100 px-3 py-2 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-200">
                      Matched: {selectedPlayer2.name}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label htmlFor="approval-p2-score" className="text-sm font-medium">
                    Score
                  </label>
                  <input
                    id="approval-p2-score"
                    type="number"
                    min="0"
                    value={player2Score}
                    onChange={(e) => setPlayer2Score(e.target.value)}
                    required
                    className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

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
              disabled={approveWithGame.isPending || categorize.isPending}
              className="flex-1 rounded bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {approveWithGame.isPending || categorize.isPending ? "Approving..." : "Approve"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function AdminSubmissionsPage() {
  const [statusFilter, setStatusFilter] = useState<VideoStatus | "ALL">("PENDING");
  const [approvalSubmission, setApprovalSubmission] = useState<
    ApprovalModalProps["submission"] | null
  >(null);
  const [showAdminSubmit, setShowAdminSubmit] = useState(false);
  const utils = trpc.useUtils();

  const submissions = trpc.video.getAll.useQuery({
    status: statusFilter === "ALL" ? undefined : statusFilter,
    limit: 100,
  });

  const stats = trpc.video.getStats.useQuery();

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
    // eslint-disable-next-line no-alert
    if (window.confirm("Reject this submission?")) {
      await rejectMutation.mutateAsync({ id });
    }
  };

  const handleDelete = async (id: string, title: string) => {
    // eslint-disable-next-line no-alert
    if (window.confirm(`PERMANENTLY DELETE "${title}"?`)) {
      await deleteMutation.mutateAsync({ id });
    }
  };

  const handleReopen = async (id: string) => {
    // eslint-disable-next-line no-alert
    if (window.confirm("Move back to review?")) {
      await reopenMutation.mutateAsync({ id });
    }
  };

  const getStatusBadge = (status: VideoStatus) => {
    const colors = {
      SCRAPED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
      PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200",
      APPROVED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200",
      REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200",
    };
    return colors[status];
  };

  const getStatusLabel = (status: VideoStatus | "ALL") => {
    const labels = {
      ALL: "All",
      SCRAPED: "Scraped",
      PENDING: "Pending",
      APPROVED: "Approved",
      REJECTED: "Rejected",
    };
    return labels[status];
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <PageHeader
            title="Submissions"
            subtitle="Review and manage video submissions"
            className="mb-0"
          />
          <button
            type="button"
            onClick={() => setShowAdminSubmit(true)}
            className="shrink-0 rounded bg-primary px-6 py-3 font-heading text-sm font-medium uppercase tracking-wider text-primary-foreground transition hover:bg-primary/90"
          >
            + Add Video
          </button>
        </div>

        {/* Stats */}
        {stats.data && (
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="text-2xl font-bold">{stats.data.byStatus.scraped}</div>
              <div className="text-sm text-muted-foreground">Scraped</div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-2xl font-bold">{stats.data.byStatus.pending}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-2xl font-bold">{stats.data.byStatus.approved}</div>
              <div className="text-sm text-muted-foreground">Approved</div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-2xl font-bold">{stats.data.byStatus.rejected}</div>
              <div className="text-sm text-muted-foreground">Rejected</div>
            </div>
          </div>
        )}

        {/* Filter */}
        <section className="mb-6">
          <h2 className="mb-3 font-heading text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Filter by Status
          </h2>
          <div className="flex flex-wrap gap-2">
            {(["ALL", "SCRAPED", "PENDING", "APPROVED", "REJECTED"] as const).map((status) => (
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

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="line-clamp-1 font-semibold">{submission.title}</h3>
                        <p className="text-sm text-muted-foreground">{submission.channelName}</p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <span
                          className={`rounded px-2 py-1 text-xs ${getStatusBadge(submission.status)}`}
                        >
                          {getStatusLabel(submission.status)}
                        </span>
                        {submission.category !== VideoCategory.UNCATEGORIZED && (
                          <span className="rounded bg-secondary px-2 py-1 text-xs">
                            {CATEGORY_LABELS[submission.category]}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Submitted info */}
                    {submission.submittedPlayer1Name && (
                      <div className="mt-3 rounded bg-secondary/50 p-3">
                        <p className="text-sm">
                          <span className="font-medium">{submission.submittedPlayer1Name}</span>
                          <span className="mx-2 font-bold">
                            {submission.submittedPlayer1Score ?? "?"} -{" "}
                            {submission.submittedPlayer2Score ?? "?"}
                          </span>
                          <span className="font-medium">{submission.submittedPlayer2Name}</span>
                        </p>
                      </div>
                    )}

                    {/* Approved game info */}
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

                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span>Added {new Date(submission.createdAt).toLocaleDateString()}</span>
                      {submission.submitterEmail && <span>{submission.submitterEmail}</span>}
                      {submission.scrapedAt && <span>Auto-scraped</span>}
                    </div>
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

                    {/* SCRAPED: Full categorization or reject */}
                    {submission.status === VideoStatus.SCRAPED && (
                      <>
                        <button
                          type="button"
                          onClick={() => setApprovalSubmission(submission)}
                          className="rounded bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
                        >
                          Categorize
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(submission.id)}
                          disabled={rejectMutation.isPending}
                          className="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {/* PENDING: Approve or reject */}
                    {submission.status === VideoStatus.PENDING && (
                      <>
                        <button
                          type="button"
                          onClick={() => setApprovalSubmission(submission)}
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

                    {/* APPROVED: Link to manage */}
                    {submission.status === VideoStatus.APPROVED && submission.game && (
                      <Link
                        href={`/games/${submission.game.id}`}
                        className="rounded bg-blue-600 px-4 py-2 text-center text-sm text-white hover:bg-blue-700"
                      >
                        View Game
                      </Link>
                    )}

                    {/* REJECTED: Re-open or delete */}
                    {submission.status === VideoStatus.REJECTED && (
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

      {/* Modals */}
      {approvalSubmission && (
        <ApprovalModal
          submission={approvalSubmission}
          onClose={() => setApprovalSubmission(null)}
          onApprove={() => setApprovalSubmission(null)}
        />
      )}
      {showAdminSubmit && (
        <AdminSubmitModal
          onClose={() => setShowAdminSubmit(false)}
          onSuccess={() => setShowAdminSubmit(false)}
        />
      )}
    </div>
  );
}
